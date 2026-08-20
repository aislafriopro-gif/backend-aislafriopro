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
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @ApiProperty({
    description: 'Email único del cliente',
    example: 'juan@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Teléfono de contacto',
    example: '+54 9 11 1234-5678',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone!: string;

  @ApiProperty({
    description: 'Contraseña del cliente',
    example: 'PassWord23!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password!: string;
}
