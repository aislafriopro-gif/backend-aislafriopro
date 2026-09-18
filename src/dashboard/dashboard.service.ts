import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import {
  QuoteRequest,
  QuoteRequestStatus,
} from '../quote-requests/entities/quote-request.entity';
import { Project } from '../projects/entities/project.entity';
import { Product } from '../products/entities/product.entity';
import { DashboardStatsResponseDto } from './dto/dashboard-stats-response.dto';
import { RoleName } from '../roles/entities/roles.entity';
import {
  WorkOrder,
  WorkOrderStatus,
} from '../work-orders/entities/work-order.entity';
import { Client } from '../clients/entities/client.entity';

interface DashboardRequestUser {
  userId: string;
  email: string;
  role: RoleName;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(QuoteRequest)
    private readonly quoteRequestRepository: Repository<QuoteRequest>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(WorkOrder)
    private readonly workOrderRepository: Repository<WorkOrder>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {}

  async getStats(
    requestUser: DashboardRequestUser,
  ): Promise<DashboardStatsResponseDto> {
    if (requestUser.role === RoleName.CLIENT) {
      return this.getClientStats(requestUser);
    }

    if (requestUser.role === RoleName.TECHNICIAN) {
      return this.getTechnicianStats(requestUser.userId);
    }

    return this.getAdminStats();
  }

  private async getAdminStats(): Promise<DashboardStatsResponseDto> {
    const [
      totalQuotes,
      newQuotes,
      inProgressQuotes,
      resolvedQuotes,
      rejectedQuotes,
      totalProjects,
      totalProducts,
      totalWorkOrders,
      pendingWorkOrders,
      inProgressWorkOrders,
      completedWorkOrders,
    ] = await Promise.all([
      this.quoteRequestRepository.count(),
      this.quoteRequestRepository.count({
        where: { status: QuoteRequestStatus.NEW },
      }),
      this.quoteRequestRepository.count({
        where: { status: QuoteRequestStatus.IN_PROGRESS },
      }),
      this.quoteRequestRepository.count({
        where: { status: QuoteRequestStatus.RESOLVED },
      }),
      this.quoteRequestRepository.count({
        where: { status: QuoteRequestStatus.REJECTED },
      }),
      this.projectRepository.count({
        where: { deletedAt: IsNull() },
      }),
      this.productRepository.count({
        where: { deletedAt: IsNull() },
      }),
      this.workOrderRepository.count(),
      this.workOrderRepository.count({
        where: { status: WorkOrderStatus.PENDING },
      }),
      this.workOrderRepository.count({
        where: { status: WorkOrderStatus.IN_PROGRESS },
      }),
      this.workOrderRepository.count({
        where: { status: WorkOrderStatus.COMPLETED },
      }),
    ]);

    return this.buildResponse({
      totalQuotes,
      totalWorkOrders,
      totalProjects,
      totalProducts,
      newQuotes,
      inProgressQuotes,
      resolvedQuotes,
      rejectedQuotes,
      pendingWorkOrders,
      inProgressWorkOrders,
      completedWorkOrders,
    });
  }

  private async getClientStats(
    requestUser: DashboardRequestUser,
  ): Promise<DashboardStatsResponseDto> {
    const client = await this.clientRepository.findOne({
      where: { userId: requestUser.userId },
    });

    const clientId = client?.id;

    const [
      totalQuotes,
      newQuotes,
      inProgressQuotes,
      resolvedQuotes,
      rejectedQuotes,
      pendingWorkOrders,
      inProgressWorkOrders,
      completedWorkOrders,
    ] = await Promise.all([
      this.quoteRequestRepository.count({
        where: { email: requestUser.email },
      }),
      this.quoteRequestRepository.count({
        where: { email: requestUser.email, status: QuoteRequestStatus.NEW },
      }),
      this.quoteRequestRepository.count({
        where: {
          email: requestUser.email,
          status: QuoteRequestStatus.IN_PROGRESS,
        },
      }),
      this.quoteRequestRepository.count({
        where: {
          email: requestUser.email,
          status: QuoteRequestStatus.RESOLVED,
        },
      }),
      this.quoteRequestRepository.count({
        where: {
          email: requestUser.email,
          status: QuoteRequestStatus.REJECTED,
        },
      }),
      clientId
        ? this.workOrderRepository.count({
            where: { clientId, status: WorkOrderStatus.PENDING },
          })
        : Promise.resolve(0),
      clientId
        ? this.workOrderRepository.count({
            where: { clientId, status: WorkOrderStatus.IN_PROGRESS },
          })
        : Promise.resolve(0),
      clientId
        ? this.workOrderRepository.count({
            where: { clientId, status: WorkOrderStatus.COMPLETED },
          })
        : Promise.resolve(0),
    ]);

    return this.buildResponse({
      totalQuotes,
      totalWorkOrders:
        pendingWorkOrders + inProgressWorkOrders + completedWorkOrders,
      totalProjects: 0,
      totalProducts: 0,
      newQuotes,
      inProgressQuotes,
      resolvedQuotes,
      rejectedQuotes,
      pendingWorkOrders,
      inProgressWorkOrders,
      completedWorkOrders,
    });
  }

  private async getTechnicianStats(
    technicianId: string,
  ): Promise<DashboardStatsResponseDto> {
    const [pendingWorkOrders, inProgressWorkOrders, completedWorkOrders] =
      await Promise.all([
        this.workOrderRepository.count({
          where: { technicianId, status: WorkOrderStatus.PENDING },
        }),
        this.workOrderRepository.count({
          where: { technicianId, status: WorkOrderStatus.IN_PROGRESS },
        }),
        this.workOrderRepository.count({
          where: { technicianId, status: WorkOrderStatus.COMPLETED },
        }),
      ]);

    return this.buildResponse({
      totalQuotes: 0,
      totalWorkOrders:
        pendingWorkOrders + inProgressWorkOrders + completedWorkOrders,
      totalProjects: 0,
      totalProducts: 0,
      newQuotes: 0,
      inProgressQuotes: 0,
      resolvedQuotes: 0,
      rejectedQuotes: 0,
      pendingWorkOrders,
      inProgressWorkOrders,
      completedWorkOrders,
    });
  }

  private buildResponse(input: {
    totalQuotes: number;
    totalWorkOrders: number;
    totalProjects: number;
    totalProducts: number;
    newQuotes: number;
    inProgressQuotes: number;
    resolvedQuotes: number;
    rejectedQuotes: number;
    pendingWorkOrders: number;
    inProgressWorkOrders: number;
    completedWorkOrders: number;
  }): DashboardStatsResponseDto {
    return {
      totalQuotes: input.totalQuotes,
      totalWorkOrders: input.totalWorkOrders,
      totalProjects: input.totalProjects,
      totalProducts: input.totalProducts,
      quotesByStatus: {
        NEW: input.newQuotes,
        IN_PROGRESS: input.inProgressQuotes,
        RESOLVED: input.resolvedQuotes,
        REJECTED: input.rejectedQuotes,
      },
      workOrdersByStatus: {
        PENDING: input.pendingWorkOrders,
        IN_PROGRESS: input.inProgressWorkOrders,
        COMPLETED: input.completedWorkOrders,
      },
    };
  }
}
