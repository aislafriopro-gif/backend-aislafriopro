import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';


export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}


@Entity('audit_logs')
@Index(['entityName', 'entityId'])
@Index(['userId'])
@Index(['createdAt'])
@Index(['action'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: AuditAction })
  action!: AuditAction;

  @Column({ type: 'varchar', length: 100 })
  entityName!: string;

  // Nullable: no todas las acciones auditables están atadas a un registro puntual
  @Column({ type: 'uuid', nullable: true })
  entityId!: string | null;

  @Column({ type: 'uuid', nullable: true })
  userId!: string | null;

  // onDelete SET NULL: el log debe sobrevivir aunque se elimine el usuario que lo generó
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user!: User | null;

  @Column({ type: 'jsonb', nullable: true })
  previousData!: Record<string, any> | null;

  @Column({ type: 'jsonb', nullable: true })
  newData!: Record<string, any> | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  userAgent!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  // Sin UpdateDateColumn ni DeleteDateColumn: la entidad es append-only, inmutable por diseño
}