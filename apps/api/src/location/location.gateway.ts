/**
 * location.gateway.ts — Socket.io WebSocket gateway for real-time location.
 *
 * Flow for each "location:update" event:
 *   1. Authenticate JWT from socket handshake
 *   2. Validate session ownership (Redis + DB)
 *   3. Rate limit: 1 ping / 3s per session
 *   4. Write latest location to Redis
 *   5. Persist LocationPing to DB (async, non-blocking)
 *   6. Enqueue BullMQ EVALUATE_SESSION job
 *   7. Broadcast "location:broadcast" to session room (contact watchers)
 */
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
  WsException,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectQueue } from '@nestjs/bullmq';
import type { Server, Socket } from 'socket.io';
import type { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';

import type {
  ClientToServerEvents,
  ServerToClientEvents,
  WsLocationUpdate,
  WsSessionJoin,
  WsAck,
} from '@safecircle/shared-types';
import { encodeGeohash } from '@safecircle/shared-utils';

import { RedisService } from '../redis/redis.service';
import { SessionsService } from '../sessions/sessions.service';
import { PrismaService } from '../prisma/prisma.service';
import { RULES_ENGINE_QUEUE } from '../rules-engine/rules-engine.constants';
import type { EvaluateSessionJob } from '../rules-engine/types';

const RATE_LIMIT_MS = 3000; // min 3s between pings per session

@WebSocketGateway({
  cors: {
    origin: '*', // tightened via ConfigService in production
    credentials: true,
  },
  namespace: '/location',
})
export class LocationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server<ClientToServerEvents, ServerToClientEvents>;

  private readonly logger = new Logger(LocationGateway.name);
  private readonly lastPingTime = new Map<string, number>(); // sessionId → ms

  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly sessionsService: SessionsService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @InjectQueue(RULES_ENGINE_QUEUE) private readonly rulesQueue: Queue<EvaluateSessionJob>,
  ) {}

  afterInit() {
    this.logger.log('LocationGateway initialized');
  }

  async handleConnection(socket: Socket) {
    try {
      const token = socket.handshake.auth['token'] as string | undefined;
      if (!token) throw new WsException('No token');

      const payload = this.jwtService.verify<{ sub: string; type: string }>(token, {
        secret: this.config.getOrThrow('JWT_SECRET'),
      });

      if (payload.type !== 'access') throw new WsException('Invalid token type');

      socket.data['userId'] = payload.sub;
      this.logger.debug(`Socket connected: ${socket.id} (user: ${payload.sub})`);
    } catch {
      socket.disconnect();
    }
  }

  handleDisconnect(socket: Socket) {
    this.logger.debug(`Socket disconnected: ${socket.id}`);
  }

  @SubscribeMessage('session:join')
  async handleJoin(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: WsSessionJoin,
  ): Promise<WsAck> {
    try {
      const userId = socket.data['userId'] as string;
      const session = await this.sessionsService.findOneForUser(payload.sessionId, userId);

      if (payload.role === 'owner' && session.userId !== userId) {
        return { success: false, error: 'Unauthorized' };
      }

      await socket.join(`session:${payload.sessionId}`);
      return { success: true };
    } catch {
      return { success: false, error: 'Session not found' };
    }
  }

  @SubscribeMessage('location:update')
  async handleLocationUpdate(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: WsLocationUpdate,
  ): Promise<WsAck> {
    const userId = socket.data['userId'] as string;

    // ─── Rate limit ──────────────────────────────────────────────────────────
    const now = Date.now();
    const lastPing = this.lastPingTime.get(payload.sessionId) ?? 0;
    if (now - lastPing < RATE_LIMIT_MS) {
      return { success: false, error: 'Rate limited: max 1 ping per 3s' };
    }
    this.lastPingTime.set(payload.sessionId, now);

    // ─── Validate session ownership ──────────────────────────────────────────
    try {
      await this.sessionsService.validateOwnership(payload.sessionId, userId);
    } catch {
      return { success: false, error: 'Unauthorized or session not found' };
    }

    const { location, sessionId } = payload;

    // ─── Write to Redis ───────────────────────────────────────────────────────
    await this.redisService.setLatestLocation(sessionId, location.lat, location.lng, location.timestamp);

    // ─── Persist to DB (fire and forget — non-critical path) ─────────────────
    const geohash6 = encodeGeohash({ lat: location.lat, lng: location.lng }, 6);
    this.prisma.locationPing
      .create({
        data: {
          sessionId,
          userId,
          lat: location.lat,
          lng: location.lng,
          accuracy: location.accuracy,
          altitude: location.altitude ?? null,
          speed: location.speed ?? null,
          heading: location.heading ?? null,
          geohash6,
          recordedAt: new Date(location.timestamp),
        },
      })
      .catch((err) => this.logger.error('Failed to persist location ping', err));

    // ─── Enqueue rules engine job ─────────────────────────────────────────────
    const session = await this.sessionsService.findOneForUser(sessionId, userId);
    await this.rulesQueue.add(
      'EVALUATE_SESSION',
      this.buildJobPayload(session, userId, location),
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    );

    // ─── Broadcast to room (contact watchers) ────────────────────────────────
    socket.to(`session:${sessionId}`).emit('location:broadcast', {
      sessionId,
      location,
      userId,
    });

    return { success: true };
  }

  private buildJobPayload(
    session: Awaited<ReturnType<SessionsService['findOneForUser']>>,
    userId: string,
    location: WsLocationUpdate['location'],
  ): EvaluateSessionJob {
    const locationSnapshot = {
      lat: location.lat,
      lng: location.lng,
      speed: location.speed ?? null,
      timestamp: location.timestamp,
    };

    const policy = session.policy as Record<string, unknown>;

    switch (session.type) {
      case 'CHECKIN':
        return {
          sessionId: session.id,
          sessionType: 'CHECKIN',
          userId,
          payload: {
            etaAt: (policy['etaAt'] as string) ?? '',
            gracePeriodMinutes: (policy['gracePeriodMinutes'] as number) ?? 15,
            location: locationSnapshot,
            shareWith: session.shareWith,
            alreadyEscalated: session.status === 'ESCALATED',
          },
        };
      case 'SAFERIDE':
        return {
          sessionId: session.id,
          sessionType: 'SAFERIDE',
          userId,
          payload: {
            routePolyline: (policy['routePolyline'] as string) ?? '',
            deviationThresholdMeters: (policy['deviationThresholdMeters'] as number) ?? 200,
            stopThresholdSeconds: (policy['stopThresholdSeconds'] as number) ?? 120,
            location: locationSnapshot,
            shareWith: session.shareWith,
            firstDeviationAt: null,
            firstStopAt: null,
            alreadyEscalated: session.status === 'ESCALATED',
          },
        };
      case 'WALKALONE':
        return {
          sessionId: session.id,
          sessionType: 'WALKALONE',
          userId,
          payload: {
            promptIntervalSeconds: (policy['promptIntervalSeconds'] as number) ?? 300,
            lastPromptAt: null,
            lastResponseAt: null,
            location: locationSnapshot,
            shareWith: session.shareWith,
            alreadyEscalated: session.status === 'ESCALATED',
          },
        };
      case 'SOS':
      default:
        return {
          sessionId: session.id,
          sessionType: 'SOS',
          userId,
          payload: {
            startedAt: session.startedAt instanceof Date
              ? session.startedAt.toISOString()
              : String(session.startedAt),
            smsDelaySeconds: 30,
            callDelaySeconds: 60,
            shareWith: session.shareWith,
            pushSentAt: null,
            smsSentAt: null,
            callInitiatedAt: null,
          },
        };
    }
  }
}
