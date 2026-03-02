/**
 * CheckInRule — triggers DELAYED_ARRIVAL when now > eta + grace_period.
 * Idempotent: no-ops if already escalated.
 */
import { Injectable, Logger } from '@nestjs/common';

import { minutesSince } from '@safecircle/shared-utils';
import { AlertsService } from '../../alerts/alerts.service';
import { NotificationsService } from '../../notifications/notifications.service';
import type { CheckInRulePayload } from '../types';

@Injectable()
export class CheckInRule {
  private readonly logger = new Logger(CheckInRule.name);

  constructor(
    private readonly alertsService: AlertsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async evaluate(sessionId: string, payload: CheckInRulePayload): Promise<void> {
    if (payload.alreadyEscalated) return;

    const now = Date.now();
    const eta = new Date(payload.etaAt).getTime();
    const graceMs = payload.gracePeriodMinutes * 60 * 1000;
    const overdueMs = now - (eta + graceMs);

    if (overdueMs <= 0) {
      this.logger.debug(`CheckIn ${sessionId}: on time, eta in ${Math.abs(overdueMs / 60000).toFixed(1)}m`);
      return;
    }

    const overdueMinutes = (overdueMs / 60_000).toFixed(1);
    this.logger.warn(`CheckIn ${sessionId}: OVERDUE by ${overdueMinutes}m`);

    const alert = await this.alertsService.createAlert({
      sessionId,
      type: 'DELAYED_ARRIVAL',
      severity: 'CRITICAL',
      message: `Check-in overdue by ${overdueMinutes} minutes`,
      metadata: {
        etaAt: payload.etaAt,
        gracePeriodMinutes: payload.gracePeriodMinutes,
        overdueMinutes: parseFloat(overdueMinutes),
        location: payload.location,
      },
      notifiedContacts: payload.shareWith,
      channels: ['PUSH', 'SMS'],
    });

    await this.notificationsService.dispatch(alert, payload.shareWith);
  }
}
