import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum SiteSettingType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  JSON = 'JSON',
}

@Entity('site_settings')
export class SiteSetting {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  key!: string;

  @Column({ type: 'text', nullable: true })
  value!: string | null;

  @Column({ type: 'enum', enum: SiteSettingType })
  type!: SiteSettingType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}