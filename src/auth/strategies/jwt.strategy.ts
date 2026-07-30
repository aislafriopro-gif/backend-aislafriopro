import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import type { ApplicationConfiguration } from '../../config/configuration';
import { User, UserStatus } from '../../users/entities/user.entity';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

const INVALID_USER_MESSAGE = 'Usuario inválido.';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService<ApplicationConfiguration, true>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow('jwt.secret', {
        infer: true,
      }),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.userRepository.findOne({
      where: {
        id: payload.sub,
      },
      relations: {
        role: true,
      },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException(INVALID_USER_MESSAGE);
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Usuario inactivo o suspendido');
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role.name,
    };
  }
}
