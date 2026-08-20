import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Service } from '../../services/entities/service.entity';
import { QuoteRequestNote } from '../notes/quote-request-note.entity';

export enum QuoteRequestStatus {
  NEW = 'NEW',
  IN_REVIEW = 'IN_REVIEW',
  RESPONDED = 'RESPONDED',
  CLOSED = 'CLOSED',
}

@Entity('quote_requests')
@Index(['status'])
export class QuoteRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 50 })
  phone!: string;

  @ManyToOne(() => Service, { eager: false, nullable: true })
  @JoinColumn({ name: 'service_id' })
  service!: Service | null;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'text', nullable: true })
  materials!: string | null;

  @Column({ type: 'enum', enum: QuoteRequestStatus, default: QuoteRequestStatus.NEW })
  status!: QuoteRequestStatus;

  @OneToMany(() => QuoteRequestNote, (note) => note.quoteRequest, {
    cascade: ['insert'],
    eager: false,
  })
  notes!: QuoteRequestNote[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
