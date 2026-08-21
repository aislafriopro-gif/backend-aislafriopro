import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import {
  PaginationParamsDto,
  PaginatedResponse,
  buildPaginatedResponse,
} from '../common/pagination';
import {
  QuoteRequest,
  QuoteRequestStatus,
} from './entities/quote-request.entity';
import { Service } from '../services/entities/service.entity';
import { CreateQuoteRequestDto } from './dto/create-quote-request.dto';
import { QuoteRequestNote } from './notes/quote-request-note.entity';

@Injectable()
export class QuoteRequestsService {
  constructor(
    @InjectRepository(QuoteRequest)
    private readonly quoteRequestRepository: Repository<QuoteRequest>,
    @InjectRepository(QuoteRequestNote)
    private readonly quoteRequestNoteRepository: Repository<QuoteRequestNote>,
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

  async findAll(
    pagination: PaginationParamsDto,
    filters?: { status?: QuoteRequestStatus },
  ): Promise<PaginatedResponse<QuoteRequest>> {
    const query = this.quoteRequestRepository
      .createQueryBuilder('quoteRequest')
      .leftJoinAndSelect('quoteRequest.service', 'service')
      .leftJoinAndSelect('quoteRequest.notes', 'notes')
      .orderBy('quoteRequest.createdAt', 'DESC')
      .skip(pagination.offset)
      .take(pagination.limit);

    if (filters?.status) {
      query.andWhere('quoteRequest.status = :status', {
        status: filters.status,
      });
    }

    const [data, total] = await query.getManyAndCount();

    return buildPaginatedResponse(
      data,
      total,
      pagination.page,
      pagination.limit,
    );
  }

  async findOne(id: string): Promise<QuoteRequest> {
    const quoteRequest = await this.quoteRequestRepository.findOne({
      where: { id },
      relations: ['service', 'notes'],
    });

    if (!quoteRequest) {
      throw new NotFoundException(`Quote request with id "${id}" not found`);
    }

    return quoteRequest;
  }

  async addNote(
    quoteRequestId: string,
    content: string,
  ): Promise<QuoteRequestNote> {
    const quoteRequest = await this.quoteRequestRepository.findOne({
      where: { id: quoteRequestId },
    });

    if (!quoteRequest) {
      throw new NotFoundException(
        `Quote request with id "${quoteRequestId}" not found`,
      );
    }

    const note = this.quoteRequestNoteRepository.create({
      quoteRequest,
      note: content,
    });

    return this.quoteRequestNoteRepository.save(note);
  }

  async updateStatus(
    id: string,
    status: QuoteRequestStatus,
  ): Promise<QuoteRequest> {
    const quoteRequest = await this.quoteRequestRepository.findOne({
      where: { id },
      relations: ['service', 'notes'],
    });

    if (!quoteRequest) {
      throw new NotFoundException(`Quote request with id "${id}" not found`);
    }

    quoteRequest.status = status;

    return this.quoteRequestRepository.save(quoteRequest);
  }
}
