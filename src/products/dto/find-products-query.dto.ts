import { ApiProperty } from '@nestjs/swagger';
import { IsBooleanString, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationParamsDto } from '../../common/pagination';
import { ProductStatus } from '../entities/product.entity';

export class FindProductsQueryDto extends PaginationParamsDto {
  @ApiProperty({
    description: 'Término de búsqueda por nombre o descripción del producto',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'El término de búsqueda debe ser una cadena de texto.' })
  search?: string;

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
