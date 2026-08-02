import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationParamsDto } from '../../common/pagination';
import { RoleName } from '../../roles/entities/roles.entity';
import { UserStatus } from '../entities/user.entity';

export class FindUsersQueryDto extends PaginationParamsDto {
  @ApiProperty({
    description: 'Filtrar por nombre del rol',
    enum: RoleName,
    required: false,
  })
  @IsEnum(RoleName)
  @IsOptional()
  role?: RoleName;

  @ApiProperty({
    description: 'Filtrar por estado del usuario',
    enum: UserStatus,
    required: false,
  })
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

  @ApiProperty({
    description: 'Incluir usuarios eliminados en la respuesta (default: false)',
    example: true,
    required: false,
  })
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  @IsOptional()
  includeDeleted?: boolean;

  @ApiProperty({
    description:
      'Buscar por nombre o email (búsqueda parcial, case insensitive)',
    example: 'juan',
    required: false,
  })
  @IsString()
  @IsOptional()
  search?: string;
}
