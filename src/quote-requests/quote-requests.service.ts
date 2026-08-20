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
    const serviceId = createQuoteRequestDto.serviceId?.trim();
    const materials = createQuoteRequestDto.materials?.trim();
    const message = createQuoteRequestDto.message.trim();

    let service: Service | null = null;

    if (serviceId) {
      service = await this.serviceRepository.findOne({
        where: { id: serviceId, deletedAt: IsNull() },
      });

      if (!service) {
        throw new BadRequestException(
          'El servicio indicado en serviceId no existe o no está disponible.',
        );
      }
    }

    const quoteRequest = this.quoteRequestRepository.create({
      name: createQuoteRequestDto.name.trim(),
      email: createQuoteRequestDto.email.trim(),
      phone: createQuoteRequestDto.phone.trim(),
      service,
      message,
      materials: materials || null,
      status: QuoteRequestStatus.NEW,
    });

    return this.quoteRequestRepository.save(quoteRequest);
  }
}
