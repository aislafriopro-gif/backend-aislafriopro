import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

export class ServiceResponseDto {
  @ApiProperty({
    description: 'Identificador único del servicio',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  id!: string;

  @ApiProperty({
    description: 'Nombre del servicio',
    example: 'Instalación de aislación térmica',
  })
  name!: string;

  @ApiProperty({
    description: 'Slug único para URLs amigables',
    example: 'instalacion-aislacion-termica',
  })
  slug!: string;

  @ApiProperty({
    description: 'Descripción detallada del servicio',
    example:
      'Aislación térmica para techos y paredes con materiales de alta calidad.',
  })
  description!: string;

  @ApiProperty({
    description: 'Breve descripción del servicio',
    example: 'Aislación térmica profesional para hogares e industrias.',
    nullable: true,
  })
  shortDescription!: string | null;

  @ApiProperty({
    description: 'URL de la imagen representativa del servicio',
    example: 'https://example.com/images/aislacion.jpg',
    nullable: true,
  })
  imageUrl!: string | null;

  @ApiProperty({
    description: 'Indica si el servicio está activo y visible',
    example: true,
  })
  isActive!: boolean;

  @ApiProperty({
    description: 'Orden de visualización del servicio',
    example: 1,
    nullable: true,
  })
  displayOrder!: number | null;

  @ApiProperty({
    description: 'Fecha de creación del servicio',
    example: '2026-08-01T12:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Fecha de última actualización del servicio',
    example: '2026-08-02T15:30:00.000Z',
  })
  updatedAt!: Date;

  @Exclude()
  deletedAt!: Date | null;
}
