import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WorkOrder } from './entities/work-order.entity';
import { Repository } from 'typeorm';
import { DiligenceDto } from './dto/diligence.dto';

@Injectable()
export class WorkOrdersService {
  constructor(
    @InjectRepository(WorkOrder)
    private readonly workOrderRepository: Repository<WorkOrder>,
  ) {}

  async findMyWorkOrders(userId: string): Promise<WorkOrder[]> {
    return await this.workOrderRepository.find({
      where: { technicianId: userId },
      relations: { client: true, quoteRequest: true },
      order: { createdAt: 'DESC' },
    });
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
}
