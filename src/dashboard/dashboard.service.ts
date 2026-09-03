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
    ]);

    return this.buildResponse({
      totalQuotes,
      totalWorkOrders: 0,
      totalProjects,
      totalProducts,
      newQuotes,
      inProgressQuotes,
      resolvedQuotes,
      rejectedQuotes,
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
        PENDING: 0,
        IN_PROGRESS: 0,
        COMPLETED: 0,
      },
    };
  }
}
