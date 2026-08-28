import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class MaterialDto {
  @ApiProperty({
    description: 'Nombre del material',
    example: 'Aislante térmico',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'Cantidad del material',
    example: '12 unidades',
  })
  @IsString()
  @IsNotEmpty()
  quantity!: string;
}

export class DiligenceDto {
  @ApiProperty({
    description: 'Detalle del trabajo realizado por el técnico',
    example: 'Instalación completa de paneles y verificación de hermeticidad.',
  })
  @IsString()
  @IsNotEmpty()
  workDone!: string;

  @ApiProperty({
    description: 'Observaciones del trabajo realizado',
    example:
      'Todo funcionando con normalidad. Se recomienda mantenimiento preventivo en 6 meses.',
  })
  @IsString()
  @IsNotEmpty()
  observations!: string;

  @ApiProperty({
    description: 'Lista de materiales utilizados',
    type: () => [MaterialDto],
    example: [{ name: 'Aislante térmico', quantity: '12 metros' }],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MaterialDto)
  materials!: MaterialDto[];
}
