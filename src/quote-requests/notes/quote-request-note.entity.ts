import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { QuoteRequest } from '../entities/quote-request.entity';

@Entity('quote_request_notes')
export class QuoteRequestNote {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => QuoteRequest, (quoteRequest) => quoteRequest.notes, {
    nullable: false,
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'quote_request_id' })
  quoteRequest!: QuoteRequest;

  @Column({ type: 'text' })
  note!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
