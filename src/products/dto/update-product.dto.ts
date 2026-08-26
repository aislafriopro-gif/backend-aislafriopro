import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateProductDto {
  @ApiProperty({
    description: 'Nombre del producto',
    example: 'Panel aislante PIR 100mm',
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'El nombre debe ser una cadena de texto.' })
  @MaxLength(255, {
    message: 'El nombre no puede superar los 255 caracteres.',
  })
  name?: string;

  @ApiProperty({
    description: 'Slug único para URLs amigables',
    example: 'panel-aislante-pir-100mm',
    maxLength: 160,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'El slug debe ser una cadena de texto.' })
  @MaxLength(160, {
    message: 'El slug no puede superar los 160 caracteres.',
  })
  slug?: string;

  @ApiProperty({
    description: 'Descripción detallada del producto',
    example:
      'Panel aislante de poliisocianurato de 100mm de espesor para cámaras frigoríficas.',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'La descripción debe ser una cadena de texto.' })
  description?: string;

  @ApiProperty({
    description: 'Precio del producto',
    example: 1250.5,
    type: Number,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }): number | undefined => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? (value as unknown as number) : parsed;
    }

    return value as number;
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El precio debe ser un número con hasta 2 decimales.' },
  )
  @IsPositive({ message: 'El precio debe ser mayor a 0.' })
  price?: number;

  @ApiProperty({
    description:
      'Imágenes del producto (multipart). Se pueden enviar múltiples archivos en el campo "imageFiles".',
    type: 'string',
    format: 'binary',
    required: false,
    isArray: true,
  })
  @IsOptional()
  imageFiles?: string;
}
