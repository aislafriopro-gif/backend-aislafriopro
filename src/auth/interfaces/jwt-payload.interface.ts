import { RoleName } from '../../roles/entities/roles.entity';

export interface JwtPayload {
  sub: string;      // user id
  email: string;
  role: RoleName;
}