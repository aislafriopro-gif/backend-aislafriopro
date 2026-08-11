import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateQuoteRequestNoteDto {
  @ApiProperty({
    description: 'ID de la solicitud de cotización asociada',
    format: 'uuid',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID('4', { message: 'El quoteRequestId debe ser un UUID válido.' })
  @IsNotEmpty({ message: 'El quoteRequestId es obligatorio.' })
  quoteRequestId!: string;

  @ApiProperty({
    description: 'Texto de la nota interna asociada a la solicitud',
    example: 'El cliente requiere presupuesto urgente para la próxima semana.',
  })
  @IsString({ message: 'La nota debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'La nota es obligatoria.' })
  @MaxLength(3000, {
    message: 'La nota no puede superar los 3000 caracteres.',
  })
  note!: string;
}
