import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { SignupDto, LoginDto } from './dto/auth.dto';
import { AuthTokens, JwtRefreshPayload } from './types';

const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days, matches JWT_REFRESH_TTL default

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  timezone: string;
  notificationsEnabled: boolean;
  notificationTime: string | null;
  whatsappNumber: string | null;
}

function toPublicUser(user: {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  timezone: string;
  notificationsEnabled: boolean;
  notificationTime: string | null;
  whatsappNumber: string | null;
}): PublicUser {
  const { id, name, email, avatarUrl, timezone, notificationsEnabled, notificationTime, whatsappNumber } = user;
  return { id, name, email, avatarUrl, timezone, notificationsEnabled, notificationTime, whatsappNumber };
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async signup(dto: SignupDto): Promise<{ user: PublicUser; tokens: AuthTokens }> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await argon2.hash(dto.password);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        timezone: dto.timezone ?? 'UTC',
      },
    });

    const tokens = await this.issueTokens(user.id, user.email);
    return { user: toPublicUser(user), tokens };
  }

  async login(dto: LoginDto): Promise<{ user: PublicUser; tokens: AuthTokens }> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    // Deliberately generic error to avoid leaking whether the email exists.
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.issueTokens(user.id, user.email);
    return { user: toPublicUser(user), tokens };
  }

  /**
   * Finds or creates a user for a verified Google identity. If a local
   * account already exists with this email, the Google identity is linked
   * to it instead of creating a duplicate user.
   */
  async findOrCreateGoogleUser(profile: {
    googleId: string;
    email: string;
    name: string;
    avatarUrl?: string;
  }): Promise<PublicUser> {
    let user = await this.prisma.user.findUnique({ where: { googleId: profile.googleId } });
    if (user) return toPublicUser(user);

    user = await this.prisma.user.findUnique({ where: { email: profile.email } });
    if (user) {
      // Existing email/password account signing in with Google for the
      // first time — link rather than duplicate.
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { googleId: profile.googleId, avatarUrl: user.avatarUrl ?? profile.avatarUrl },
      });
      return toPublicUser(user);
    }

    user = await this.prisma.user.create({
      data: {
        googleId: profile.googleId,
        email: profile.email,
        name: profile.name,
        avatarUrl: profile.avatarUrl,
      },
    });
    return toPublicUser(user);
  }

  async issueTokens(userId: string, email: string): Promise<AuthTokens> {
    const accessToken = await this.jwt.signAsync(
      { sub: userId, email, type: 'access' },
      { secret: process.env.JWT_SECRET, expiresIn: process.env.JWT_ACCESS_TTL ?? '15m' },
    );

    const refreshRecord = await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: '', // filled in after we know the jti below
        expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
      },
    });

    const refreshToken = await this.jwt.signAsync(
      { sub: userId, jti: refreshRecord.id, type: 'refresh' } as JwtRefreshPayload,
      { secret: process.env.JWT_REFRESH_SECRET, expiresIn: process.env.JWT_REFRESH_TTL ?? '30d' },
    );

    await this.prisma.refreshToken.update({
      where: { id: refreshRecord.id },
      data: { tokenHash: hashToken(refreshToken) },
    });

    return { accessToken, refreshToken };
  }

  /** Verifies a refresh token, ensures it hasn't been revoked/reused, and rotates it. */
  async refresh(refreshToken: string): Promise<{ user: PublicUser; tokens: AuthTokens }> {
    let payload: JwtRefreshPayload;
    try {
      payload = await this.jwt.verifyAsync(refreshToken, { secret: process.env.JWT_REFRESH_SECRET });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (payload.type !== 'refresh') throw new UnauthorizedException('Invalid token type');

    const record = await this.prisma.refreshToken.findUnique({ where: { id: payload.jti } });
    if (!record || record.revokedAt || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired or revoked');
    }
    if (record.tokenHash !== hashToken(refreshToken)) {
      // Token doesn't match what we issued — treat as compromised and revoke.
      await this.prisma.refreshToken.update({
        where: { id: record.id },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Refresh token mismatch');
    }

    const user = await this.prisma.user.findUnique({ where: { id: record.userId } });
    if (!user) throw new UnauthorizedException('User not found');

    // Rotate: revoke old, issue new.
    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    });
    const tokens = await this.issueTokens(user.id, user.email);
    return { user: toPublicUser(user), tokens };
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) return;
    try {
      const payload = await this.jwt.verifyAsync<JwtRefreshPayload>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
      await this.prisma.refreshToken.updateMany({
        where: { id: payload.jti, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } catch {
      // Already invalid/expired — nothing to revoke.
    }
  }

  async me(userId: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return toPublicUser(user);
  }
}
