import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({
    description: 'Nombre del servicio',
    example: 'Instalación de aislación térmica',
    maxLength: 150,
  })
  @IsString({ message: 'El nombre debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  @MaxLength(150, { message: 'El nombre no puede superar los 150 caracteres.' })
  name!: string;

  @ApiProperty({
    description: 'Descripción detallada del servicio',
    example:
      'Aislación térmica para techos y paredes con materiales de alta calidad.',
  })
  @IsString({ message: 'La descripción debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'La descripción es obligatoria.' })
  description!: string;

  @ApiProperty({
    description: 'Breve descripción del servicio (opcional)',
    example: 'Aislación térmica profesional para hogares e industrias.',
    required: false,
    maxLength: 300,
  })
  @IsOptional()
  @IsString({ message: 'La breve descripción debe ser una cadena de texto.' })
  @MaxLength(300, {
    message: 'La breve descripción no puede superar los 300 caracteres.',
  })
  shortDescription?: string;

  @ApiProperty({
    description: 'URL de la imagen representativa del servicio (opcional)',
    example: 'https://example.com/images/aislacion.jpg',
    required: false,
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'La URL de la imagen debe ser una cadena de texto.' })
  @IsUrl({}, { message: 'La imagen debe ser una URL válida.' })
  @MaxLength(500, {
    message: 'La URL de la imagen no puede superar los 500 caracteres.',
  })
  imageUrl?: string;

  @ApiProperty({
    description: 'Indica si el servicio está activo y visible',
    example: true,
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'El valor activo debe ser un booleano.' })
  isActive?: boolean;

  @ApiProperty({
    description: 'Orden de visualización del servicio (opcional)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'El orden de visualización debe ser un número entero.' })
  @Min(0, { message: 'El orden de visualización no puede ser negativo.' })
  displayOrder?: number;
}
