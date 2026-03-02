import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import type {
  StartCheckInDto,
  StartSafeRideDto,
  StartWalkAloneDto,
  StartSOSDto,
} from '@safecircle/shared-types';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async startCheckIn(userId: string, dto: StartCheckInDto) {
    const session = await this.prisma.safetySession.create({
      data: {
        userId,
        type: 'CHECKIN',
        status: 'ACTIVE',
        subStatus: 'TRACKING',
        shareWith: dto.shareWith,
        policy: {
          type: 'CHECKIN',
          destination: dto.destination,
          etaAt: dto.etaAt,
          gracePeriodMinutes: dto.gracePeriodMinutes ?? 15,
          shareWith: dto.shareWith,
        },
        checkInDetails: {
          create: {
            destination: dto.destination,
            etaAt: new Date(dto.etaAt),
            gracePeriodMinutes: dto.gracePeriodMinutes ?? 15,
          },
        },
      },
      include: { checkInDetails: true },
    });

    await this.redis.setSessionState(session.id, {
      status: 'ACTIVE',
      type: 'CHECKIN',
      eta: dto.etaAt,
    });

    this.logger.log(`CheckIn session started: ${session.id}`);
    return session;
  }

  async startSafeRide(userId: string, dto: StartSafeRideDto) {
    const session = await this.prisma.safetySession.create({
      data: {
        userId,
        type: 'SAFERIDE',
        status: 'ACTIVE',
        subStatus: 'TRACKING',
        shareWith: dto.shareWith,
        policy: {
          type: 'SAFERIDE',
          origin: { lat: dto.origin.lat, lng: dto.origin.lng },
          destination: { lat: dto.destination.lat, lng: dto.destination.lng },
          deviationThresholdMeters: dto.deviationThresholdMeters ?? 200,
          stopThresholdSeconds: dto.stopThresholdSeconds ?? 120,
          shareWith: dto.shareWith,
          routePolyline: '', // caller must fetch from Directions API and set here
        } as Prisma.InputJsonValue,
        safeRideDetails: {
          create: {
            originLat: dto.origin.lat,
            originLng: dto.origin.lng,
            destinationLat: dto.destination.lat,
            destinationLng: dto.destination.lng,
            routePolyline: '',
            deviationThresholdMeters: dto.deviationThresholdMeters ?? 200,
            stopThresholdSeconds: dto.stopThresholdSeconds ?? 120,
          },
        },
      },
      include: { safeRideDetails: true },
    });

    await this.redis.setSessionState(session.id, { status: 'ACTIVE', type: 'SAFERIDE' });
    return session;
  }

  async startWalkAlone(userId: string, dto: StartWalkAloneDto) {
    const session = await this.prisma.safetySession.create({
      data: {
        userId,
        type: 'WALKALONE',
        status: 'ACTIVE',
        subStatus: 'TRACKING',
        shareWith: dto.shareWith,
        policy: {
          type: 'WALKALONE',
          promptIntervalSeconds: dto.promptIntervalSeconds ?? 300,
          shareWith: dto.shareWith,
        },
        walkAloneDetails: {
          create: {
            promptIntervalSeconds: dto.promptIntervalSeconds ?? 300,
          },
        },
      },
      include: { walkAloneDetails: true },
    });

    await this.redis.setSessionState(session.id, { status: 'ACTIVE', type: 'WALKALONE' });
    return session;
  }

  async startSOS(userId: string, dto: StartSOSDto) {
    // SOS shares with ALL verified contacts if shareWith is empty
    let shareWith = dto.shareWith ?? [];
    if (shareWith.length === 0) {
      const contacts = await this.prisma.trustedContact.findMany({
        where: { ownerId: userId, isVerified: true, status: 'ACTIVE' },
        select: { id: true },
      });
      shareWith = contacts.map((c) => c.id);
    }

    const session = await this.prisma.safetySession.create({
      data: {
        userId,
        type: 'SOS',
        status: 'ACTIVE',
        subStatus: 'BROADCASTING',
        shareWith,
        policy: {
          type: 'SOS',
          shareWith,
          smsDelaySeconds: 30,
          callDelaySeconds: 60,
        },
      },
    });

    await this.redis.setSessionState(session.id, { status: 'ACTIVE', type: 'SOS' });
    this.logger.warn(`SOS session started: ${session.id} for user ${userId}`);
    return session;
  }

  async endSession(sessionId: string, userId: string) {
    await this.validateOwnership(sessionId, userId);

    const session = await this.prisma.safetySession.update({
      where: { id: sessionId },
      data: { status: 'COMPLETED', endedAt: new Date() },
    });

    await this.redis.deleteSession(sessionId);
    return session;
  }

  async findOneForUser(sessionId: string, userId: string) {
    const session = await this.prisma.safetySession.findUnique({
      where: { id: sessionId },
      include: {
        checkInDetails: true,
        safeRideDetails: true,
        walkAloneDetails: true,
      },
    });

    if (!session) throw new NotFoundException('Session not found');

    // Allow session owner OR trusted contacts to view
    const isOwner = session.userId === userId;
    const isWatcher = session.shareWith.includes(userId);
    if (!isOwner && !isWatcher) throw new ForbiddenException();

    return session;
  }

  async validateOwnership(sessionId: string, userId: string): Promise<void> {
    const session = await this.prisma.safetySession.findUnique({
      where: { id: sessionId },
      select: { userId: true, status: true },
    });
    if (!session) throw new NotFoundException('Session not found');
    if (session.userId !== userId) throw new ForbiddenException('Not session owner');
    if (session.status !== 'ACTIVE') throw new ForbiddenException('Session not active');
  }
}
