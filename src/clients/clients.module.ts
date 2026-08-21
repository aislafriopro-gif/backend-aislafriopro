import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuoteRequest } from '../quote-requests/entities/quote-request.entity';
import { Client } from './entities/client.entity';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';

@Module({
  imports: [TypeOrmModule.forFeature([Client, QuoteRequest])],
  controllers: [ClientsController],
  providers: [ClientsService],
})
export class ClientsModule {}
