import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Session } from './entities/session.entity';

export interface CreateSessionInput {
  user: User;
  refreshToken: string;
  expiresAt: Date;
  ipAddress: string;
  userAgent: string;
}

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
  ) {}

  async createSession(input: CreateSessionInput): Promise<Session> {
    const session = this.sessionRepository.create({
      user: input.user,
      refreshToken: this.hashRefreshToken(input.refreshToken),
      expiresAt: input.expiresAt,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      revoked: false,
    });

    return this.sessionRepository.save(session);
  }

  async findActiveByRefreshToken(
    refreshToken: string,
  ): Promise<Session | null> {
    return this.sessionRepository.findOne({
      where: {
        refreshToken: this.hashRefreshToken(refreshToken),
        revoked: false,
        expiresAt: MoreThan(new Date()),
      },
      relations: {
        user: {
          role: true,
        },
      },
    });
  }

  async revokeAllByUser(userId: string): Promise<void> {
    await this.sessionRepository
      .createQueryBuilder()
      .update(Session)
      .set({ revoked: true })
      .where('"userId" = :userId', { userId })
      .andWhere('"revoked" = false')
      .execute();
  }

  async revokeSession(session: Session): Promise<Session> {
    session.revoked = true;

    return this.sessionRepository.save(session);
  }

  private hashRefreshToken(refreshToken: string): string {
    return createHash('sha256').update(refreshToken).digest('hex');
  }
}
