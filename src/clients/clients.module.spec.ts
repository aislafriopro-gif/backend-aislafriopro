import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QuoteRequest } from '../quote-requests/entities/quote-request.entity';
import { Client } from './entities/client.entity';
import { ClientsController } from './clients.controller';
import { ClientsModule } from './clients.module';
import { ClientsService } from './clients.service';

describe('ClientsModule', () => {
  it('debe compilar el módulo', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ClientsModule],
    })
      .overrideProvider(getRepositoryToken(Client))
      .useValue({})
      .overrideProvider(getRepositoryToken(QuoteRequest))
      .useValue({})
      .compile();

    expect(moduleRef.get(ClientsService)).toBeInstanceOf(ClientsService);
    expect(moduleRef.get(ClientsController)).toBeInstanceOf(ClientsController);
  });
});
