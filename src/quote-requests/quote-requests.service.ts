import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { QuoteRequest, QuoteRequestStatus } from './entities/quote-request.entity';
import { Service } from '../services/entities/service.entity';
import { CreateQuoteRequestDto } from './dto/create-quote-request.dto';

@Injectable()
export class QuoteRequestsService {
  constructor(
    @InjectRepository(QuoteRequest)
    private readonly quoteRequestRepository: Repository<QuoteRequest>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
  ) {}

  async create(
    createQuoteRequestDto: CreateQuoteRequestDto,
  ): Promise<QuoteRequest> {
    const service = await this.serviceRepository.findOne({
      where: { id: createQuoteRequestDto.serviceId, deletedAt: IsNull() },
    });

    if (!service) {
      throw new BadRequestException(
        'El servicio indicado en serviceId no existe o no está disponible.',
      );
    }

    const quoteRequest = this.quoteRequestRepository.create({
      name: createQuoteRequestDto.name,
      email: createQuoteRequestDto.email,
      phone: createQuoteRequestDto.phone,
      service,
      message: createQuoteRequestDto.message,
      status: QuoteRequestStatus.NEW,
    });

    return this.quoteRequestRepository.save(quoteRequest);
  }
}
