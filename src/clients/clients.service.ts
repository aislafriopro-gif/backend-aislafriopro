import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { QuoteRequest } from '../quote-requests/entities/quote-request.entity';
import { ClientMeResponseDto } from './dto/client-me-response.dto';
import { Client } from './entities/client.entity';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(QuoteRequest)
    private readonly quoteRequestRepository: Repository<QuoteRequest>,
  ) {}

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
      client: {
        id: client.id,
        name: client.user.name,
        email: client.user.email,
        phone: client.user.phone,
      },
      quoteRequests: quoteRequests.map((quoteRequest) => ({
        id: quoteRequest.id,
        serviceName: quoteRequest.service?.name ?? 'Sin servicio',
        message: quoteRequest.message,
        status: quoteRequest.status,
        createdAt: quoteRequest.createdAt,
      })),
      // ToDo: completar cuando exista la entidad WorkOrder con FK a Client.
      workOrders: [],
    };
  }
}
