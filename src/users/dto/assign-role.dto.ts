import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty } from 'class-validator';

export class AssignRoleDto {
  @ApiProperty({
    description: 'ID del rol a asignar al usuario',
    format: 'uuid',
    example: 'b1c2d3e4-f5a6-7890-abcd-ef1234567890',
  })
  @IsUUID()
  @IsNotEmpty()
  roleId!: string;
}
