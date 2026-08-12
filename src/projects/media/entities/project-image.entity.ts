import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Project } from '../../entities/project.entity';

export enum ProjectImageType {
  BEFORE = 'BEFORE',
  AFTER = 'AFTER',
}

@Entity('project_images')
export class ProjectImage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  projectId!: string;

  @ManyToOne(() => Project, (project) => project.images, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'projectId' })
  project!: Project;

  @Column({ type: 'varchar', length: 500 })
  url!: string;

  @Column({ type: 'varchar', length: 500 })
  publicId!: string;

  @Column({
    type: 'enum',
    enum: ProjectImageType,
  })
  type!: ProjectImageType;

  @Column({ type: 'int', nullable: true })
  displayOrder!: number | null;

  @CreateDateColumn()
  createdAt!: Date;
}
