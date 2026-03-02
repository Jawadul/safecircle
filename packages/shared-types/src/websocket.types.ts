/**
 * websocket.types.ts — Socket.io event types for the location gateway
 */
import type { LocationPing } from './session.types';
import type { AlertEvent } from './alert.types';

// ─── Client → Server Events ───────────────────────────────────────────────────

export interface ClientToServerEvents {
  'location:update': (payload: WsLocationUpdate, ack: WsAck) => void;
  'session:join': (payload: WsSessionJoin, ack: WsAck) => void;
  'session:leave': (payload: WsSessionLeave) => void;
  'sos:panic': (payload: WsSOSPanic, ack: WsAck) => void;
}

// ─── Server → Client Events ───────────────────────────────────────────────────

export interface ServerToClientEvents {
  'location:broadcast': (payload: WsLocationBroadcast) => void;
  'session:alert': (payload: WsSessionAlert) => void;
  'session:status_change': (payload: WsStatusChange) => void;
  'error': (payload: WsError) => void;
}

// ─── Payload Types ────────────────────────────────────────────────────────────

export interface WsLocationUpdate {
  sessionId: string;
  location: LocationPing;
}

export interface WsSessionJoin {
  sessionId: string;
  role: 'owner' | 'watcher'; // watchers are trusted contacts
}

export interface WsSessionLeave {
  sessionId: string;
}

export interface WsSOSPanic {
  sessionId: string;
}

export interface WsLocationBroadcast {
  sessionId: string;
  location: LocationPing;
  userId: string;
}

export interface WsSessionAlert {
  sessionId: string;
  alert: AlertEvent;
}

export interface WsStatusChange {
  sessionId: string;
  status: string;
  subStatus: string;
}

export interface WsError {
  code: string;
  message: string;
}

export interface WsAck {
  success: boolean;
  error?: string;
}
