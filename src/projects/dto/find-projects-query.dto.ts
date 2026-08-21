import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationParamsDto } from '../../common/pagination';

export class FindProjectsQueryDto extends PaginationParamsDto {
  @ApiProperty({
    description: 'Término de búsqueda por título o descripción del proyecto',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'El término de búsqueda debe ser una cadena de texto.' })
  search?: string;

  @ApiProperty({
    description: 'Filtrar por ubicación del proyecto',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'La ubicación debe ser una cadena de texto.' })
  location?: string;

  @ApiProperty({
    description: 'Filtrar por ID del cliente',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'El clientId debe ser un UUID válido.' })
  clientId?: string;
}
