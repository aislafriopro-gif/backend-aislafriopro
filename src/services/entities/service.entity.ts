import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';

@Entity('services')
@Index(['isActive'])
@Index(['displayOrder'])
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 160 })
  slug!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'varchar', length: 300, nullable: true })
  shortDescription!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  imageUrl!: string | null;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'int', nullable: true })
  displayOrder!: number | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date | null;
}