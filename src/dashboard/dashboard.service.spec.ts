import { IsNull, Repository } from 'typeorm';
import {
  QuoteRequest,
  QuoteRequestStatus,
} from '../quote-requests/entities/quote-request.entity';
import { Product } from '../products/entities/product.entity';
import { Project } from '../projects/entities/project.entity';
import { DashboardService } from './dashboard.service';
import { RoleName } from '../roles/entities/roles.entity';
import { Client } from '../clients/entities/client.entity';
import {
  WorkOrder,
  WorkOrderStatus,
} from '../work-orders/entities/work-order.entity';

describe('DashboardService', () => {
  let dashboardService: DashboardService;

  let countQuoteRequestsMock: jest.Mock<Promise<number>, [unknown?]>;
  let countProjectsMock: jest.Mock<Promise<number>, [unknown?]>;
  let countProductsMock: jest.Mock<Promise<number>, [unknown?]>;
  let countWorkOrdersMock: jest.Mock<Promise<number>, [unknown?]>;
  let findOneClientMock: jest.Mock<Promise<Client | null>, [unknown]>;

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

    countWorkOrdersMock = jest
      .fn<Promise<number>, [unknown?]>()
      .mockResolvedValueOnce(9)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(2);

    findOneClientMock = jest.fn<Promise<Client | null>, [unknown]>();

    const quoteRequestRepository = {
      count: countQuoteRequestsMock,
    } as unknown as Repository<QuoteRequest>;

    const projectRepository = {
      count: countProjectsMock,
    } as unknown as Repository<Project>;

    const productRepository = {
      count: countProductsMock,
    } as unknown as Repository<Product>;

    const workOrderRepository = {
      count: countWorkOrdersMock,
    } as unknown as Repository<WorkOrder>;

    const clientRepository = {
      findOne: findOneClientMock,
    } as unknown as Repository<Client>;

    dashboardService = new DashboardService(
      quoteRequestRepository,
      projectRepository,
      productRepository,
      workOrderRepository,
      clientRepository,
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
      totalWorkOrders: 9,
      totalProjects: 6,
      totalProducts: 12,
      quotesByStatus: {
        NEW: 4,
        IN_PROGRESS: 3,
        RESOLVED: 2,
        REJECTED: 1,
      },
      workOrdersByStatus: {
        PENDING: 3,
        IN_PROGRESS: 4,
        COMPLETED: 2,
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
    expect(countWorkOrdersMock).toHaveBeenNthCalledWith(1);
    expect(countWorkOrdersMock).toHaveBeenNthCalledWith(2, {
      where: { status: WorkOrderStatus.PENDING },
    });
    expect(countWorkOrdersMock).toHaveBeenNthCalledWith(3, {
      where: { status: WorkOrderStatus.IN_PROGRESS },
    });
    expect(countWorkOrdersMock).toHaveBeenNthCalledWith(4, {
      where: { status: WorkOrderStatus.COMPLETED },
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
    countWorkOrdersMock = jest
      .fn<Promise<number>, [unknown?]>()
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(3);

    findOneClientMock = jest
      .fn<Promise<Client | null>, [unknown]>()
      .mockResolvedValue({
        id: 'client-id',
        userId: 'client-user-id',
      } as Client);

    dashboardService = new DashboardService(
      quoteRequestRepository,
      { count: countProjectsMock } as unknown as Repository<Project>,
      { count: countProductsMock } as unknown as Repository<Product>,
      { count: countWorkOrdersMock } as unknown as Repository<WorkOrder>,
      { findOne: findOneClientMock } as unknown as Repository<Client>,
    );

    const result = await dashboardService.getStats({
      userId: 'client-user-id',
      email: 'client@aislafriopro.com',
      role: RoleName.CLIENT,
    });

    expect(result).toEqual({
      totalQuotes: 5,
      totalWorkOrders: 6,
      totalProjects: 0,
      totalProducts: 0,
      quotesByStatus: {
        NEW: 2,
        IN_PROGRESS: 1,
        RESOLVED: 1,
        REJECTED: 1,
      },
      workOrdersByStatus: {
        PENDING: 2,
        IN_PROGRESS: 1,
        COMPLETED: 3,
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
    expect(findOneClientMock).toHaveBeenCalledWith({
      where: { userId: 'client-user-id' },
    });
    expect(countWorkOrdersMock).toHaveBeenNthCalledWith(1, {
      where: { clientId: 'client-id', status: WorkOrderStatus.PENDING },
    });
    expect(countWorkOrdersMock).toHaveBeenNthCalledWith(2, {
      where: { clientId: 'client-id', status: WorkOrderStatus.IN_PROGRESS },
    });
    expect(countWorkOrdersMock).toHaveBeenNthCalledWith(3, {
      where: { clientId: 'client-id', status: WorkOrderStatus.COMPLETED },
    });
  });

  it('debe devolver estadísticas reales de OTs para TECHNICIAN', async () => {
    countWorkOrdersMock.mockReset();
    countWorkOrdersMock
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(4);

    const result = await dashboardService.getStats({
      userId: 'technician-user-id',
      email: 'technician@aislafriopro.com',
      role: RoleName.TECHNICIAN,
    });

    expect(result).toEqual({
      totalQuotes: 0,
      totalWorkOrders: 7,
      totalProjects: 0,
      totalProducts: 0,
      quotesByStatus: {
        NEW: 0,
        IN_PROGRESS: 0,
        RESOLVED: 0,
        REJECTED: 0,
      },
      workOrdersByStatus: {
        PENDING: 1,
        IN_PROGRESS: 2,
        COMPLETED: 4,
      },
    });

    expect(countQuoteRequestsMock).not.toHaveBeenCalled();
    expect(countProjectsMock).not.toHaveBeenCalled();
    expect(countProductsMock).not.toHaveBeenCalled();
    expect(countWorkOrdersMock).toHaveBeenNthCalledWith(1, {
      where: {
        technicianId: 'technician-user-id',
        status: WorkOrderStatus.PENDING,
      },
    });
    expect(countWorkOrdersMock).toHaveBeenNthCalledWith(2, {
      where: {
        technicianId: 'technician-user-id',
        status: WorkOrderStatus.IN_PROGRESS,
      },
    });
    expect(countWorkOrdersMock).toHaveBeenNthCalledWith(3, {
      where: {
        technicianId: 'technician-user-id',
        status: WorkOrderStatus.COMPLETED,
      },
    });
  });
});
