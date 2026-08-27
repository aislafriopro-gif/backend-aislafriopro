import { ApiProperty } from '@nestjs/swagger';

export class ProductInquiryResponseDto {
  @ApiProperty({
    description: 'ID de la consulta creada',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  id!: string;

  @ApiProperty({
    description: 'ID del producto consultado',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  productId!: string;

  @ApiProperty({
    description: 'Fecha de creación de la consulta',
    example: '2026-08-26T12:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Mensaje de confirmación',
    example: 'Consulta de producto creada correctamente.',
  })
  message!: string;
}
