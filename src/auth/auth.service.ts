import { randomUUID } from 'node:crypto';
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import type { ApplicationConfiguration } from '../config/configuration';
import { SessionsService } from '../sessions/sessions.service';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { RefreshJwtPayload } from './interfaces/refresh-jwt-payload.interface';
import { SessionMetadata } from './interfaces/session-metadata.interface';
import { TokenPairResponse } from './interfaces/token-pair-response.interface';
import { Client } from '../clients/entities/client.entity';
import { Role, RoleName } from '../roles/entities/roles.entity';
import { RegisterDto } from './dto/register.dto';
import { RegisterResponseDto } from './dto/register-response.dto';
import { LoginResponseDto } from './dto/login-response.dto';

const INVALID_CREDENTIALS_MESSAGE = 'Credenciales inválidas.';
const INVALID_REFRESH_TOKEN_MESSAGE = 'Refresh token inválido.';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<
      ApplicationConfiguration,
      true
    >,
    private readonly sessionsService: SessionsService,
  ) {}

  async validateCredentials(loginDto: LoginDto): Promise<User> {
    const normalizedEmail = loginDto.email.trim().toLowerCase();

    const user = await this.userRepository.findOne({
      where: {
        email: normalizedEmail,
      },
      relations: {
        role: true,
      },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    const passwordMatches = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    return user;
  }

  async login(
    loginDto: LoginDto,
    metadata: SessionMetadata,
  ): Promise<LoginResponseDto> {
    const user = await this.validateCredentials(loginDto);
    const tokenPair = await this.issueTokenPair(user, metadata);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
      },
      token: tokenPair.accessToken,
    };
  }

  async register(
    registerDto: RegisterDto,
    metadata: SessionMetadata,
  ): Promise<RegisterResponseDto> {
    const normalizedEmail = registerDto.email.trim().toLowerCase();

    const existingUser = await this.userRepository.findOne({
      where: { email: normalizedEmail },
      withDeleted: true,
    });

    if (existingUser) {
      throw new ConflictException('Email ya registrado');
    }

    const clientRole = await this.roleRepository.findOneBy({
      name: RoleName.CLIENT,
    });

    if (!clientRole) {
      throw new NotFoundException('Role CLIENT not found in catalog');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = await this.userRepository.manager.transaction(
      async (manager) => {
        const createdUser = manager.create(User, {
          name: registerDto.name,
          email: normalizedEmail,
          phone: registerDto.phone,
          password: hashedPassword,
          role: clientRole,
        });

        const savedUser = await manager.save(User, createdUser);

        const client = manager.create(Client, {
          userId: savedUser.id,
          user: savedUser,
        });

        await manager.save(Client, client);

        return savedUser;
      },
    );

    const userWithRole = await this.userRepository.findOneOrFail({
      where: { id: user.id },
      relations: { role: true },
    });

    const tokenPair = await this.issueTokenPair(userWithRole, metadata);

    return {
      user: {
        id: userWithRole.id,
        name: userWithRole.name,
        email: userWithRole.email,
        role: RoleName.CLIENT,
      },
      token: tokenPair.accessToken,
    };
  }

  async refresh(
    refreshToken: string,
    metadata: SessionMetadata,
  ): Promise<TokenPairResponse> {
    const payload = await this.verifyRefreshToken(refreshToken);

    const session =
      await this.sessionsService.findActiveByRefreshToken(refreshToken);

    if (
      !session ||
      !session.user ||
      session.user.deletedAt ||
      session.user.id !== payload.sub
    ) {
      throw new UnauthorizedException(INVALID_REFRESH_TOKEN_MESSAGE);
    }

    await this.sessionsService.revokeSession(session);

    return this.issueTokenPair(session.user, metadata);
  }

  async logout(refreshToken: string): Promise<void> {
    const session =
      await this.sessionsService.findActiveByRefreshToken(refreshToken);

    if (!session) {
      return;
    }

    await this.sessionsService.revokeSession(session);
  }

  private async issueTokenPair(
    user: User,
    metadata: SessionMetadata,
  ): Promise<TokenPairResponse> {
    const accessPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role.name,
    };

    const refreshSecret = this.configService.getOrThrow('jwt.refreshSecret', {
      infer: true,
    });

    const refreshExpiresInSeconds = this.configService.getOrThrow(
      'jwt.refreshExpiresInSeconds',
      {
        infer: true,
      },
    );

    const refreshPayload: RefreshJwtPayload = {
      ...accessPayload,
      type: 'refresh',
      jti: randomUUID(),
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload),
      this.jwtService.signAsync(refreshPayload, {
        secret: refreshSecret,
        expiresIn: refreshExpiresInSeconds,
      }),
    ]);

    await this.sessionsService.createSession({
      user,
      refreshToken,
      expiresAt: new Date(Date.now() + refreshExpiresInSeconds * 1000),
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  private async verifyRefreshToken(
    refreshToken: string,
  ): Promise<RefreshJwtPayload> {
    try {
      const refreshSecret = this.configService.getOrThrow('jwt.refreshSecret', {
        infer: true,
      });

      const payload = await this.jwtService.verifyAsync<RefreshJwtPayload>(
        refreshToken,
        {
          secret: refreshSecret,
        },
      );

      if (
        payload.type !== 'refresh' ||
        typeof payload.jti !== 'string' ||
        payload.jti.trim().length === 0
      ) {
        throw new Error('Invalid refresh token payload.');
      }

      return payload;
    } catch {
      throw new UnauthorizedException(INVALID_REFRESH_TOKEN_MESSAGE);
    }
  }
}
