import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from '../products/entities/product.entity';
import { Project } from '../projects/entities/project.entity';
import { QuoteRequest } from '../quote-requests/entities/quote-request.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardModule } from './dashboard.module';
import { DashboardService } from './dashboard.service';

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
      .compile();

    expect(moduleRef.get(DashboardService)).toBeInstanceOf(DashboardService);
    expect(moduleRef.get(DashboardController)).toBeInstanceOf(
      DashboardController,
    );
  });
});
