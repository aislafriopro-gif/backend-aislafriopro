import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Service } from '../../services/entities/service.entity';
import { Client } from '../../clients/entities/client.entity';
import { ProjectImage } from '../media/entities/project-image.entity';

@Entity('projects')
@Index('UQ_projects_slug_active', ['slug'], {
  unique: true,
  where: '"deletedAt" IS NULL',
})
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'varchar', length: 160 })
  slug!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location!: string | null;

  @Column({ type: 'date', nullable: true })
  completionDate!: Date | null;

  @Column({ type: 'uuid', nullable: true })
  clientId!: string | null;

  @ManyToOne(() => Client, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'clientId' })
  client!: Client | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  clientDisplayName!: string | null;

  @ManyToMany(() => Service)
  @JoinTable({
    name: 'project_services',
    joinColumn: { name: 'projectId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'serviceId', referencedColumnName: 'id' },
  })
  services!: Service[];

  @OneToMany(() => ProjectImage, (image) => image.project, { cascade: true })
  images!: ProjectImage[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date | null;
}
