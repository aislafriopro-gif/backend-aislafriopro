import { Test } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { Product } from '../products/entities/product.entity';
import { Project } from '../projects/entities/project.entity';
import { QuoteRequest } from '../quote-requests/entities/quote-request.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardModule } from './dashboard.module';
import { DashboardService } from './dashboard.service';
import { Client } from '../clients/entities/client.entity';
import { WorkOrder } from '../work-orders/entities/work-order.entity';

describe('DashboardModule', () => {
  it('debe compilar el módulo', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [DashboardModule],
    })
      .overrideProvider(getRepositoryToken(QuoteRequest))
      .useValue({})
      .overrideProvider(getRepositoryToken(Project))
      .useValue({})
      .overrideProvider(getRepositoryToken(Product))
      .useValue({})
      .overrideProvider(getRepositoryToken(WorkOrder))
      .useValue({})
      .overrideProvider(getRepositoryToken(Client))
      .useValue({})
      .overrideProvider(getDataSourceToken())
      .useValue({
        createEntityManager: jest.fn(),
      })
      .compile();

    expect(moduleRef.get(DashboardService)).toBeInstanceOf(DashboardService);
    expect(moduleRef.get(DashboardController)).toBeInstanceOf(
      DashboardController,
    );
  });
});
