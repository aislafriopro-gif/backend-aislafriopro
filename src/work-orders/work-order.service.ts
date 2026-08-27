import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WorkOrder } from './entities/work-order.entity';
import { Repository } from 'typeorm';
import { DiligenceDto } from './dto/diligence.dto';
import { WorkOrderImage } from './media/entities/work-order-image.entity';
import { CloudinaryService } from '../media/cloudinary.service';

@Injectable()
export class WorkOrdersService {
  constructor(
    @InjectRepository(WorkOrder)
    private readonly workOrderRepository: Repository<WorkOrder>,
    @InjectRepository(WorkOrderImage)
    private readonly workOrderImageRepository: Repository<WorkOrderImage>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async findMyWorkOrders(userId: string): Promise<WorkOrder[]> {
    return await this.workOrderRepository.find({
      where: { technicianId: userId },
      relations: { client: true, quoteRequest: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<WorkOrder | null> {
    return this.workOrderRepository.findOne({ where: { id } });
  }

  async diligenceWorkOrder(
    id: string,
    userId: string,
    dto: DiligenceDto,
  ): Promise<WorkOrder> {
    // Buscar la orden con el técnico asignado
    const workOrder = await this.workOrderRepository.findOne({
      where: { id },
      relations: { technician: true },
    });

    if (!workOrder) {
      throw new NotFoundException('Orden de trabajo no encontrada');
    }

    // Verificar que el usuario autenticado sea el técnico asignado
    if (workOrder.technicianId !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para diligenciar esta OT',
      );
    }

    // Actualizar los campos
    workOrder.workDone = dto.workDone;
    workOrder.observations = dto.observations;
    workOrder.materials = dto.materials; // se guarda como JSON array

    return await this.workOrderRepository.save(workOrder);
  }

  async addPhotos(
    workOrderId: string,
    userId: string,
    files: Express.Multer.File[],
  ): Promise<{ url: string; publicId: string }[]> {
    // Validar que la OT existe y pertenece al técnico
    const workOrder = await this.workOrderRepository.findOne({
      where: { id: workOrderId },
    });
    if (!workOrder) {
      throw new NotFoundException('Orden de trabajo no encontrada');
    }
    if (workOrder.technicianId !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para subir fotos a esta OT',
      );
    }

    // Subir cada archivo a Cloudinary y guardar en BD
    const results: { url: string; publicId: string }[] = [];
    for (const file of files) {
      // Validar tipo y tamaño (CloudinaryService ya lo hace, pero podemos hacerlo aquí también)
      const uploadResult = await this.cloudinaryService.uploadImage(
        {
          buffer: file.buffer,
          mimetype: file.mimetype,
          size: file.size,
          originalname: file.originalname,
        },
        userId,
      ); // El segundo parámetro es uploadedById (opcional)

      // Guardar en work_order_images
      const image = this.workOrderImageRepository.create({
        workOrderId,
        url: uploadResult.url,
        publicId: uploadResult.publicId,
      });
      await this.workOrderImageRepository.save(image);

      results.push({
        url: image.url,
        publicId: image.publicId,
      });
    }

    return results;
  }
}
