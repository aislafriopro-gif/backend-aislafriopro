import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import 'multer';
import PDFDocument from 'pdfkit';
import { AuditAction } from '../audit/entities/audit-action.entity';
import { AuditService } from '../audit/audit.service';
import {
  PaginatedResponse,
  PaginationParamsDto,
  buildPaginatedResponse,
} from '../common/pagination';
import { Client } from '../clients/entities/client.entity';
import { CloudinaryService } from '../media/cloudinary.service';
import { QuoteRequest } from '../quote-requests/entities/quote-request.entity';
import { RoleName } from '../roles/entities/roles.entity';
import { User } from '../users/entities/user.entity';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { DiligenceDto } from './dto/diligence.dto';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto';
import { WorkOrder, WorkOrderStatus } from './entities/work-order.entity';
import { WorkOrderImage } from './media/entities/work-order-image.entity';

interface PdfUser {
  userId?: string;
  id?: string;
  role?: { name?: string };
}

@Injectable()
export class WorkOrdersService {
  constructor(
    @InjectRepository(WorkOrder)
    private readonly workOrderRepository: Repository<WorkOrder>,
    @InjectRepository(WorkOrderImage)
    private readonly workOrderImageRepository: Repository<WorkOrderImage>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(QuoteRequest)
    private readonly quoteRequestRepository: Repository<QuoteRequest>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly auditService: AuditService,
  ) {}

  async findMyWorkOrders(userId: string): Promise<WorkOrder[]> {
    return await this.workOrderRepository.find({
      where: { technicianId: userId },
      relations: { client: true, quoteRequest: true, images: true },
      order: { createdAt: 'DESC' },
    });
  }

  async create(
    createWorkOrderDto: CreateWorkOrderDto,
    userId?: string,
  ): Promise<WorkOrder> {
    const client = await this.clientRepository.findOneBy({
      id: createWorkOrderDto.clientId,
    });
    if (!client) {
      throw new NotFoundException(
        `Client with id "${createWorkOrderDto.clientId}" not found`,
      );
    }

    const technician = createWorkOrderDto.technicianId
      ? await this.findTechnician(createWorkOrderDto.technicianId)
      : null;
    const quoteRequest = createWorkOrderDto.quoteRequestId
      ? await this.quoteRequestRepository.findOneBy({
          id: createWorkOrderDto.quoteRequestId,
        })
      : null;

    if (createWorkOrderDto.quoteRequestId && !quoteRequest) {
      throw new NotFoundException(
        `Quote request with id "${createWorkOrderDto.quoteRequestId}" not found`,
      );
    }

    const workOrder = this.workOrderRepository.create({
      clientId: client.id,
      client,
      technicianId: technician?.id ?? null,
      technician,
      quoteRequestId: quoteRequest?.id ?? null,
      quoteRequest,
      status: WorkOrderStatus.PENDING,
    });
    const saved = await this.workOrderRepository.save(workOrder);

    await this.auditService.log({
      action: AuditAction.CREATE,
      entityName: 'WorkOrder',
      entityId: saved.id,
      userId: userId ?? null,
      previousData: null,
      newData: this.auditData(saved),
    });

    return this.findOne(saved.id);
  }

  async findAll(
    pagination: PaginationParamsDto,
  ): Promise<PaginatedResponse<WorkOrder>> {
    const [data, total] = await this.workOrderRepository
      .createQueryBuilder('workOrder')
      .leftJoinAndSelect('workOrder.client', 'client')
      .leftJoinAndSelect('client.user', 'clientUser')
      .leftJoinAndSelect('workOrder.technician', 'technician')
      .leftJoinAndSelect('workOrder.quoteRequest', 'quoteRequest')
      .leftJoinAndSelect('workOrder.images', 'images')
      .orderBy('workOrder.createdAt', 'DESC')
      .skip(pagination.offset)
      .take(pagination.limit)
      .getManyAndCount();

    return buildPaginatedResponse(
      data,
      total,
      pagination.page,
      pagination.limit,
    );
  }

  async findOne(id: string): Promise<WorkOrder> {
    const workOrder = await this.workOrderRepository
      .createQueryBuilder('workOrder')
      .leftJoinAndSelect('workOrder.client', 'client')
      .leftJoinAndSelect('client.user', 'clientUser')
      .leftJoinAndSelect('workOrder.technician', 'technician')
      .leftJoinAndSelect('workOrder.quoteRequest', 'quoteRequest')
      .leftJoinAndSelect('workOrder.images', 'images')
      .where('workOrder.id = :id', { id })
      .getOne();

    if (!workOrder) {
      throw new NotFoundException(`Work order with id "${id}" not found`);
    }

    return workOrder;
  }

