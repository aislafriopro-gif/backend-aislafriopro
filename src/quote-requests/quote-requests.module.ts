import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuoteRequest } from './entities/quote-request.entity';
import { QuoteRequestNote } from './notes/quote-request-note.entity';
import { Service } from '../services/entities/service.entity';
import { QuoteRequestsService } from './quote-requests.service';
import { QuoteRequestsController } from './quote-requests.controller';

@Module({
  imports: [TypeOrmModule.forFeature([QuoteRequest, QuoteRequestNote, Service])],
  controllers: [QuoteRequestsController],
  providers: [QuoteRequestsService],
  exports: [],
})
export class QuoteRequestsModule {}
