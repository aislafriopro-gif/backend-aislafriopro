import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateFaqDto {
  @ApiProperty({
    description: 'Pregunta frecuente',
    example: '¿Realizan trabajos para cámaras frigoríficas?',
    maxLength: 300,
  })
  @IsString({ message: 'La pregunta debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'La pregunta es obligatoria.' })
  @MaxLength(300, {
    message: 'La pregunta no puede superar los 300 caracteres.',
  })
  question!: string;

  @ApiProperty({
    description: 'Respuesta de la pregunta frecuente',
    example:
      'Sí, realizamos aislación térmica para cámaras frigoríficas industriales y comerciales.',
  })
  @IsString({ message: 'La respuesta debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'La respuesta es obligatoria.' })
  answer!: string;

  @ApiProperty({
    description: 'Orden de visualización de la pregunta frecuente',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'El orden de visualización debe ser un número entero.' })
  @Min(0, { message: 'El orden de visualización no puede ser negativo.' })
  displayOrder?: number;

  @ApiProperty({
    description: 'Indica si la pregunta frecuente está activa y visible',
    example: true,
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'El valor activo debe ser un booleano.' })
  isActive?: boolean;
}
