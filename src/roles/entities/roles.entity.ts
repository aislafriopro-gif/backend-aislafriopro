import { Entity, Column, PrimaryGeneratedColumn, OneToMany, DeleteDateColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum RoleName {
    ADMIN = 'ADMIN',
    USER = 'USER',
    CLIENT = 'CLIENT',
    TECHNICIAN = 'TECHNICIAN',
}

@Entity('roles')
export class Role {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({
        type: 'enum',
        enum: RoleName,
        default: RoleName.USER,
        unique: true,
    })
    name!: RoleName;

    @OneToMany(() => User, (user) => user.role)
    users!: User[];

    @CreateDateColumn()
    createdAt!: Date;

    @DeleteDateColumn()
    deletedAt?: Date
}