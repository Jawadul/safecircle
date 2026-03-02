/**
 * user.types.ts — User and auth types for SafeCircle
 */

export interface PrivacySettings {
  locationRetentionDays: 7 | 14 | 30;
  shareLocationWithContacts: boolean;
  reduceLocationPrecision: boolean; // stores geohash6 only for long-term logs
}

export interface User {
  id: string;
  phone: string;
  name: string;
  privacySettings: PrivacySettings;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  phone: string;
  name: string;
  privacySettings: PrivacySettings;
}

// ─── Auth DTOs ────────────────────────────────────────────────────────────────

export interface RequestOtpDto {
  phone: string; // E.164 format: +8801XXXXXXXXX
}

export interface VerifyOtpDto {
  phone: string;
  otp: string;
}

export interface AuthTokens {
  accessToken: string;    // JWT, 15min
  refreshToken: string;   // JWT, 7d
}

export interface AuthResponse {
  user: UserProfile;
  tokens: AuthTokens;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface UpdateProfileDto {
  name?: string;
  privacySettings?: Partial<PrivacySettings>;
}

// ─── JWT Payload ──────────────────────────────────────────────────────────────

export interface JwtPayload {
  sub: string;       // userId
  phone: string;
  iat: number;
  exp: number;
  type: 'access' | 'refresh';
}
