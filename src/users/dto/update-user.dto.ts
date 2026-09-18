import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({
    description: 'Nombre completo del usuario',
    example: 'Juan Pérez',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'El nombre debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  name?: string;

  @ApiProperty({
    description: 'Email único del usuario',
    example: 'juan@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'El email debe tener un formato válido.' })
  email?: string;

  @ApiProperty({
    description: 'Teléfono del usuario',
    example: '+5491112345678',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'El teléfono debe ser una cadena de texto.' })
  @Matches(/^[+]?[\d\s\-()]{6,20}$/, {
    message: 'El teléfono no tiene un formato válido',
  })
  phone?: string;
}
