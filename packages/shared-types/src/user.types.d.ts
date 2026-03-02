/**
 * user.types.ts — User and auth types for SafeCircle
 */
export interface PrivacySettings {
    locationRetentionDays: 7 | 14 | 30;
    shareLocationWithContacts: boolean;
    reduceLocationPrecision: boolean;
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
export interface RequestOtpDto {
    phone: string;
}
export interface VerifyOtpDto {
    phone: string;
    otp: string;
}
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
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
export interface JwtPayload {
    sub: string;
    phone: string;
    iat: number;
    exp: number;
    type: 'access' | 'refresh';
}
//# sourceMappingURL=user.types.d.ts.map