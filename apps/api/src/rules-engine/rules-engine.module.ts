import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { RulesEngineProcessor } from './rules-engine.processor';
import { CheckInRule } from './rules/checkin.rule';
import { SafeRideRule } from './rules/saferide.rule';
import { WalkAloneRule } from './rules/walkalone.rule';
import { SOSRule } from './rules/sos.rule';
import { AlertsModule } from '../alerts/alerts.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RULES_ENGINE_QUEUE } from './rules-engine.constants';

export { RULES_ENGINE_QUEUE };

@Module({
  imports: [
    BullModule.registerQueue({ name: RULES_ENGINE_QUEUE }),
    AlertsModule,
    NotificationsModule,
  ],
  providers: [RulesEngineProcessor, CheckInRule, SafeRideRule, WalkAloneRule, SOSRule],
  exports: [BullModule],
})
export class RulesEngineModule {}
