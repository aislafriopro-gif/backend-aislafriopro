import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum RoleName {
  ADMIN = 'ADMIN',
  USER = 'USER',
  CLIENT = 'CLIENT',
  TECHNICIAN = 'TECHNICIAN',
}

@Entity('roles')
@Index('UQ_roles_name_active', ['name'], {
  unique: true,
  where: '"deletedAt" IS NULL',
})
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: RoleName,
    default: RoleName.USER,
  })
  name!: RoleName;

  @OneToMany(() => User, (user) => user.role)
  users!: User[];

  @CreateDateColumn()
  createdAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
