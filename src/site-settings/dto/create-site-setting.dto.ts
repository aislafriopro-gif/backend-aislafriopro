import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { SiteSettingType } from '../entities/site-setting.entity';

export class CreateSiteSettingDto {
  @ApiProperty({
    description: 'Clave unica de configuracion del sitio',
    example: 'contact.whatsapp',
    maxLength: 100,
  })
  @IsString({ message: 'La clave debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'La clave es obligatoria.' })
  @MaxLength(100, { message: 'La clave no puede superar los 100 caracteres.' })
  @Matches(/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/, {
    message:
      'La clave solo puede contener minusculas, numeros, puntos, guiones y guiones bajos.',
  })
  key!: string;

  @ApiProperty({
    description: 'Valor de la configuracion almacenado como texto',
    example: '+5491112345678',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'El valor debe ser una cadena de texto.' })
  value?: string | null;

  @ApiProperty({
    description: 'Tipo de dato representado por el valor',
    enum: SiteSettingType,
    example: SiteSettingType.STRING,
  })
  @IsEnum(SiteSettingType, {
    message: 'El tipo debe ser STRING, NUMBER, BOOLEAN o JSON.',
  })
  type!: SiteSettingType;

  @ApiProperty({
    description: 'Descripcion interna de la configuracion',
    example: 'Numero de WhatsApp visible en el sitio',
    required: false,
    nullable: true,
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'La descripcion debe ser una cadena de texto.' })
  @MaxLength(255, {
    message: 'La descripcion no puede superar los 255 caracteres.',
  })
  description?: string | null;
}
