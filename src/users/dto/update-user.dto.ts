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
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Email único del usuario',
    example: 'juan@example.com',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Teléfono del usuario',
    example: '+5491112345678',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Matches(/^[+]?[\d\s\-()]{6,20}$/, {
    message: 'El teléfono no tiene un formato válido',
  })
  phone?: string;
}
