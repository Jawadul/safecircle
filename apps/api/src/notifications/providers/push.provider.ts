/**
 * PushProvider — sends push notifications via Expo Push Service.
 * Expo handles routing to FCM (Android) and APNs (iOS) automatically.
 * Tokens are stored per-user in the `pushTokens` column of the users table.
 */
import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  priority?: 'default' | 'normal' | 'high';
}

interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
}

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

@Injectable()
export class PushProvider {
  private readonly logger = new Logger(PushProvider.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Send a push notification to all devices registered for the given phone number.
   * Silently drops if the user has no registered tokens.
   */
  async send(phone: string, alertType: string, message: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { phone }, select: { pushTokens: true } });
    if (!user || user.pushTokens.length === 0) {
      this.logger.debug(`No push tokens for ${phone} — skipping push`);
      return;
    }

    const messages: ExpoPushMessage[] = user.pushTokens.map((token) => ({
      to: token,
      title: 'SafeCircle Alert',
      body: message,
      data: { alertType },
      sound: 'default',
      priority: alertType.startsWith('SOS') ? 'high' : 'normal',
    }));

    // Expo accepts up to 100 messages per request
    for (let i = 0; i < messages.length; i += 100) {
      const batch = messages.slice(i, i + 100);
      await this.sendBatch(phone, batch);
    }
  }

  private async sendBatch(phone: string, messages: ExpoPushMessage[]): Promise<void> {
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      if (!res.ok) {
        this.logger.error(`Expo push batch failed for ${phone}: HTTP ${res.status}`);
        return;
      }

      const result = (await res.json()) as { data: ExpoPushTicket[] };
      for (const ticket of result.data) {
        if (ticket.status === 'error') {
          this.logger.warn(`Push ticket error for ${phone}: ${ticket.message} (${ticket.details?.error})`);
        }
      }
    } catch (err) {
      this.logger.error(`Expo push request failed for ${phone}`, err);
    }
  }
}
