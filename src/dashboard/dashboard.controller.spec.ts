import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DashboardStatsResponseDto } from './dto/dashboard-stats-response.dto';

describe('DashboardController', () => {
  let dashboardController: DashboardController;
  let getStatsMock: jest.Mock<Promise<DashboardStatsResponseDto>, []>;

  beforeEach(() => {
    getStatsMock = jest.fn<Promise<DashboardStatsResponseDto>, []>();

    const dashboardService = {
      getStats: getStatsMock,
    } as unknown as DashboardService;

    dashboardController = new DashboardController(dashboardService);
  });

  it('debe devolver estadísticas del dashboard', async () => {
    const response: DashboardStatsResponseDto = {
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
    };

    getStatsMock.mockResolvedValue(response);

    const result = await dashboardController.getStats();

    expect(getStatsMock).toHaveBeenCalledTimes(1);
    expect(result).toBe(response);
  });
});
