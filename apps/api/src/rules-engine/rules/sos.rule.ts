/**
 * SOSRule — escalation ladder:
 *   T+0s:  SOS_TRIGGERED → push notification to all contacts
 *   T+30s: SOS_ESCALATED_SMS → SMS to all contacts
 *   T+60s: SOS_ESCALATED_CALL → voice call to contacts (via Twilio)
 */
import { Injectable, Logger } from '@nestjs/common';

import { secondsSince } from '@safecircle/shared-utils';
import { AlertsService } from '../../alerts/alerts.service';
import { NotificationsService } from '../../notifications/notifications.service';
import type { SOSRulePayload } from '../types';

@Injectable()
export class SOSRule {
  private readonly logger = new Logger(SOSRule.name);

  constructor(
    private readonly alertsService: AlertsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async evaluate(sessionId: string, payload: SOSRulePayload): Promise<void> {
    const secondsElapsed = secondsSince(payload.startedAt);

    // ─── T+0: Push notification (triggered immediately on SOS start) ──────────
    if (!payload.pushSentAt) {
      this.logger.warn(`SOS ${sessionId}: Sending initial push alerts`);
      const alert = await this.alertsService.createAlert({
        sessionId,
        type: 'SOS_TRIGGERED',
        severity: 'CRITICAL',
        message: 'EMERGENCY: User has triggered an SOS alert',
        metadata: { startedAt: payload.startedAt, escalationLevel: 1 },
        notifiedContacts: payload.shareWith,
        channels: ['PUSH', 'IN_APP'],
      });
      await this.notificationsService.dispatch(alert, payload.shareWith);
      return;
    }

    // ─── T+30s: SMS ───────────────────────────────────────────────────────────
    if (!payload.smsSentAt && secondsElapsed >= payload.smsDelaySeconds) {
      this.logger.warn(`SOS ${sessionId}: Sending SMS escalation (T+${secondsElapsed.toFixed(0)}s)`);
      const alert = await this.alertsService.createAlert({
        sessionId,
        type: 'SOS_ESCALATED_SMS',
        severity: 'CRITICAL',
        message: 'EMERGENCY: SOS alert escalated — sending SMS to all contacts',
        metadata: {
          startedAt: payload.startedAt,
          escalationLevel: 2,
          secondsElapsed: Math.round(secondsElapsed),
        },
        notifiedContacts: payload.shareWith,
        channels: ['SMS'],
      });
      await this.notificationsService.dispatch(alert, payload.shareWith);
      return;
    }

    // ─── T+60s: Voice call ────────────────────────────────────────────────────
    if (!payload.callInitiatedAt && secondsElapsed >= payload.callDelaySeconds) {
      this.logger.warn(`SOS ${sessionId}: Initiating calls (T+${secondsElapsed.toFixed(0)}s)`);
      const alert = await this.alertsService.createAlert({
        sessionId,
        type: 'SOS_ESCALATED_CALL',
        severity: 'CRITICAL',
        message: 'EMERGENCY: SOS alert critical — initiating voice calls to contacts',
        metadata: {
          startedAt: payload.startedAt,
          escalationLevel: 3,
          secondsElapsed: Math.round(secondsElapsed),
        },
        notifiedContacts: payload.shareWith,
        channels: ['CALL'],
      });
      await this.notificationsService.dispatch(alert, payload.shareWith);
    }
  }
}
