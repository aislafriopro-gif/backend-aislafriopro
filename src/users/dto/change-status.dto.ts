import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { UserStatus } from '../entities/user.entity';

export class ChangeStatusDto {
  @ApiProperty({
    description: 'Nuevo estado del usuario',
    enum: UserStatus,
    example: UserStatus.INACTIVE,
  })
  @IsEnum(UserStatus)
  status!: UserStatus;
}
