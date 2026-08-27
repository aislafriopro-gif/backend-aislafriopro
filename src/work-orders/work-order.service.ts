import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import 'multer';
import { AuditAction } from '../audit/entities/audit-action.entity';
import { AuditService } from '../audit/audit.service';
import {
  PaginatedResponse,
  buildPaginatedResponse,
} from '../common/pagination';
import { Client } from '../clients/entities/client.entity';
import { CloudinaryService } from '../media/cloudinary.service';
import { QuoteRequest } from '../quote-requests/entities/quote-request.entity';
import { RoleName } from '../roles/entities/roles.entity';
import { User } from '../users/entities/user.entity';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { DiligenceDto } from './dto/diligence.dto';
import { FindWorkOrdersQueryDto } from './dto/find-work-orders-query.dto';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto';
import { WorkOrder, WorkOrderStatus } from './entities/work-order.entity';
import { WorkOrderImage } from './media/entities/work-order-image.entity';

const ALLOWED_STATUS_TRANSITIONS: Record<
  WorkOrderStatus,
  WorkOrderStatus[]
> = {
  [WorkOrderStatus.PENDING]: [WorkOrderStatus.IN_PROGRESS],
  [WorkOrderStatus.IN_PROGRESS]: [WorkOrderStatus.COMPLETED],
  [WorkOrderStatus.COMPLETED]: [],
};

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
    query: FindWorkOrdersQueryDto,
  ): Promise<PaginatedResponse<WorkOrder>> {
    const workOrderQuery = this.workOrderRepository
      .createQueryBuilder('workOrder')
      .leftJoinAndSelect('workOrder.client', 'client')
      .leftJoinAndSelect('client.user', 'clientUser')
      .leftJoinAndSelect('workOrder.technician', 'technician')
      .leftJoinAndSelect('workOrder.quoteRequest', 'quoteRequest')
      .leftJoinAndSelect('workOrder.images', 'images')
      .orderBy('workOrder.createdAt', 'DESC')
      .skip(query.offset)
      .take(query.limit);

    if (query.technicianId !== undefined) {
      workOrderQuery.andWhere('workOrder.technicianId = :technicianId', {
        technicianId: query.technicianId,
      });
    }

    if (query.clientId !== undefined) {
      workOrderQuery.andWhere('workOrder.clientId = :clientId', {
        clientId: query.clientId,
      });
    }

    if (query.quoteRequestId !== undefined) {
      workOrderQuery.andWhere(
        'workOrder.quoteRequestId = :quoteRequestId',
        { quoteRequestId: query.quoteRequestId },
      );
    }

    if (query.status !== undefined) {
      workOrderQuery.andWhere('workOrder.status = :status', {
        status: query.status,
      });
    }

    const [data, total] = await workOrderQuery.getManyAndCount();

    return buildPaginatedResponse(
      data,
      total,
      query.page,
      query.limit,
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

  async updateStatus(
    id: string,
    newStatus: WorkOrderStatus,
    userId?: string,
  ): Promise<WorkOrder> {
    const workOrder = await this.workOrderRepository.findOneBy({ id });

    if (!workOrder) {
      throw new NotFoundException(`Work order with id "${id}" not found`);
    }

    const currentStatus = workOrder.status;
    const allowedStatuses = ALLOWED_STATUS_TRANSITIONS[currentStatus];

    if (!allowedStatuses.includes(newStatus)) {
      throw new BadRequestException(
        `No se puede cambiar de ${currentStatus} a ${newStatus}`,
      );
    }

    const previousData = this.auditData(workOrder);
    workOrder.status = newStatus;
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

