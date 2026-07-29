import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'Nombre completo del usuario',
    example: 'Juan Pérez',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'Email único del usuario',
    example: 'juan@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Contraseña del usuario',
    example: 'PassWord23!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password!: string;
}
