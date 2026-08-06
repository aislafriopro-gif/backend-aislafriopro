import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PaginatedResponse,
  buildPaginatedResponse,
} from '../common/pagination';
import { CreateFaqDto } from './dto/create-faq.dto';
import { FindFaqsQueryDto } from './dto/find-faqs-query.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { Faq } from './entities/faq.entity';

@Injectable()
export class FaqsService {
  constructor(
    @InjectRepository(Faq)
    private readonly faqRepository: Repository<Faq>,
  ) {}

  async create(createFaqDto: CreateFaqDto): Promise<Faq> {
    const faq = this.faqRepository.create(createFaqDto);
    return this.faqRepository.save(faq);
  }

  async findAll(query: FindFaqsQueryDto): Promise<PaginatedResponse<Faq>> {
    const [data, total] = await this.faqRepository.findAndCount({
      where: { isActive: true },
      order: { displayOrder: 'ASC', createdAt: 'DESC' },
      skip: query.offset,
      take: query.limit,
    });

    return buildPaginatedResponse(data, total, query.page, query.limit);
  }

  async findAllAdmin(query: FindFaqsQueryDto): Promise<PaginatedResponse<Faq>> {
    const [data, total] = await this.faqRepository.findAndCount({
      order: { displayOrder: 'ASC', createdAt: 'DESC' },
      skip: query.offset,
      take: query.limit,
    });

    return buildPaginatedResponse(data, total, query.page, query.limit);
  }

  async findOne(id: string): Promise<Faq> {
    const faq = await this.faqRepository.findOne({
      where: { id, isActive: true },
    });

    if (!faq) {
      throw new NotFoundException(`Faq with id "${id}" not found`);
    }

    return faq;
  }

  async update(id: string, updateFaqDto: UpdateFaqDto): Promise<Faq> {
    const faq = await this.faqRepository.findOne({ where: { id } });

    if (!faq) {
      throw new NotFoundException(`Faq with id "${id}" not found`);
    }

    await this.faqRepository.update(id, updateFaqDto);
    return this.faqRepository.findOneByOrFail({ id });
  }

  async remove(id: string): Promise<void> {
    const faq = await this.faqRepository.findOne({ where: { id } });

    if (!faq) {
      throw new NotFoundException(`Faq with id "${id}" not found`);
    }

    await this.faqRepository.delete(id);
  }
}
