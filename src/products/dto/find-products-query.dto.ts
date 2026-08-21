import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationParamsDto } from '../../common/pagination';

export class FindProductsQueryDto extends PaginationParamsDto {
  @ApiProperty({
    description: 'Término de búsqueda por nombre o descripción del producto',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'El término de búsqueda debe ser una cadena de texto.' })
  search?: string;
}
