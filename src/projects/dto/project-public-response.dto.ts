import { Media } from '../../media/entities/media.entity';
import { Service } from '../../services/entities/service.entity';

export class ProjectPublicResponseDto {
  id!: string;
  title!: string;
  slug!: string;
  description!: string;
  location!: string | null;
  completionDate!: Date | null;
  clientDisplayName!: string | null;
  services!: Service[];
  coverImage!: Media | null;
  beforeImage!: Media | null;
  afterImage!: Media | null;
  createdAt!: Date;
  updatedAt!: Date;
}
