import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { AccessTokenResponse } from './interfaces/access-token-response.interface';
import { JwtPayload } from './interfaces/jwt-payload.interface';

const INVALID_CREDENTIALS_MESSAGE = 'Credenciales inválidas.';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
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

  async login(loginDto: LoginDto): Promise<AccessTokenResponse> {
    const user = await this.validateCredentials(loginDto);

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role.name,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
    };
  }
}
