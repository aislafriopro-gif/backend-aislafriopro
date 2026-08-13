import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Media } from '../../../media/entities/media.entity';
import { Project } from '../../entities/project.entity';

export enum ProjectImageType {
  BEFORE = 'BEFORE',
  AFTER = 'AFTER',
  COVER = 'COVER',
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

  @Column({ type: 'uuid', nullable: true })
  mediaId!: string | null;

  @ManyToOne(() => Media, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'mediaId' })
  media!: Media | null;

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
