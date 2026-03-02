/**
 * NotificationsService — fan-out notifications to trusted contacts.
 * Dispatches via push first, falls back to SMS if push is unavailable.
 */
import { Injectable, Logger } from '@nestjs/common';

import type { AlertEvent, AlertChannel } from '@safecircle/shared-types';
import { PrismaService } from '../prisma/prisma.service';
import { PushProvider } from './providers/push.provider';
import { SmsProvider } from './providers/sms.provider';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushProvider,
    private readonly sms: SmsProvider,
  ) {}

  async dispatch(alert: AlertEvent, contactIds: string[]): Promise<void> {
    if (contactIds.length === 0) {
      this.logger.warn(`Alert ${alert.id}: no contacts to notify`);
      return;
    }

    const contacts = await this.prisma.trustedContact.findMany({
      where: { id: { in: contactIds }, status: 'ACTIVE', isVerified: true },
    });

    await Promise.allSettled(
      contacts.map((contact) => this.notifyContact(alert, contact.phone, contact.alertChannels as AlertChannel[])),
    );
  }

  private async notifyContact(
    alert: AlertEvent,
    phone: string,
    channels: AlertChannel[],
  ): Promise<void> {
    const message = this.formatMessage(alert);

    for (const channel of channels) {
      try {
        switch (channel) {
          case 'PUSH':
            await this.push.send(phone, alert.type, message);
            break;
          case 'SMS':
            await this.sms.send(phone, message);
            break;
          case 'CALL':
            await this.sms.initiateCall(phone, message);
            break;
          case 'IN_APP':
            // In-app notifications are delivered via Socket.io in LocationGateway
            break;
        }
      } catch (err) {
        this.logger.error(`Failed to notify ${phone} via ${channel}`, err);
      }
    }
  }

  private formatMessage(alert: AlertEvent): string {
    switch (alert.type) {
      case 'DELAYED_ARRIVAL':
        return `SafeCircle ALERT: Your contact has not arrived at their destination. Last known location shared.`;
      case 'ROUTE_DEVIATION':
        return `SafeCircle ALERT: Your contact has deviated from their planned route.`;
      case 'UNEXPLAINED_STOP':
        return `SafeCircle ALERT: Your contact's ride has made an unexplained stop.`;
      case 'NON_RESPONSE':
        return `SafeCircle ALERT: Your contact has not responded to a safety check-in.`;
      case 'SOS_TRIGGERED':
        return `⚠️ SafeCircle EMERGENCY: Your contact has triggered an SOS alert. Check the app immediately.`;
      case 'SOS_ESCALATED_SMS':
        return `🚨 SafeCircle EMERGENCY: SOS alert escalated. Your contact may be in danger. Call them now.`;
      case 'SOS_ESCALATED_CALL':
        return `🚨 SafeCircle CRITICAL EMERGENCY: Initiating emergency call sequence.`;
      default:
        return `SafeCircle: ${alert.message}`;
    }
  }
}
