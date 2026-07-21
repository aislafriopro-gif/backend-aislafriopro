import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('sessions')
export class Session {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @ManyToOne(() => User, (user) => user.sessions, { onDelete: 'CASCADE' })
    user!: User;

    @Column()
    refreshToken!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @Column()
    expiresAt!: Date;

    @Column()
    ipAddress!: string;

    @Column()
    userAgent!: string;

    @Column({ default: false })
    revoked!: boolean;
}
