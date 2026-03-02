/**
 * SmsProvider — Twilio SMS + voice call.
 * Abstracted behind an interface so BD-specific gateway can swap in.
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import twilio from 'twilio';

@Injectable()
export class SmsProvider {
  private readonly logger = new Logger(SmsProvider.name);
  private client: ReturnType<typeof twilio> | null = null;
  private readonly fromNumber: string;

  constructor(private readonly config: ConfigService) {
    const sid = config.get<string>('TWILIO_ACCOUNT_SID');
    const token = config.get<string>('TWILIO_AUTH_TOKEN');
    this.fromNumber = config.get<string>('TWILIO_PHONE_NUMBER', '');

    if (sid && token && sid !== 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx') {
      this.client = twilio(sid, token);
    } else {
      this.logger.warn('Twilio not configured — SMS/calls will be logged only');
    }
  }

  async send(to: string, body: string): Promise<void> {
    if (!this.client) {
      this.logger.log(`SMS (dev) → ${to}: ${body.slice(0, 80)}`);
      return;
    }

    try {
      await this.client.messages.create({ to, from: this.fromNumber, body });
      this.logger.log(`SMS sent to ${to}`);
    } catch (err) {
      this.logger.error(`SMS failed to ${to}`, err);
      throw err;
    }
  }

  async initiateCall(to: string, message: string): Promise<void> {
    if (!this.client) {
      this.logger.log(`CALL (dev) → ${to}: ${message.slice(0, 80)}`);
      return;
    }

    try {
      const twiml = `<Response><Say voice="alice">${message}</Say></Response>`;
      await this.client.calls.create({
        to,
        from: this.fromNumber,
        twiml,
      });
      this.logger.log(`Call initiated to ${to}`);
    } catch (err) {
      this.logger.error(`Call failed to ${to}`, err);
      throw err;
    }
  }
}
