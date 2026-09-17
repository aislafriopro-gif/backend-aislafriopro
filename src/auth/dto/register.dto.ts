import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'Nombre completo del cliente',
    example: 'Juan Pérez',
  })
  @IsString({ message: 'El nombre debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  @MaxLength(120, {
    message: 'El nombre no puede superar los 120 caracteres.',
  })
  name!: string;

  @ApiProperty({
    description: 'Email único del cliente',
    example: 'juan@example.com',
  })
  @IsEmail({}, { message: 'El email debe tener un formato válido.' })
  email!: string;

  @ApiProperty({
    description: 'Teléfono de contacto',
    example: '+54 9 11 1234-5678',
  })
  @IsString({ message: 'El teléfono debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El teléfono es obligatorio.' })
  @MaxLength(20, {
    message: 'El teléfono no puede superar los 20 caracteres.',
  })
  phone!: string;

  @ApiProperty({
    description: 'Contraseña del cliente',
    example: 'PassWord23!',
    minLength: 8,
  })
  @IsString({ message: 'La contraseña debe ser una cadena de texto.' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password!: string;
}
