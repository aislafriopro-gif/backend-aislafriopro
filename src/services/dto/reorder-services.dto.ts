import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class ReorderServicesDto {
  @ApiProperty({
    description: 'Array ordenado de UUIDs de servicios',
    example: [
      'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    ],
    type: [String],
  })
  @IsArray({ message: 'orderedIds debe ser un array.' })
  @IsUUID('4', {
    each: true,
    message: 'Cada elemento de orderedIds debe ser un UUID válido.',
  })
  orderedIds!: string[];
}
