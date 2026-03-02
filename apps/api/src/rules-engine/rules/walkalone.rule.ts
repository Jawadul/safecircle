/**
 * WalkAloneRule — triggers NON_RESPONSE when a prompt was sent but not answered
 * within promptIntervalSeconds.
 */
import { Injectable, Logger } from '@nestjs/common';

import { secondsSince } from '@safecircle/shared-utils';
import { AlertsService } from '../../alerts/alerts.service';
import { NotificationsService } from '../../notifications/notifications.service';
import type { WalkAloneRulePayload } from '../types';

@Injectable()
export class WalkAloneRule {
  private readonly logger = new Logger(WalkAloneRule.name);

  constructor(
    private readonly alertsService: AlertsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async evaluate(sessionId: string, payload: WalkAloneRulePayload): Promise<void> {
    if (payload.alreadyEscalated) return;

    const { lastPromptAt, lastResponseAt, promptIntervalSeconds } = payload;

    if (!lastPromptAt) return; // No prompt sent yet

    // If there was a response after the last prompt, user is OK
    if (lastResponseAt && new Date(lastResponseAt) >= new Date(lastPromptAt)) return;

    const secondsSincePrompt = secondsSince(lastPromptAt);

    if (secondsSincePrompt <= promptIntervalSeconds) return;

    this.logger.warn(
      `WalkAlone ${sessionId}: NON_RESPONSE after ${secondsSincePrompt.toFixed(0)}s (interval: ${promptIntervalSeconds}s)`,
    );

    const alert = await this.alertsService.createAlert({
      sessionId,
      type: 'NON_RESPONSE',
      severity: 'CRITICAL',
      message: `No response to safety check-in prompt for ${Math.round(secondsSincePrompt / 60)} minutes`,
      metadata: {
        lastPromptAt,
        secondsSincePrompt: Math.round(secondsSincePrompt),
        promptIntervalSeconds,
        lastLocation: payload.location,
      },
      notifiedContacts: payload.shareWith,
      channels: ['PUSH', 'SMS'],
    });

    await this.notificationsService.dispatch(alert, payload.shareWith);
  }
}
