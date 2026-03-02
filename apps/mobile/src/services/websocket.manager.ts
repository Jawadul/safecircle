/**
 * websocket.manager.ts — Socket.io connection manager.
 * Handles auth, reconnection, and event routing.
 */
import { io, type Socket } from 'socket.io-client';
import Constants from 'expo-constants';

import type {
  ClientToServerEvents,
  ServerToClientEvents,
  WsLocationUpdate,
  WsSessionJoin,
} from '@safecircle/shared-types';
import { useAuthStore } from '../stores/auth.store';
import { useSessionStore } from '../stores/session.store';

const WS_URL = (Constants.expoConfig?.extra as { wsUrl?: string } | undefined)?.wsUrl ?? 'ws://localhost:3000';

type SafeCircleSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: SafeCircleSocket | null = null;

export const WebSocketManager = {
  connect(): SafeCircleSocket {
    if (socket?.connected) return socket;

    const { tokens } = useAuthStore.getState();

    socket = io(`${WS_URL}/location`, {
      auth: { token: tokens?.accessToken },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    }) as SafeCircleSocket;

    socket.on('connect', () => {
      console.warn('WS connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.warn('WS disconnected:', reason);
    });

    socket.on('session:alert', ({ alert }) => {
      // Route to in-app notification handler
      // TODO: show in-app alert via expo-notifications
      console.warn('In-app alert:', alert.type, alert.message);
    });

    socket.on('session:status_change', ({ status, subStatus }) => {
      useSessionStore.getState().updateSessionStatus(
        status as Parameters<typeof useSessionStore.getState().updateSessionStatus>[0],
      );
    });

    socket.on('error', ({ code, message }) => {
      console.error('WS error:', code, message);
    });

    return socket;
  },

  disconnect() {
    socket?.disconnect();
    socket = null;
  },

  async joinSession(sessionId: string, role: 'owner' | 'watcher' = 'owner') {
    const s = this.connect();
    return new Promise<void>((resolve, reject) => {
      s.emit('session:join', { sessionId, role }, (ack) => {
        if (ack.success) resolve();
        else reject(new Error(ack.error));
      });
    });
  },

  async sendLocation(payload: WsLocationUpdate) {
    const s = this.connect();
    return new Promise<void>((resolve, reject) => {
      s.emit('location:update', payload, (ack) => {
        if (ack.success) resolve();
        else reject(new Error(ack.error));
      });
    });
  },

  leaveSession(sessionId: string) {
    socket?.emit('session:leave', { sessionId });
  },

  isConnected() {
    return socket?.connected ?? false;
  },
};
