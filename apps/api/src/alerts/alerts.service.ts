import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { AlertEvent, AlertType, AlertSeverity, AlertChannel } from '@safecircle/shared-types';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateAlertInput {
  sessionId: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  metadata: Record<string, unknown>;
  notifiedContacts: string[];
  channels: AlertChannel[];
}

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Creates an immutable AlertEvent. Never call UPDATE on alert_events. */
  async createAlert(input: CreateAlertInput): Promise<AlertEvent> {
    const session = await this.prisma.safetySession.findUniqueOrThrow({
      where: { id: input.sessionId },
      select: { userId: true },
    });

    const row = await this.prisma.alertEvent.create({
      data: {
        sessionId: input.sessionId,
        userId: session.userId,
        type: input.type,
        severity: input.severity,
        message: input.message,
        metadata: input.metadata as Prisma.InputJsonValue,
        notifiedContacts: input.notifiedContacts,
        channels: input.channels,
        status: 'SENT',
      },
    });

    this.logger.log(`Alert created: ${row.id} (${row.type}) for session ${input.sessionId}`);

    return row as unknown as AlertEvent;
  }

  async getAlertsForSession(sessionId: string): Promise<AlertEvent[]> {
    const rows = await this.prisma.alertEvent.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });
    return rows as unknown as AlertEvent[];
  }

  /** Only allowed mutation: set acknowledgedAt. Controlled single-purpose method. */
  async acknowledge(
    alertId: string,
    contactId: string,
  ): Promise<void> {
    await this.prisma.alertEvent.update({
      where: { id: alertId },
      data: {
        status: 'ACKNOWLEDGED',
        acknowledgedAt: new Date(),
        acknowledgedBy: contactId,
      },
    });
  }
}
