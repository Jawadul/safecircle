/**
 * alert.types.ts — Alert event types for SafeCircle
 * AlertEvents are immutable append-only records.
 */
export type AlertType = 'DELAYED_ARRIVAL' | 'ROUTE_DEVIATION' | 'UNEXPLAINED_STOP' | 'NON_RESPONSE' | 'SOS_TRIGGERED' | 'SOS_ESCALATED_SMS' | 'SOS_ESCALATED_CALL' | 'SESSION_CANCELLED' | 'SESSION_COMPLETED';
export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';
export type AlertChannel = 'PUSH' | 'SMS' | 'CALL' | 'IN_APP';
export type AlertStatus = 'SENT' | 'DELIVERED' | 'ACKNOWLEDGED' | 'FAILED';
export interface AlertEvent {
    id: string;
    sessionId: string;
    userId: string;
    type: AlertType;
    severity: AlertSeverity;
    message: string;
    metadata: Record<string, unknown>;
    notifiedContacts: string[];
    channels: AlertChannel[];
    status: AlertStatus;
    createdAt: string;
    acknowledgedAt?: string | null;
    acknowledgedBy?: string | null;
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
//# sourceMappingURL=alert.types.d.ts.map