import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PaginationParamsDto,
  PaginatedResponse,
  buildPaginatedResponse,
} from '../common/pagination';
import { QuoteRequest } from '../quote-requests/entities/quote-request.entity';
import { Client } from './entities/client.entity';
import {
  ClientMeResponseDto,
  ClientProfileResponseDto,
  ClientQuoteRequestResponseDto,
} from './dto/client-me-response.dto';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(QuoteRequest)
    private readonly quoteRequestRepository: Repository<QuoteRequest>,
  ) {}

  async findAll(
    pagination: PaginationParamsDto,
  ): Promise<PaginatedResponse<ClientProfileResponseDto>> {
    const [clients, total] = await this.clientRepository.findAndCount({
      relations: { user: true },
      order: { createdAt: 'DESC' },
      skip: pagination.offset,
      take: pagination.limit,
    });

    return buildPaginatedResponse(
      clients.map((client) => this.mapClientProfile(client)),
      total,
      pagination.page,
      pagination.limit,
    );
  }

  async findOne(id: string): Promise<ClientMeResponseDto> {
    const client = await this.clientRepository.findOne({
      where: { id },
      relations: { user: true },
    });

    if (!client) {
      throw new NotFoundException(`Client with id "${id}" not found`);
    }

    return this.buildClientDetail(client);
  }

  async findMe(userId: string): Promise<ClientMeResponseDto> {
    const client = await this.clientRepository.findOne({
      where: { userId },
      relations: { user: true },
    });

    if (!client) {
      throw new NotFoundException(
        `Client profile for user "${userId}" not found`,
      );
    }

    return this.buildClientDetail(client);
  }

  private async buildClientDetail(
    client: Client,
  ): Promise<ClientMeResponseDto> {
    const quoteRequests = await this.quoteRequestRepository.find({
      where: {
        email: client.user.email,
      },
      relations: {
        service: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    return {
      client: this.mapClientProfile(client),
      quoteRequests: quoteRequests.map((quoteRequest) =>
        this.mapQuoteRequest(quoteRequest),
      ),
      // ToDo: completar cuando exista la entidad WorkOrder con FK a Client.
      workOrders: [],
    };
  }

  private mapClientProfile(client: Client): ClientProfileResponseDto {
    return {
      id: client.id,
      name: client.user.name,
      email: client.user.email,
      phone: client.user.phone,
    };
  }

  private mapQuoteRequest(
    quoteRequest: QuoteRequest,
  ): ClientQuoteRequestResponseDto {
    return {
      id: quoteRequest.id,
      serviceName: quoteRequest.service.name,
      message: quoteRequest.message,
      status: quoteRequest.status,
      createdAt: quoteRequest.createdAt,
    };
  }
}
