import { IsNull, Repository } from 'typeorm';
import {
  QuoteRequest,
  QuoteRequestStatus,
} from '../quote-requests/entities/quote-request.entity';
import { Product } from '../products/entities/product.entity';
import { Project } from '../projects/entities/project.entity';
import { DashboardService } from './dashboard.service';
import { RoleName } from '../roles/entities/roles.entity';

describe('DashboardService', () => {
  let dashboardService: DashboardService;

  let countQuoteRequestsMock: jest.Mock<Promise<number>, [unknown?]>;
  let countProjectsMock: jest.Mock<Promise<number>, [unknown?]>;
  let countProductsMock: jest.Mock<Promise<number>, [unknown?]>;

  beforeEach(() => {
    countQuoteRequestsMock = jest
      .fn<Promise<number>, [unknown?]>()
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1);

    countProjectsMock = jest
      .fn<Promise<number>, [unknown?]>()
      .mockResolvedValue(6);
    countProductsMock = jest
      .fn<Promise<number>, [unknown?]>()
      .mockResolvedValue(12);

    const quoteRequestRepository = {
      count: countQuoteRequestsMock,
    } as unknown as Repository<QuoteRequest>;

    const projectRepository = {
      count: countProjectsMock,
    } as unknown as Repository<Project>;

    const productRepository = {
      count: countProductsMock,
    } as unknown as Repository<Product>;

    dashboardService = new DashboardService(
      quoteRequestRepository,
      projectRepository,
      productRepository,
    );
  });

  it('debe devolver estadísticas reales para el dashboard', async () => {
    const result = await dashboardService.getStats({
      userId: 'admin-user-id',
      email: 'admin@aislafriopro.com',
      role: RoleName.ADMIN,
    });

    expect(result).toEqual({
      totalQuotes: 10,
      totalWorkOrders: 0,
      totalProjects: 6,
      totalProducts: 12,
      quotesByStatus: {
        NEW: 4,
        IN_PROGRESS: 3,
        RESOLVED: 2,
        REJECTED: 1,
      },
      workOrdersByStatus: {
        PENDING: 0,
        IN_PROGRESS: 0,
        COMPLETED: 0,
      },
    });

    expect(countQuoteRequestsMock).toHaveBeenNthCalledWith(1);
    expect(countQuoteRequestsMock).toHaveBeenNthCalledWith(2, {
      where: { status: QuoteRequestStatus.NEW },
    });
    expect(countQuoteRequestsMock).toHaveBeenNthCalledWith(3, {
      where: { status: QuoteRequestStatus.IN_PROGRESS },
    });
    expect(countQuoteRequestsMock).toHaveBeenNthCalledWith(4, {
      where: { status: QuoteRequestStatus.RESOLVED },
    });
    expect(countQuoteRequestsMock).toHaveBeenNthCalledWith(5, {
      where: { status: QuoteRequestStatus.REJECTED },
    });
    expect(countProjectsMock).toHaveBeenCalledWith({
      where: { deletedAt: IsNull() },
    });
    expect(countProductsMock).toHaveBeenCalledWith({
      where: { deletedAt: IsNull() },
    });
  });

  it('debe devolver solo estadísticas propias para CLIENT', async () => {
    countQuoteRequestsMock = jest
      .fn<Promise<number>, [unknown?]>()
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1);

    const quoteRequestRepository = {
      count: countQuoteRequestsMock,
    } as unknown as Repository<QuoteRequest>;

    dashboardService = new DashboardService(
      quoteRequestRepository,
      { count: countProjectsMock } as unknown as Repository<Project>,
      { count: countProductsMock } as unknown as Repository<Product>,
    );

    const result = await dashboardService.getStats({
      userId: 'client-user-id',
      email: 'client@aislafriopro.com',
      role: RoleName.CLIENT,
    });

    expect(result).toEqual({
      totalQuotes: 5,
      totalWorkOrders: 0,
      totalProjects: 0,
      totalProducts: 0,
      quotesByStatus: {
        NEW: 2,
        IN_PROGRESS: 1,
        RESOLVED: 1,
        REJECTED: 1,
      },
      workOrdersByStatus: {
        PENDING: 0,
        IN_PROGRESS: 0,
        COMPLETED: 0,
      },
    });

    expect(countQuoteRequestsMock).toHaveBeenNthCalledWith(1, {
      where: { email: 'client@aislafriopro.com' },
    });
    expect(countQuoteRequestsMock).toHaveBeenNthCalledWith(2, {
      where: {
        email: 'client@aislafriopro.com',
        status: QuoteRequestStatus.NEW,
      },
    });
    expect(countProjectsMock).not.toHaveBeenCalled();
    expect(countProductsMock).not.toHaveBeenCalled();
  });

  it('debe devolver estadísticas vacías para TECHNICIAN mientras no exista WorkOrder', async () => {
    const result = await dashboardService.getStats({
      userId: 'technician-user-id',
      email: 'technician@aislafriopro.com',
      role: RoleName.TECHNICIAN,
    });

    expect(result).toEqual({
      totalQuotes: 0,
      totalWorkOrders: 0,
      totalProjects: 0,
      totalProducts: 0,
      quotesByStatus: {
        NEW: 0,
        IN_PROGRESS: 0,
        RESOLVED: 0,
        REJECTED: 0,
      },
      workOrdersByStatus: {
        PENDING: 0,
        IN_PROGRESS: 0,
        COMPLETED: 0,
      },
    });

    expect(countQuoteRequestsMock).not.toHaveBeenCalled();
    expect(countProjectsMock).not.toHaveBeenCalled();
    expect(countProductsMock).not.toHaveBeenCalled();
  });
});
