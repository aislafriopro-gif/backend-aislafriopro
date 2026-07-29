import { AccessTokenResponse } from './access-token-response.interface';

export interface TokenPairResponse extends AccessTokenResponse {
  refreshToken: string;
}
