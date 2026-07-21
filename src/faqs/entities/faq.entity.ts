import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('faqs')
@Index(['isActive'])
@Index(['displayOrder'])
export class Faq {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 300 })
  question!: string;

  @Column({ type: 'text' })
  answer!: string;

  @Column({ type: 'int', nullable: true })
  displayOrder!: number | null;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}