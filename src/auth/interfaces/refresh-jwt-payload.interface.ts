import { JwtPayload } from './jwt-payload.interface';

export interface RefreshJwtPayload extends JwtPayload {
  type: 'refresh';
  jti: string;
}
