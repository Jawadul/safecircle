/**
 * SafeRideRule — triggers:
 *   ROUTE_DEVIATION when distance from route > deviationThresholdMeters
 *   UNEXPLAINED_STOP when speed < 0.5m/s for > stopThresholdSeconds
 */
import { Injectable, Logger } from '@nestjs/common';

import { distanceFromRoute, secondsSince } from '@safecircle/shared-utils';
import { AlertsService } from '../../alerts/alerts.service';
import { NotificationsService } from '../../notifications/notifications.service';
import type { SafeRideRulePayload } from '../types';

const MIN_MOVING_SPEED_MS = 0.5; // m/s

@Injectable()
export class SafeRideRule {
  private readonly logger = new Logger(SafeRideRule.name);

  constructor(
    private readonly alertsService: AlertsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async evaluate(sessionId: string, payload: SafeRideRulePayload): Promise<void> {
    if (payload.alreadyEscalated) return;

    await Promise.all([
      this.checkDeviation(sessionId, payload),
      this.checkStop(sessionId, payload),
    ]);
  }

  private async checkDeviation(sessionId: string, payload: SafeRideRulePayload): Promise<void> {
    const { location, routePolyline, deviationThresholdMeters, firstDeviationAt } = payload;

    const distanceFromRouteM = distanceFromRoute(
      { lat: location.lat, lng: location.lng },
      routePolyline,
    );

    if (distanceFromRouteM <= deviationThresholdMeters) return;
    if (firstDeviationAt) return; // already alerted

    this.logger.warn(
      `SafeRide ${sessionId}: DEVIATION ${distanceFromRouteM.toFixed(0)}m from route`,
    );

    const alert = await this.alertsService.createAlert({
      sessionId,
      type: 'ROUTE_DEVIATION',
      severity: 'CRITICAL',
      message: `Ride deviated ${distanceFromRouteM.toFixed(0)}m from planned route`,
      metadata: {
        deviationMeters: Math.round(distanceFromRouteM),
        threshold: deviationThresholdMeters,
        location,
      },
      notifiedContacts: payload.shareWith,
      channels: ['PUSH', 'SMS'],
    });

    await this.notificationsService.dispatch(alert, payload.shareWith);
  }

  private async checkStop(sessionId: string, payload: SafeRideRulePayload): Promise<void> {
    const { location, stopThresholdSeconds, firstStopAt } = payload;

    const isStationary =
      location.speed === null || location.speed < MIN_MOVING_SPEED_MS;

    if (!isStationary) return;

    // Only escalate if stop has been ongoing for > threshold
    if (!firstStopAt) return; // Will be set by SessionsService on first stationary ping

    const stoppedSeconds = secondsSince(firstStopAt);
    if (stoppedSeconds <= stopThresholdSeconds) return;
    if (payload.alreadyEscalated) return;

    this.logger.warn(
      `SafeRide ${sessionId}: STOP for ${stoppedSeconds.toFixed(0)}s (threshold: ${stopThresholdSeconds}s)`,
    );

    const alert = await this.alertsService.createAlert({
      sessionId,
      type: 'UNEXPLAINED_STOP',
      severity: 'CRITICAL',
      message: `Ride has been stationary for ${Math.round(stoppedSeconds / 60)} minutes`,
      metadata: {
        stoppedSeconds: Math.round(stoppedSeconds),
        threshold: stopThresholdSeconds,
        location,
        firstStopAt,
      },
      notifiedContacts: payload.shareWith,
      channels: ['PUSH', 'SMS'],
    });

    await this.notificationsService.dispatch(alert, payload.shareWith);
  }
}
