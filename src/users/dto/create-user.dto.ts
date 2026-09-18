import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
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
    description: 'Teléfono único del usuario',
    example: '+5491112345678',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @Matches(/^[+]?[\d\s\-()]{6,20}$/, {
    message: 'El teléfono no tiene un formato válido',
  })
  phone!: string;

  @ApiProperty({
    description: 'Contraseña del usuario',
    example: 'PassWord23!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password!: string;
}
