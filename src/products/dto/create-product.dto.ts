import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({
    description: 'Nombre del producto',
    example: 'Panel aislante PIR 100mm',
    maxLength: 255,
  })
  @IsString({ message: 'El nombre debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  @MaxLength(255, {
    message: 'El nombre no puede superar los 255 caracteres.',
  })
  name!: string;

  @ApiProperty({
    description: 'Slug único para URLs amigables',
    example: 'panel-aislante-pir-100mm',
    maxLength: 160,
  })
  @IsString({ message: 'El slug debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El slug es obligatorio.' })
  @MaxLength(160, {
    message: 'El slug no puede superar los 160 caracteres.',
  })
  slug!: string;

  @ApiProperty({
    description: 'Descripción detallada del producto',
    example:
      'Panel aislante de poliisocianurato de 100mm de espesor para cámaras frigoríficas.',
  })
  @IsString({ message: 'La descripción debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'La descripción es obligatoria.' })
  description!: string;

  @ApiProperty({
    description: 'Precio del producto',
    example: 1250.5,
    type: Number,
  })
  @Transform(({ value }: { value: unknown }): number => {
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
  @IsNotEmpty({ message: 'El precio es obligatorio.' })
  price!: number;

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
