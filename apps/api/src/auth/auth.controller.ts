import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { AuthService } from './auth.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { AuthenticatedRequest } from './types';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('request-otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 3600000, limit: 5 } }) // 5 OTPs per hour per IP
  @ApiOperation({ summary: 'Request OTP via SMS' })
  async requestOtp(@Body() dto: RequestOtpDto) {
    await this.authService.requestOtp(dto.phone);
    return { message: 'OTP sent' };
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 3600000, limit: 10 } })
  @ApiOperation({ summary: 'Verify OTP and receive JWT tokens' })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.phone, dto.otp);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate refresh token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke refresh token' })
  async logout(@Request() req: AuthenticatedRequest, @Body() dto: RefreshTokenDto) {
    await this.authService.logout(req.user.sub, dto.refreshToken);
  }

  @Post('push-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register Expo push token for this device' })
  async registerPushToken(
    @Request() req: AuthenticatedRequest,
    @Body() body: { token: string },
  ) {
    await this.authService.registerPushToken(req.user.sub, body.token);
  }

  @Delete('push-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove Expo push token (on logout)' })
  async removePushToken(
    @Request() req: AuthenticatedRequest,
    @Body() body: { token: string },
  ) {
    await this.authService.removePushToken(req.user.sub, body.token);
  }
}
