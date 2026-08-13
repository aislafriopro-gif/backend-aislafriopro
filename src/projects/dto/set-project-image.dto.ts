import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class SetProjectImageDto {
  @ApiProperty({
    description: 'ID del media (Cloudinary) a asignar como imagen del proyecto',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsUUID('4', { message: 'El mediaId debe ser un UUID válido.' })
  @IsNotEmpty({ message: 'El mediaId es obligatorio.' })
  mediaId!: string;
}
