import { Media } from '../../media/entities/media.entity';

export class ProductPublicResponseDto {
  id!: string;
  name!: string;
  slug!: string;
  description!: string;
  price!: number;
  images!: Media[];
}
