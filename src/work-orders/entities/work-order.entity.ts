import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Client } from '../../clients/entities/client.entity';
import { QuoteRequest } from '../../quote-requests/entities/quote-request.entity';
import { User } from '../../users/entities/user.entity';

export enum WorkOrderStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

@Entity('work_orders')
export class WorkOrder {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  clientId!: string;

  @ManyToOne(() => Client, { nullable: false })
  @JoinColumn({ name: 'client_id' })
  client!: Client;

  @Column({ type: 'uuid', nullable: true })
  technicianId?: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'technician_id' })
  technician?: User | null;

  @Column({ type: 'uuid', nullable: true })
  quoteRequestId?: string | null;

  @ManyToOne(() => QuoteRequest, { nullable: true })
  @JoinColumn({ name: 'quote_request_id' })
  quoteRequest?: QuoteRequest | null;

  @Column({
    type: 'enum',
    enum: WorkOrderStatus,
    default: WorkOrderStatus.PENDING,
  })
  status!: WorkOrderStatus;

  @Column({ type: 'text', nullable: true })
  workDone?: string | null;

  @Column({ type: 'text', nullable: true })
  observations?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  materials?: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
