/**
 * session.types.ts — discriminated union session types for SafeCircle
 * This is the first critical file; all other session-related code depends on it.
 */
export type SessionType = 'CHECKIN' | 'SAFERIDE' | 'WALKALONE' | 'SOS';
export type SessionStatus = 'IDLE' | 'SETTING_UP' | 'ACTIVE' | 'COMPLETED' | 'ESCALATED' | 'CANCELLED';
export type CheckInSubStatus = 'TRACKING' | 'OVERDUE' | 'ESCALATED';
export type SafeRideSubStatus = 'TRACKING' | 'DEVIATED' | 'STOPPED' | 'ESCALATED';
export type WalkAloneSubStatus = 'TRACKING' | 'PROMPT_SENT' | 'RESPONDED' | 'NON_RESPONSE' | 'ESCALATED';
export type SOSSubStatus = 'BROADCASTING' | 'ESCALATED_PUSH' | 'ESCALATED_SMS' | 'ESCALATED_CALL';
export interface LatLng {
    lat: number;
    lng: number;
}
export interface LocationPing {
    lat: number;
    lng: number;
    accuracy: number;
    altitude?: number | null;
    speed?: number | null;
    heading?: number | null;
    timestamp: string;
}
export interface CheckInPolicy {
    type: 'CHECKIN';
    destination: string;
    etaAt: string;
    gracePeriodMinutes: number;
    shareWith: string[];
}
export interface SafeRidePolicy {
    type: 'SAFERIDE';
    origin: LatLng;
    destination: LatLng;
    routePolyline: string;
    deviationThresholdMeters: number;
    stopThresholdSeconds: number;
    shareWith: string[];
}
export interface WalkAlonePolicy {
    type: 'WALKALONE';
    promptIntervalSeconds: number;
    shareWith: string[];
}
export interface SOSPolicy {
    type: 'SOS';
    shareWith: string[];
    smsDelaySeconds: number;
    callDelaySeconds: number;
}
export type SessionPolicy = CheckInPolicy | SafeRidePolicy | WalkAlonePolicy | SOSPolicy;
export interface CheckInDetails {
    sessionId: string;
    destination: string;
    etaAt: string;
    gracePeriodMinutes: number;
    arrivedAt?: string | null;
    overdueAt?: string | null;
}
export interface SafeRideDetails {
    sessionId: string;
    originLat: number;
    originLng: number;
    destinationLat: number;
    destinationLng: number;
    routePolyline: string;
    deviationThresholdMeters: number;
    stopThresholdSeconds: number;
    firstDeviationAt?: string | null;
    firstStopAt?: string | null;
}
export interface WalkAloneDetails {
    sessionId: string;
    promptIntervalSeconds: number;
    lastPromptAt?: string | null;
    lastResponseAt?: string | null;
}
interface BaseSession {
    id: string;
    userId: string;
    status: SessionStatus;
    policy: SessionPolicy;
    startedAt: string;
    endedAt?: string | null;
    shareWith: string[];
    createdAt: string;
    updatedAt: string;
}
export interface CheckInSession extends BaseSession {
    type: 'CHECKIN';
    subStatus: CheckInSubStatus;
    details: CheckInDetails;
}
export interface SafeRideSession extends BaseSession {
    type: 'SAFERIDE';
    subStatus: SafeRideSubStatus;
    details: SafeRideDetails;
}
export interface WalkAloneSession extends BaseSession {
    type: 'WALKALONE';
    subStatus: WalkAloneSubStatus;
    details: WalkAloneDetails;
}
export interface SOSSession extends BaseSession {
    type: 'SOS';
    subStatus: SOSSubStatus;
    details: null;
}
export type SafetySession = CheckInSession | SafeRideSession | WalkAloneSession | SOSSession;
export declare function isCheckIn(s: SafetySession): s is CheckInSession;
export declare function isSafeRide(s: SafetySession): s is SafeRideSession;
export declare function isWalkAlone(s: SafetySession): s is WalkAloneSession;
export declare function isSOS(s: SafetySession): s is SOSSession;
export interface StartCheckInDto {
    destination: string;
    etaAt: string;
    gracePeriodMinutes?: number;
    shareWith: string[];
}
export interface StartSafeRideDto {
    origin: LatLng;
    destination: LatLng;
    deviationThresholdMeters?: number;
    stopThresholdSeconds?: number;
    shareWith: string[];
}
export interface StartWalkAloneDto {
    promptIntervalSeconds?: number;
    shareWith: string[];
}
export interface StartSOSDto {
    shareWith?: string[];
}
export interface LocationUpdateDto {
    sessionId: string;
    location: LocationPing;
}
export interface ExtendSessionDto {
    additionalMinutes: number;
}
export {};
//# sourceMappingURL=session.types.d.ts.map