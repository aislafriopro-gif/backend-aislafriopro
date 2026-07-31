import {
  Controller,
  Post,
  Body,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from '../common/decorators/public.decorator';
import type { SessionMetadata } from './interfaces/session-metadata.interface';
import type { TokenPairResponse } from './interfaces/token-pair-response.interface';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({ status: 200, description: 'Login exitoso' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
  ): Promise<TokenPairResponse> {
    const metadata: SessionMetadata = {
      ipAddress: req.ip ?? '',
      userAgent: (req.headers['user-agent'] as string) ?? '',
    };
    return this.authService.login(loginDto, metadata);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar token de acceso' })
  @ApiResponse({ status: 200, description: 'Token renovado' })
  @ApiResponse({ status: 401, description: 'Refresh token inválido' })
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Req() req: Request,
  ): Promise<TokenPairResponse> {
    const metadata: SessionMetadata = {
      ipAddress: req.ip ?? '',
      userAgent: (req.headers['user-agent'] as string) ?? '',
    };
    return this.authService.refresh(refreshTokenDto.refreshToken, metadata);
  }
}
