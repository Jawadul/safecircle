import type { SessionType } from '@safecircle/shared-types';

export interface LocationSnapshot {
  lat: number;
  lng: number;
  speed: number | null;
  timestamp: string;
}

export interface EvaluateSessionJob {
  sessionId: string;
  sessionType: SessionType;
  userId: string;
  payload: SessionRulePayload;
}

export interface CheckInRulePayload {
  etaAt: string;
  gracePeriodMinutes: number;
  location: LocationSnapshot;
  shareWith: string[];
  alreadyEscalated: boolean;
}

export interface SafeRideRulePayload {
  routePolyline: string;
  deviationThresholdMeters: number;
  stopThresholdSeconds: number;
  location: LocationSnapshot;
  shareWith: string[];
  firstDeviationAt: string | null;
  firstStopAt: string | null;
  alreadyEscalated: boolean;
}

export interface WalkAloneRulePayload {
  promptIntervalSeconds: number;
  lastPromptAt: string | null;
  lastResponseAt: string | null;
  location: LocationSnapshot;
  shareWith: string[];
  alreadyEscalated: boolean;
}

export interface SOSRulePayload {
  startedAt: string;
  smsDelaySeconds: number;
  callDelaySeconds: number;
  shareWith: string[];
  pushSentAt: string | null;
  smsSentAt: string | null;
  callInitiatedAt: string | null;
}

export type SessionRulePayload =
  | CheckInRulePayload
  | SafeRideRulePayload
  | WalkAloneRulePayload
  | SOSRulePayload;
