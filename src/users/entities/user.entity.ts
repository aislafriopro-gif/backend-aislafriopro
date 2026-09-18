import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AuditLog } from '../../audit/entities/audit-action.entity';
import { Role } from '../../roles/entities/roles.entity';
import { Session } from '../../sessions/entities/session.entity';

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum AuthProvider {
  LOCAL = 'LOCAL',
  GOOGLE = 'GOOGLE',
}

@Entity('users')
@Index('UQ_users_email_active', ['email'], {
  unique: true,
  where: '"deletedAt" IS NULL',
})
@Index('UQ_users_phone', ['phone'], {
  unique: true,
  where: '"phone" IS NOT NULL',
})
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', nullable: false })
  name!: string;

  @Column({ type: 'varchar' })
  email!: string;

  @Column({ type: 'varchar', nullable: true, select: false })
  password!: string | null;

  @Column({
    type: 'enum',
    enum: AuthProvider,
    default: AuthProvider.LOCAL,
  })
  authProvider!: AuthProvider;

  @Column({ type: 'varchar', nullable: true })
  providerId!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone!: string | null;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  @Index('IDX_users_status')
  status!: UserStatus;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt!: Date | null;

  @ManyToOne(() => Role, (role) => role.users, {
    eager: true,
    nullable: false,
  })
  @JoinColumn({ name: 'role_id' })
  role!: Role;

  @OneToMany(() => Session, (session) => session.user)
  sessions!: Session[];

  @OneToMany(() => AuditLog, (auditLog) => auditLog.user)
  auditLogs!: AuditLog[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
