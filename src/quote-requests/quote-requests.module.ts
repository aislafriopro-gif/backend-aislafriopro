import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuoteRequest } from './entities/quote-request.entity';
import { QuoteRequestNote } from './notes/quote-request-note.entity';

@Module({
  imports: [TypeOrmModule.forFeature([QuoteRequest, QuoteRequestNote])],
  controllers: [],
  providers: [],
  exports: [],
})
export class QuoteRequestsModule {}
