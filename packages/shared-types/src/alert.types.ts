/**
 * alert.types.ts — Alert event types for SafeCircle
 * AlertEvents are immutable append-only records.
 */

export type AlertType =
  | 'DELAYED_ARRIVAL'       // CheckIn: now > eta + grace
  | 'ROUTE_DEVIATION'       // SafeRide: off route > threshold
  | 'UNEXPLAINED_STOP'      // SafeRide: speed < 0.5m/s > stop_threshold
  | 'NON_RESPONSE'          // WalkAlone: missed prompt
  | 'SOS_TRIGGERED'         // SOS: session started
  | 'SOS_ESCALATED_SMS'     // SOS: T+30s SMS sent
  | 'SOS_ESCALATED_CALL'    // SOS: T+60s call initiated
  | 'SESSION_CANCELLED'     // User cancelled a session
  | 'SESSION_COMPLETED';    // Session ended normally

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export type AlertChannel = 'PUSH' | 'SMS' | 'CALL' | 'IN_APP';

export type AlertStatus = 'SENT' | 'DELIVERED' | 'ACKNOWLEDGED' | 'FAILED';

export interface AlertEvent {
  id: string;
  sessionId: string;
  userId: string;                   // session owner
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  metadata: Record<string, unknown>;  // e.g. { lat, lng, deviationMeters }
  notifiedContacts: string[];         // trusted_contact UUIDs
  channels: AlertChannel[];
  status: AlertStatus;
  createdAt: string;
  acknowledgedAt?: string | null;
  acknowledgedBy?: string | null;     // contact UUID who acked
}

export interface AcknowledgeAlertDto {
  contactId: string;
}

export interface AlertSummary {
  id: string;
  sessionId: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  status: AlertStatus;
  createdAt: string;
}