  async update(
    id: string,
    updateWorkOrderDto: UpdateWorkOrderDto,
    userId?: string,
  ): Promise<WorkOrder> {
    const workOrder = await this.workOrderRepository.findOneBy({ id });
    if (!workOrder) {
      throw new NotFoundException(`Work order with id "${id}" not found`);
    }

    const previousData = this.auditData(workOrder);
    const updateData: Partial<WorkOrder> = {
      status: updateWorkOrderDto.status,
      workDone: updateWorkOrderDto.workDone,
      observations: updateWorkOrderDto.observations,
      materials: updateWorkOrderDto.materials,
    };

    if (updateWorkOrderDto.technicianId !== undefined) {
      const technician = await this.findTechnician(
        updateWorkOrderDto.technicianId,
      );
      updateData.technicianId = technician.id;
      updateData.technician = technician;
    }

    Object.keys(updateData).forEach((key) => {
      if (updateData[key as keyof WorkOrder] === undefined) {
        delete updateData[key as keyof WorkOrder];
      }
    });

    Object.assign(workOrder, updateData);
    const saved = await this.workOrderRepository.save(workOrder);

    await this.auditService.log({
      action: AuditAction.UPDATE,
      entityName: 'WorkOrder',
      entityId: saved.id,
      userId: userId ?? null,
      previousData,
      newData: this.auditData(saved),
    });

    return this.findOne(saved.id);
  }

  async diligenceWorkOrder(
    id: string,
    userId: string,
    dto: DiligenceDto,
  ): Promise<WorkOrder> {
    const workOrder = await this.workOrderRepository.findOneBy({ id });
    if (!workOrder) {
      throw new NotFoundException(`Work order with id "${id}" not found`);
    }

    if (workOrder.technicianId !== userId) {
      throw new ForbiddenException(
        'No tiene permisos para diligenciar esta orden de trabajo',
      );
    }

    const previousData = this.auditData(workOrder);

    workOrder.workDone = dto.workDone;
    workOrder.observations = dto.observations;
    workOrder.materials = dto.materials;
    workOrder.status = WorkOrderStatus.COMPLETED;

    const saved = await this.workOrderRepository.save(workOrder);

    await this.auditService.log({
      action: AuditAction.UPDATE,
      entityName: 'WorkOrder',
      entityId: saved.id,
      userId,
      previousData,
      newData: this.auditData(saved),
    });

    return this.findOne(saved.id);
  }

  async addPhotos(
    workOrderId: string,
    userId: string,
    files: Express.Multer.File[],
  ): Promise<Array<{ url: string; publicId: string }>> {
    const workOrder = await this.workOrderRepository.findOneBy({
      id: workOrderId,
    });
    if (!workOrder) {
      throw new NotFoundException(
        `Work order with id "${workOrderId}" not found`,
      );
    }

    if (workOrder.technicianId !== userId) {
      throw new ForbiddenException(
        'No tiene permisos para subir fotos a esta orden de trabajo',
      );
    }

    const uploadedImages: Array<{ url: string; publicId: string }> = [];

    for (const file of files) {
      const uploadResult = await this.cloudinaryService.uploadImage(
        file,
        userId,
      );
      const workOrderImage = this.workOrderImageRepository.create({
        workOrderId,
        url: uploadResult.secureUrl ?? uploadResult.url,
        publicId: uploadResult.publicId,
      });

      const savedImage =
        await this.workOrderImageRepository.save(workOrderImage);
      uploadedImages.push({
        url: savedImage.url,
        publicId: savedImage.publicId,
      });
    }

    return uploadedImages;
  }

