import { ApiProperty } from '@nestjs/swagger';
import { RoleName } from '../../roles/entities/roles.entity';

class LoginUserResponseDto {
  @ApiProperty({ example: '7be6ef16-1a45-4b82-950c-3411fef49b28' })
  id!: string;

  @ApiProperty({ example: 'Usuario de prueba' })
  name!: string;

  @ApiProperty({ example: 'usuario@aislafriopro.com' })
  email!: string;

  @ApiProperty({
    enum: [RoleName.ADMIN, RoleName.CLIENT, RoleName.TECHNICIAN],
    example: RoleName.CLIENT,
  })
  role!: RoleName;
}

export class LoginResponseDto {
  @ApiProperty({ type: LoginUserResponseDto })
  user!: LoginUserResponseDto;

  @ApiProperty({ example: 'jwt-access-token' })
  token!: string;
}
