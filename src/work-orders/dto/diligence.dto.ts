import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class MaterialDto {
  @ApiProperty({
    description: 'Nombre del material',
    example: 'Aislante térmico',
  })
  @IsString({ message: 'El nombre del material debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El nombre del material es obligatorio.' })
  name!: string;

  @ApiProperty({
    description: 'Cantidad del material',
    example: '12 unidades',
  })
  @IsString({ message: 'La cantidad del material debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'La cantidad del material es obligatoria.' })
  quantity!: string;
}

export class DiligenceDto {
  @ApiProperty({
    description: 'Detalle del trabajo realizado por el técnico',
    example: 'Instalación completa de paneles y verificación de hermeticidad.',
  })
  @IsString({ message: 'El trabajo realizado debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El trabajo realizado es obligatorio.' })
  workDone!: string;

  @ApiProperty({
    description: 'Observaciones del trabajo realizado',
    example:
      'Todo funcionando con normalidad. Se recomienda mantenimiento preventivo en 6 meses.',
  })
  @IsString({ message: 'Las observaciones deben ser una cadena de texto.' })
  @IsNotEmpty({ message: 'Las observaciones son obligatorias.' })
  observations!: string;

  @ApiProperty({
    description: 'Lista de materiales utilizados',
    type: () => [MaterialDto],
    example: [{ name: 'Aislante térmico', quantity: '12 metros' }],
  })
  @IsArray({ message: 'Los materiales deben ser una lista.' })
  @ValidateNested({
    each: true,
    message: 'Cada material debe tener un formato válido.',
  })
  @Type(() => MaterialDto)
  materials!: MaterialDto[];
}
