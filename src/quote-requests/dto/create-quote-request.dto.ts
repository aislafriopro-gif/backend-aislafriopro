import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateQuoteRequestDto {
  @ApiProperty({
    description: 'Nombre de la persona que solicita la cotización',
    example: 'María Pérez',
    minLength: 2,
    maxLength: 150,
  })
  @IsString({ message: 'El nombre debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  @MinLength(2, {
    message: 'El nombre debe tener al menos 2 caracteres.',
  })
  @MaxLength(150, {
    message: 'El nombre no puede superar los 150 caracteres.',
  })
  name!: string;

  @ApiProperty({
    description: 'Email de contacto de la solicitud',
    example: 'maria.perez@example.com',
    maxLength: 255,
  })
  @IsEmail({}, { message: 'El email debe tener un formato válido.' })
  @IsNotEmpty({ message: 'El email es obligatorio.' })
  @MaxLength(255, {
    message: 'El email no puede superar los 255 caracteres.',
  })
  email!: string;

  @ApiProperty({
    description: 'Teléfono de contacto de la solicitud',
    example: '+54 9 11 1234 5678',
    minLength: 7,
    maxLength: 50,
  })
  @IsString({ message: 'El teléfono debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El teléfono es obligatorio.' })
  @MinLength(7, {
    message: 'El teléfono debe tener al menos 7 caracteres.',
  })
  @MaxLength(50, {
    message: 'El teléfono no puede superar los 50 caracteres.',
  })
  @Matches(
    /^\+?[0-9][0-9\s().-]{5,48}[0-9]$/,
    {
      message: 'El teléfono debe tener un formato válido: solo números, espacios, guiones, paréntesis y opcional +.',
    },
  )
  phone!: string;

  @ApiProperty({
    description: 'ID del servicio solicitado',
    format: 'uuid',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    maxLength: 36,
  })
  @IsUUID('4', { message: 'El servicio debe ser un UUID válido.' })
  @IsNotEmpty({ message: 'El servicio es obligatorio.' })
  @MaxLength(36, {
    message: 'El servicio debe tener un UUID válido.',
  })
  serviceId!: string;

  @ApiProperty({
    description: 'Mensaje o comentario del cliente sobre la solicitud',
    example: 'Necesitamos una cotización para la instalación de un aire acondicionado.',
    minLength: 10,
    maxLength: 1000,
  })
  @IsString({ message: 'El mensaje debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El mensaje es obligatorio.' })
  @MinLength(10, {
    message: 'El mensaje debe tener al menos 10 caracteres.',
  })
  @MaxLength(1000, {
    message: 'El mensaje no puede superar los 1000 caracteres.',
  })
  message!: string;
}
