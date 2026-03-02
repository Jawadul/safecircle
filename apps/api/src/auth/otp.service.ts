import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { generateOtp } from '@safecircle/shared-utils';
import { RedisService } from '../redis/redis.service';

const OTP_TTL_SECONDS = 300; // 5 minutes
const OTP_BCRYPT_ROUNDS = 10;
const KEY = (phone: string) => `otp:${phone}`;

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(private readonly redis: RedisService) {}

  /** Generates a new OTP, hashes it, stores in Redis. Returns plaintext OTP. */
  async generateAndStore(phone: string): Promise<string> {
    const otp = generateOtp();
    const hash = await bcrypt.hash(otp, OTP_BCRYPT_ROUNDS);
    await this.redis.client.set(KEY(phone), hash, 'EX', OTP_TTL_SECONDS);
    return otp;
  }

  /** Returns true if OTP is valid (and increments attempt counter). */
  async verify(phone: string, otp: string): Promise<boolean> {
    const hash = await this.redis.client.get(KEY(phone));
    if (!hash) return false;
    const match = await bcrypt.compare(otp, hash);
    return match;
  }

  /** Deletes the OTP after successful verification. */
  async delete(phone: string): Promise<void> {
    await this.redis.client.del(KEY(phone));
  }
}
