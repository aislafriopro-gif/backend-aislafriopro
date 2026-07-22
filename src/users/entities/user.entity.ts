import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';
import { Role } from '../../roles/entities/roles.entity'
import { Session } from '../../sessions/entities/session.entity';
import { AuditLog } from '../../audit/entities/audit-action.entity';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ nullable: false })
    name!: string;

    @Column({ unique: true })
    email!: string;

    @Column({ type: 'varchar', nullable: false })
    password!: string;

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