import { ApiProperty } from '@nestjs/swagger';
import {
  IsBooleanString,
  IsEnum,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { ProductStatus } from '../entities/product.entity';
import { FindProductsQueryDto } from './find-products-query.dto';

export class FindProductsAdminQueryDto extends FindProductsQueryDto {
  @ApiProperty({
    description: 'Filtrar por ID exacto de producto',
    required: false,
    type: String,
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('4', { message: 'El productId debe ser un UUID válido.' })
  productId?: string;

  @ApiProperty({
    description: 'Filtrar por estado del producto',
    enum: ProductStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(ProductStatus, {
    message: 'El estado debe ser ACTIVE o INACTIVE.',
  })
  status?: ProductStatus;

  @ApiProperty({
    description: 'Filtrar por publicación en tienda',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsBooleanString({
    message: 'El filtro de publicación debe ser "true" o "false".',
  })
  isPublished?: string;
}
