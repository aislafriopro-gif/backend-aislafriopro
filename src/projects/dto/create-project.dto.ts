import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({
    description: 'Título del proyecto',
    example: 'Aislación térmica en cámara frigorífica industrial',
    maxLength: 255,
  })
  @IsString({ message: 'El título debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El título es obligatorio.' })
  @MaxLength(255, { message: 'El título no puede superar los 255 caracteres.' })
  title!: string;

  @ApiProperty({
    description: 'Slug único para URLs amigables',
    example: 'aislacion-camara-frigorifica-industrial',
    maxLength: 160,
  })
  @IsString({ message: 'El slug debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El slug es obligatorio.' })
  @MaxLength(160, { message: 'El slug no puede superar los 160 caracteres.' })
  slug!: string;

  @ApiProperty({
    description: 'Descripción detallada del proyecto',
    example:
      'Instalación de paneles aislantes en cámara frigorífica de 200m² para industria alimenticia.',
  })
  @IsString({ message: 'La descripción debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'La descripción es obligatoria.' })
  description!: string;

  @ApiProperty({
    description: 'Ciudad o provincia donde se realizó el proyecto',
    example: 'Buenos Aires, Argentina',
    required: false,
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'La ubicación debe ser una cadena de texto.' })
  @MaxLength(255, {
    message: 'La ubicación no puede superar los 255 caracteres.',
  })
  location?: string;

  @ApiProperty({
    description: 'Fecha de finalización del proyecto',
    example: '2026-05-15',
    required: false,
    type: String,
    format: 'date',
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'La fecha de finalización debe tener formato YYYY-MM-DD.' },
  )
  completionDate?: string;

  @ApiProperty({
    description: 'ID del usuario cliente vinculado al proyecto',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'El cliente debe ser un UUID válido.' })
  clientId?: string;

  @ApiProperty({
    description:
      'Nombre público del cliente a mostrar en la web (fallback si no hay clientId)',
    example: 'Frigorífico Los Andes',
    required: false,
    maxLength: 255,
  })
  @IsOptional()
  @IsString({
    message: 'El nombre público del cliente debe ser una cadena de texto.',
  })
  @MaxLength(255, {
    message:
      'El nombre público del cliente no puede superar los 255 caracteres.',
  })
  clientDisplayName?: string;

  @ApiProperty({
    description:
      'IDs de los servicios vendidos en el proyecto (enviar como JSON array serializado en multipart/form-data, ej: ["uuid1","uuid2"])',
    example: ['a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'],
    required: false,
    isArray: true,
    type: String,
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }): unknown => {
    if (Array.isArray(value)) {
      return value;
    }

    if (typeof value !== 'string') {
      return value;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }

    if (trimmed.startsWith('[')) {
      try {
        const parsed: unknown = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed : [trimmed];
      } catch {
        return [trimmed];
      }
    }

    return [trimmed];
  })
  @IsArray({ message: 'Los servicios deben enviarse como un arreglo.' })
  @IsUUID('4', {
    each: true,
    message: 'Cada servicio debe ser un UUID válido.',
  })
  serviceIds?: string[];

  @ApiProperty({
    description:
      'Imagen de portada (multipart, opcional). Los clientes pueden enviar el campo vacío; se ignora.',
    type: 'string',
    format: 'binary',
    required: false,
  })
  @IsOptional()
  coverFile?: string;

  @ApiProperty({
    description:
      'Imagen "antes" (multipart, opcional). Los clientes pueden enviar el campo vacío; se ignora.',
    type: 'string',
    format: 'binary',
    required: false,
  })
  @IsOptional()
  beforeFile?: string;

  @ApiProperty({
    description:
      'Imagen "después" (multipart, opcional). Los clientes pueden enviar el campo vacío; se ignora.',
    type: 'string',
    format: 'binary',
    required: false,
  })
  @IsOptional()
  afterFile?: string;
}
