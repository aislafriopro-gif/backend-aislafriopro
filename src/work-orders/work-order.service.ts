import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WorkOrder } from './entities/work-order.entity';
import { Repository } from 'typeorm';

@Injectable()
export class WorkOrdersService {
  constructor(
    @InjectRepository(WorkOrder)
    private readonly workOrderRepository: Repository<WorkOrder>,
  ) {}

  async findMyWorkOrders(userId: string): Promise<WorkOrder[]> {
    return await this.workOrderRepository.find({
      where: { technicianId: userId },
      relations: { client: true, quoteRequest: true },
      order: { createdAt: 'DESC' },
    });
  }
}
