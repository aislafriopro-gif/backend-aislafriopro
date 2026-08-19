import { Media } from '../../media/entities/media.entity';
import { ProductStatus } from '../entities/product.entity';

export class ProductPublicResponseDto {
  id!: string;
  name!: string;
  slug!: string;
  description!: string;
  price!: number;
  status!: ProductStatus;
  isPublished!: boolean;
  images!: Media[];
  createdAt!: Date;
  updatedAt!: Date;
}
