import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';

import { randomToken } from '@safecircle/shared-utils';
import type { AddContactDto, UpdateContactDto } from '@safecircle/shared-types';
import { PrismaService } from '../prisma/prisma.service';

const INVITE_TTL_HOURS = 48;

@Injectable()
export class ContactsService {
  private readonly logger = new Logger(ContactsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async listContacts(userId: string) {
    return this.prisma.trustedContact.findMany({
      where: { ownerId: userId, status: { not: 'REVOKED' } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addContact(userId: string, dto: AddContactDto) {
    // Anti-stalking: check no duplicate phone for this owner
    const existing = await this.prisma.trustedContact.findUnique({
      where: { ownerId_phone: { ownerId: userId, phone: dto.phone } },
    });
    if (existing && existing.status !== 'REVOKED') {
      throw new ConflictException('Contact with this phone already exists');
    }

    const inviteToken = randomToken(32);
    const inviteExpiresAt = new Date(Date.now() + INVITE_TTL_HOURS * 3600 * 1000);

    const contact = await this.prisma.trustedContact.create({
      data: {
        ownerId: userId,
        phone: dto.phone,
        name: dto.name,
        relationship: dto.relationship,
        alertChannels: dto.alertChannels,
        inviteToken,
        inviteExpiresAt,
        status: 'PENDING',
        isVerified: false,
      },
    });

    this.logger.log(`Contact ${contact.id} created for user ${userId}, invite sent to ${dto.phone}`);
    // TODO: dispatch invite SMS via NotificationsService
    return contact;
  }

  async updateContact(userId: string, contactId: string, dto: UpdateContactDto) {
    await this.ensureOwnership(userId, contactId);
    return this.prisma.trustedContact.update({
      where: { id: contactId },
      data: dto,
    });
  }

  async removeContact(userId: string, contactId: string) {
    await this.ensureOwnership(userId, contactId);
    await this.prisma.trustedContact.update({
      where: { id: contactId },
      data: { status: 'REVOKED', inviteToken: null },
    });
  }

  /** Called when invited person taps the invite link and accepts. */
  async acceptInvite(token: string, contactUserId: string) {
    const contact = await this.prisma.trustedContact.findUnique({
      where: { inviteToken: token },
    });

    if (!contact || !contact.inviteExpiresAt || contact.inviteExpiresAt < new Date()) {
      throw new NotFoundException('Invite not found or expired');
    }

    return this.prisma.trustedContact.update({
      where: { id: contact.id },
      data: {
        contactUserId,
        isVerified: true,
        status: 'ACTIVE',
        inviteToken: null, // invalidate after use
      },
    });
  }

  private async ensureOwnership(userId: string, contactId: string) {
    const contact = await this.prisma.trustedContact.findUnique({
      where: { id: contactId },
    });
    if (!contact) throw new NotFoundException('Contact not found');
    if (contact.ownerId !== userId) throw new ForbiddenException();
    return contact;
  }
}