  async generateWorkOrderPdf(id: string, user: PdfUser): Promise<Buffer> {
    const userId = user.userId ?? user.id;
    const userRole = user.role?.name;

    if (!userId) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    const workOrder = await this.workOrderRepository
      .createQueryBuilder('workOrder')
      .leftJoinAndSelect('workOrder.client', 'client')
      .leftJoinAndSelect('client.user', 'clientUser')
      .leftJoinAndSelect('workOrder.technician', 'technician')
      .leftJoinAndSelect('workOrder.quoteRequest', 'quoteRequest')
      .leftJoinAndSelect('quoteRequest.service', 'service')
      .leftJoinAndSelect('workOrder.images', 'images')
      .where('workOrder.id = :id', { id })
      .getOne();

    if (!workOrder) {
      throw new NotFoundException(`Work order with id "${id}" not found`);
    }

    if (userRole === RoleName.CLIENT) {
      if (!workOrder.client || workOrder.client.userId !== userId) {
        throw new ForbiddenException(
          'No tiene permisos para descargar esta orden',
        );
      }
    }

    const sortedMaterials = workOrder.materials
      ? [...workOrder.materials].sort((a, b) => a.name.localeCompare(b.name))
      : [];

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err: Error) => reject(err));

      // HEADER
      doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('ORDEN DE TRABAJO', { align: 'center' });
      doc.moveDown(0.5);
      doc
        .fontSize(12)
        .font('Helvetica')
        .text(`N° OT: ${workOrder.id}`, { align: 'center' });
      doc.moveDown(2);

      // CLIENTE
      doc.fontSize(16).font('Helvetica-Bold').text('DATOS DEL CLIENTE');
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica');
      doc.text(`Nombre: ${workOrder.client?.user?.name ?? 'N/A'}`);
      doc.text(`Email: ${workOrder.client?.user?.email ?? 'N/A'}`);
      doc.text(`Teléfono: ${workOrder.client?.user?.phone ?? 'N/A'}`);
      doc.moveDown(1.5);

      // SERVICIO Y COTIZACIÓN
      if (workOrder.quoteRequest) {
        doc.fontSize(16).font('Helvetica-Bold').text('SERVICIO Y COTIZACIÓN');
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica');
        if (workOrder.quoteRequest.service) {
          doc.text(`Servicio: ${workOrder.quoteRequest.service.name}`);
        }
        doc.text(`Cotización: ${workOrder.quoteRequest.name}`);
        doc.text(`Descripción: ${workOrder.quoteRequest.message ?? 'N/A'}`, {
          width: 500,
        });
        doc.moveDown(1.5);
      }

      // TÉCNICO
      doc.fontSize(16).font('Helvetica-Bold').text('TÉCNICO ASIGNADO');
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica');
      doc.text(`Nombre: ${workOrder.technician?.name ?? 'No asignado'}`);
      doc.text(`Email: ${workOrder.technician?.email ?? 'N/A'}`);
      doc.moveDown(1.5);

      // TRABAJO REALIZADO
      doc.fontSize(16).font('Helvetica-Bold').text('TRABAJO REALIZADO');
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica');
      doc.text(workOrder.workDone ?? 'No diligenciado', { width: 500 });
      doc.moveDown(1.5);

      // MATERIALES
      doc.fontSize(16).font('Helvetica-Bold').text('MATERIALES UTILIZADOS');
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);

      if (sortedMaterials.length > 0) {
        const tableTop = doc.y;
        doc.font('Helvetica-Bold').fontSize(11);
        doc.text('Nombre', 50, tableTop, { width: 350 });
        doc.text('Cantidad', 400, tableTop, { width: 150 });
        doc
          .moveTo(50, tableTop + 15)
          .lineTo(550, tableTop + 15)
          .stroke();

        doc.font('Helvetica').fontSize(10);
        let currentY = tableTop + 25;

        for (const material of sortedMaterials) {
          doc.text(material.name, 50, currentY, { width: 350 });
          doc.text(material.quantity.toString(), 400, currentY, {
            width: 150,
          });
          currentY += 18;
        }

        doc.y = currentY + 10;
        doc.x = 50;
      } else {
        doc.fontSize(11).text('No se registraron materiales');
        doc.moveDown(0.5);
      }
      doc.moveDown(1.5);

      // OBSERVACIONES
      doc.fontSize(16).font('Helvetica-Bold').text('OBSERVACIONES');
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica');
      doc.text(workOrder.observations ?? 'Sin observaciones', {
        width: 500,
        align: 'left',
      });
      doc.moveDown(1.5);

      // FOTOS
      if (workOrder.images && workOrder.images.length > 0) {
        if (doc.y > 650) {
          doc.addPage();
        }

        doc.fontSize(16).font('Helvetica-Bold').text('FOTOS DEL TRABAJO');
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(1);

        for (let i = 0; i < workOrder.images.length; i++) {
          const image = workOrder.images[i];

          if (doc.y > 650) {
            doc.addPage();
          }

          try {
            fetch(image.url)
              .then((response: Response) => {
                if (!response.ok) {
                  throw new Error(`Failed to download image: ${image.url}`);
                }
                return response.arrayBuffer();
              })
              .then((arrayBuffer: ArrayBuffer) => {
                const imageBuffer = Buffer.from(arrayBuffer);
                doc.image(imageBuffer, {
                  fit: [400, 400],
                  align: 'center',
                });
                doc.moveDown(0.5);
                doc
                  .fontSize(9)
                  .font('Helvetica')
                  .text(`Foto ${i + 1} de ${workOrder.images!.length}`, {
                    align: 'center',
                  });
                doc.moveDown(1);
              })
              .catch((error: Error) => {
                console.error(`Error loading image ${i + 1}:`, error);
                doc
                  .fontSize(10)
                  .font('Helvetica')
                  .text(`Error al cargar foto ${i + 1}`, { align: 'center' });
                doc.moveDown(1);
              });
          } catch (error) {
            const err =
              error instanceof Error ? error : new Error(String(error));
            console.error(`Error loading image ${i + 1}:`, err);
            doc
              .fontSize(10)
              .font('Helvetica')
              .text(`Error al cargar foto ${i + 1}`, { align: 'center' });
            doc.moveDown(1);
          }
        }
      }

      doc.end();
    });
  }

  private async findTechnician(id: string): Promise<User> {
    const technician = await this.userRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: { role: true },
    });

    if (!technician || technician.role?.name !== RoleName.TECHNICIAN) {
      throw new NotFoundException(`Technician with id "${id}" not found`);
    }

    return technician;
  }

  private auditData(workOrder: WorkOrder): Record<string, unknown> {
    return {
      id: workOrder.id,
      clientId: workOrder.clientId,
      technicianId: workOrder.technicianId ?? null,
      quoteRequestId: workOrder.quoteRequestId ?? null,
      status: workOrder.status,
      workDone: workOrder.workDone ?? null,
      observations: workOrder.observations ?? null,
      materials: workOrder.materials ?? null,
    };
  }
}
