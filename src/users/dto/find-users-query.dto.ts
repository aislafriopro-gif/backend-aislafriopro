import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { PaginationParamsDto } from '../../common/pagination';
import { RoleName } from '../../roles/entities/roles.entity';

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
    description:
      'Filtrar por estado activo/inactivo (true = activo, false = soft-deleted)',
    example: true,
    required: false,
  })
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
