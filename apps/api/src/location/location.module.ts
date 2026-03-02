import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { LocationGateway } from './location.gateway';
import { RULES_ENGINE_QUEUE } from '../rules-engine/rules-engine.constants';
import { SessionsModule } from '../sessions/sessions.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: RULES_ENGINE_QUEUE }),
    SessionsModule,
    AuthModule,
  ],
  providers: [LocationGateway],
})
export class LocationModule {}
