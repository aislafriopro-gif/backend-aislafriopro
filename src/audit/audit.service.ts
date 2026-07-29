import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditAction, AuditLog } from './entities/audit-action.entity';

interface LogParams {
  action: AuditAction;
  entityName: string;
  entityId: string | null;
  userId: string | null;
  previousData: Record<string, any> | null;
  newData: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(params: LogParams): Promise<AuditLog> {
    const entry = this.auditLogRepository.create({
      action: params.action,
      entityName: params.entityName,
      entityId: params.entityId,
      userId: params.userId,
      previousData: params.previousData,
      newData: params.newData,
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
    });
    return this.auditLogRepository.save(entry);
  }
}
