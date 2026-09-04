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
  ) {}

  async getStats(
    requestUser: DashboardRequestUser,
  ): Promise<DashboardStatsResponseDto> {
    if (requestUser.role === RoleName.CLIENT) {
      return this.getClientStats(requestUser.email);
    }

    if (requestUser.role === RoleName.TECHNICIAN) {
      return this.getTechnicianStats();
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
    email: string,
  ): Promise<DashboardStatsResponseDto> {
    const [
      totalQuotes,
      newQuotes,
      inProgressQuotes,
      resolvedQuotes,
      rejectedQuotes,
    ] = await Promise.all([
      this.quoteRequestRepository.count({
        where: { email },
      }),
      this.quoteRequestRepository.count({
        where: { email, status: QuoteRequestStatus.NEW },
      }),
      this.quoteRequestRepository.count({
        where: { email, status: QuoteRequestStatus.IN_PROGRESS },
      }),
      this.quoteRequestRepository.count({
        where: { email, status: QuoteRequestStatus.RESOLVED },
      }),
      this.quoteRequestRepository.count({
        where: { email, status: QuoteRequestStatus.REJECTED },
      }),
    ]);

    return this.buildResponse({
      totalQuotes,
      totalWorkOrders: 0,
      totalProjects: 0,
      totalProducts: 0,
      newQuotes,
      inProgressQuotes,
      resolvedQuotes,
      rejectedQuotes,
      pendingWorkOrders: 0,
      inProgressWorkOrders: 0,
      completedWorkOrders: 0,
    });
  }

  private getTechnicianStats(): DashboardStatsResponseDto {
    return this.buildResponse({
      totalQuotes: 0,
      totalWorkOrders: 0,
      totalProjects: 0,
      totalProducts: 0,
      newQuotes: 0,
      inProgressQuotes: 0,
      resolvedQuotes: 0,
      rejectedQuotes: 0,
      pendingWorkOrders: 0,
      inProgressWorkOrders: 0,
      completedWorkOrders: 0,
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
      // TODO: integrar conteos reales de WorkOrder en dashboard/stats.
      workOrdersByStatus: {
        PENDING: input.pendingWorkOrders,
        IN_PROGRESS: input.inProgressWorkOrders,
        COMPLETED: input.completedWorkOrders,
      },
    };
  }
}
