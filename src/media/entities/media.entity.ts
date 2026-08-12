import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('media')
@Index(['publicId'], { unique: true })
@Index(['resourceType'])
@Index(['uploadedById'])
export class Media {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  publicId!: string;

  @Column({ type: 'varchar', length: 500 })
  url!: string;

  @Column({ type: 'varchar', length: 500 })
  secureUrl!: string;

  @Column({ type: 'varchar', length: 50 })
  format!: string;

  @Column({ type: 'varchar', length: 50 })
  resourceType!: string;

  @Column({ type: 'int', nullable: true })
  width!: number | null;

  @Column({ type: 'int', nullable: true })
  height!: number | null;

  @Column({ type: 'int' })
  bytes!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  originalName!: string | null;

  @Column({ type: 'uuid', nullable: true })
  uploadedById!: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'uploadedById' })
  uploadedBy!: User | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date | null;
}
