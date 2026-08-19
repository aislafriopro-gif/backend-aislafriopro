import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateQuoteRequestNoteContentDto {
  @ApiProperty({
    description: 'Contenido de la nota interna asociada a la solicitud',
    example: 'El cliente requiere presupuesto urgente para la próxima semana.',
  })
  @IsString({
    message: 'El contenido de la nota debe ser una cadena de texto.',
  })
  @IsNotEmpty({ message: 'El contenido de la nota es obligatorio.' })
  @MaxLength(3000, {
    message: 'El contenido de la nota no puede superar los 3000 caracteres.',
  })
  content!: string;
}
