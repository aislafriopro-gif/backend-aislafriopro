import { ApiProperty } from '@nestjs/swagger';
import { RoleName } from '../../roles/entities/roles.entity';

class RegisteredUserResponseDto {
  @ApiProperty({ example: '7be6ef16-1a45-4b82-950c-3411fef49b28' })
  id!: string;

  @ApiProperty({ example: 'Juan Pérez' })
  name!: string;

  @ApiProperty({ example: 'juan@example.com' })
  email!: string;

  @ApiProperty({ enum: RoleName, example: RoleName.CLIENT })
  role!: RoleName.CLIENT;
}

export class RegisterResponseDto {
  @ApiProperty({ type: RegisteredUserResponseDto })
  user!: RegisteredUserResponseDto;

  @ApiProperty({ example: 'jwt-access-token' })
  token!: string;
}
