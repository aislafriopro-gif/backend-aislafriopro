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
import { RegisterDto } from './dto/register.dto';
import { RegisterResponseDto } from './dto/register-response.dto';
import { LoginResponseDto } from './dto/login-response.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Registrar usuario público' })
  @ApiResponse({
    status: 201,
    description: 'Usuario registrado correctamente',
    type: RegisterResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validación fallida' })
  @ApiResponse({ status: 409, description: 'Email ya registrado' })
  async register(
    @Body() registerDto: RegisterDto,
    @Req() req: Request,
  ): Promise<RegisterResponseDto> {
    const metadata: SessionMetadata = {
      ipAddress: req.ip ?? '',
      userAgent: (req.headers['user-agent'] as string) ?? '',
    };

    return this.authService.register(registerDto, metadata);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({
    status: 200,
    description: 'Login exitoso',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
  ): Promise<LoginResponseDto> {
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

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cerrar sesión y revocar el refresh token' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Sesión cerrada correctamente',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Datos inválidos',
  })
  async logout(@Body() refreshTokenDto: RefreshTokenDto): Promise<void> {
    await this.authService.logout(refreshTokenDto.refreshToken);
  }
}
