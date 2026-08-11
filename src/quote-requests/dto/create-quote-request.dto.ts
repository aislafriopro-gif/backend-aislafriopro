import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { QuoteRequestStatus } from '../entities/quote-request.entity';

export class CreateQuoteRequestDto {
  @ApiProperty({
    description: 'Nombre de la persona que solicita la cotización',
    example: 'María Pérez',
    maxLength: 150,
  })
  @IsString({ message: 'El nombre debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  @MaxLength(150, {
    message: 'El nombre no puede superar los 150 caracteres.',
  })
  name!: string;

  @ApiProperty({
    description: 'Email de contacto de la solicitud',
    example: 'maria.perez@example.com',
  })
  @IsEmail({}, { message: 'El email debe tener un formato válido.' })
  @IsNotEmpty({ message: 'El email es obligatorio.' })
  email!: string;

  @ApiProperty({
    description: 'Teléfono de contacto de la solicitud',
    example: '+54 9 11 1234 5678',
    maxLength: 50,
  })
  @IsString({ message: 'El teléfono debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El teléfono es obligatorio.' })
  @MaxLength(50, {
    message: 'El teléfono no puede superar los 50 caracteres.',
  })
  phone!: string;

  @ApiProperty({
    description: 'ID del servicio solicitado',
    format: 'uuid',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID('4', { message: 'El servicio debe ser un UUID válido.' })
  @IsNotEmpty({ message: 'El servicio es obligatorio.' })
  serviceId!: string;

  @ApiProperty({
    description: 'Mensaje o comentario del cliente sobre la solicitud',
    example: 'Necesitamos una cotización para la instalación de un aire acondicionado.',
  })
  @IsString({ message: 'El mensaje debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El mensaje es obligatorio.' })
  @MaxLength(5000, {
    message: 'El mensaje no puede superar los 5000 caracteres.',
  })
  message!: string;
}
