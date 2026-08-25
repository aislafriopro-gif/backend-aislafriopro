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

  async getStats(): Promise<DashboardStatsResponseDto> {
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

    return {
      totalQuotes,
      totalWorkOrders: 0,
      totalProjects,
      totalProducts,
      quotesByStatus: {
        NEW: newQuotes,
        IN_PROGRESS: inProgressQuotes,
        RESOLVED: resolvedQuotes,
        REJECTED: rejectedQuotes,
      },
      // ToDo: reemplazar por conteos reales cuando exista WorkOrder.
      workOrdersByStatus: {
        PENDING: 0,
        IN_PROGRESS: 0,
        COMPLETED: 0,
      },
    };
  }
}
