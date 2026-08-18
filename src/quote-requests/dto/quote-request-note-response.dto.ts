import { ApiProperty } from '@nestjs/swagger';

export class QuoteRequestNoteResponseDto {
  @ApiProperty({
    description: 'ID de la nota creada',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  id!: string;

  @ApiProperty({
    description: 'Contenido de la nota interna',
    example: 'El cliente requiere presupuesto urgente para la próxima semana.',
  })
  content!: string;

  @ApiProperty({
    description: 'Fecha de creación de la nota',
    example: '2026-08-11T12:34:56.789Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Mensaje de confirmación de la creación de la nota',
    example: 'Nota creada',
  })
  message!: string;
}
