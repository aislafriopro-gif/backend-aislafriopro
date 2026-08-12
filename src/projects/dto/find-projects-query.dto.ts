import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationParamsDto } from '../../common/pagination';

export class FindProjectsQueryDto extends PaginationParamsDto {
  @ApiProperty({
    description: 'Término de búsqueda por título o descripción del proyecto',
    example: 'cámara frigorífica',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'El término de búsqueda debe ser una cadena de texto.' })
  search?: string;

  @ApiProperty({
    description: 'Filtrar por ubicación del proyecto',
    example: 'Buenos Aires',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'La ubicación debe ser una cadena de texto.' })
  location?: string;

  @ApiProperty({
    description: 'Filtrar por ID del cliente',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'El clientId debe ser un UUID válido.' })
  clientId?: string;
}
