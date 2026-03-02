import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';

import { AuthModule } from './auth/auth.module';
import { ContactsModule } from './contacts/contacts.module';
import { SessionsModule } from './sessions/sessions.module';
import { LocationModule } from './location/location.module';
import { AlertsModule } from './alerts/alerts.module';
import { RulesEngineModule } from './rules-engine/rules-engine.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    // ─── Config ──────────────────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env', '../../.env.local', '../../.env'],
    }),

    // ─── Rate Limiting ────────────────────────────────────────────────────────
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('THROTTLE_TTL', 60) * 1000,
          limit: config.get<number>('THROTTLE_LIMIT', 100),
        },
      ],
    }),

    // ─── BullMQ / Redis ───────────────────────────────────────────────────────
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          url: config.getOrThrow<string>('REDIS_URL'),
        },
      }),
    }),

    // ─── Feature Modules ──────────────────────────────────────────────────────
    PrismaModule,
    HealthModule,
    AuthModule,
    ContactsModule,
    SessionsModule,
    LocationModule,
    AlertsModule,
    RulesEngineModule,
    NotificationsModule,
  ],
})
export class AppModule {}
