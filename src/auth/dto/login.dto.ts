import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Correo electrónico registrado del usuario',
    example: 'usuario@aislafriopro.com',
    format: 'email',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail(
    {},
    {
      message: 'El correo electrónico debe tener un formato válido.',
    },
  )
  @IsNotEmpty({
    message: 'El correo electrónico es obligatorio.',
  })
  email!: string;

  @ApiProperty({
    description: 'Contraseña de acceso del usuario',
    example: 'Password123',
  })
  @IsString({
    message: 'La contraseña debe ser una cadena de texto.',
  })
  @IsNotEmpty({
    message: 'La contraseña es obligatoria.',
  })
  password!: string;
}
