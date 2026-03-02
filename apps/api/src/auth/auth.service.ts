import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';
import { OtpService } from './otp.service';
import type { AuthResponse, JwtPayload } from '@safecircle/shared-types';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly otpService: OtpService,
  ) {}

  async requestOtp(phone: string): Promise<void> {
    const otp = await this.otpService.generateAndStore(phone);
    // In production, dispatch via NotificationsModule (Twilio SMS)
    // For now, log in development only
    if (this.configService.get('NODE_ENV') !== 'production') {
      this.logger.warn(`DEV OTP for ${phone}: ${otp}`);
    }
    // TODO: inject NotificationsService and call sendSms()
  }

  async verifyOtp(phone: string, otp: string): Promise<AuthResponse> {
    const valid = await this.otpService.verify(phone, otp);
    if (!valid) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Upsert user on first login
    let user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          phone,
          name: phone, // user sets name in profile
          privacySettings: {
            locationRetentionDays: 30,
            shareLocationWithContacts: true,
            reduceLocationPrecision: false,
          },
        },
      });
      this.logger.log(`New user registered: ${user.id}`);
    }

    await this.otpService.delete(phone);
    return this.issueTokens(user.id, user.phone);
  }

  async refreshTokens(refreshToken: string): Promise<AuthResponse> {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.getOrThrow('JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Not a refresh token');
    }

    // Verify token exists and is not revoked
    const tokenHash = await bcrypt.hash(refreshToken, 1); // quick hash for lookup
    const stored = await this.prisma.refreshToken.findFirst({
      where: { userId: payload.sub, revokedAt: null, expiresAt: { gt: new Date() } },
    });

    if (!stored) {
      throw new UnauthorizedException('Refresh token revoked or expired');
    }

    // Rotate: revoke old, issue new
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: payload.sub } });
    return this.issueTokens(user.id, user.phone);
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async issueTokens(userId: string, phone: string): Promise<AuthResponse> {
    const accessPayload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: userId,
      phone,
      type: 'access',
    };
    const refreshPayload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: userId,
      phone,
      type: 'refresh',
    };

    const accessToken = this.jwtService.sign(accessPayload, {
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN', '15m'),
    });
    const refreshToken = this.jwtService.sign(refreshPayload, {
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    const refreshExpiresIn = 7 * 24 * 60 * 60 * 1000; // 7 days
    const tokenHash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + refreshExpiresIn),
      },
    });

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

    return {
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        privacySettings: user.privacySettings as unknown as AuthResponse['user']['privacySettings'],
      },
      tokens: { accessToken, refreshToken },
    };
  }

  async registerPushToken(userId: string, token: string): Promise<void> {
    // Add token if not already stored (max 5 devices per user)
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.pushTokens.includes(token)) return;

    const tokens = [...user.pushTokens, token].slice(-5);
    await this.prisma.user.update({ where: { id: userId }, data: { pushTokens: tokens } });
  }

  async removePushToken(userId: string, token: string): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const tokens = user.pushTokens.filter((t) => t !== token);
    await this.prisma.user.update({ where: { id: userId }, data: { pushTokens: tokens } });
  }

  async validateUser(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }
}
