import { Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';

import { REDIS_CLIENT } from './redis.tokens';

// ─── Key Helpers (single place for all Redis key shapes) ─────────────────────

export const RedisKeys = {
  sessionState: (id: string) => `session:${id}:state`,
  sessionLocation: (id: string) => `session:${id}:location`,
  otpKey: (phone: string) => `otp:${phone}`,
  walkalonePrompt: (id: string) => `walkalone:${id}:prompt`,
  rateLimitAuth: (ip: string) => `ratelimit:auth:${ip}`,
  rateLimitLocation: (uid: string) => `ratelimit:location:${uid}`,
};

@Injectable()
export class RedisService {
  constructor(@Inject(REDIS_CLIENT) public readonly client: Redis) {}

  async setSessionState(sessionId: string, fields: Record<string, string>): Promise<void> {
    await this.client.hset(RedisKeys.sessionState(sessionId), fields);
  }

  async getSessionState(sessionId: string): Promise<Record<string, string>> {
    return this.client.hgetall(RedisKeys.sessionState(sessionId));
  }

  async setLatestLocation(
    sessionId: string,
    lat: number,
    lng: number,
    timestamp: string,
  ): Promise<void> {
    await this.client.hset(RedisKeys.sessionLocation(sessionId), {
      lat: lat.toString(),
      lng: lng.toString(),
      timestamp,
    });
  }

  async getLatestLocation(
    sessionId: string,
  ): Promise<{ lat: number; lng: number; timestamp: string } | null> {
    const data = await this.client.hgetall(RedisKeys.sessionLocation(sessionId));
    if (!data['lat'] || !data['lng'] || !data['timestamp']) return null;
    return {
      lat: parseFloat(data['lat']),
      lng: parseFloat(data['lng']),
      timestamp: data['timestamp'],
    };
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.client.del(
      RedisKeys.sessionState(sessionId),
      RedisKeys.sessionLocation(sessionId),
    );
  }
}
