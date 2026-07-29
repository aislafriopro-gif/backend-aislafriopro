import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from './entities/session.entity';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
  ) {}

  async revokeAllByUser(userId: string): Promise<number> {
    const result = await this.sessionRepository.update(
      { user: { id: userId }, revoked: false },
      { revoked: true },
    );
    return result.affected ?? 0;
  }

  async createSession(
    userId: string,
    refreshToken: string,
    expiresAt: Date,
    ipAddress: string,
    userAgent: string,
  ): Promise<Session> {
    const session = this.sessionRepository.create({
      user: { id: userId },
      refreshToken,
      expiresAt,
      ipAddress,
      userAgent,
    });
    return this.sessionRepository.save(session);
  }
}
