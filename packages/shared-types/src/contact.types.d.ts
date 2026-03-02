/**
 * contact.types.ts — Trusted contact types for SafeCircle
 * Anti-stalking: contacts cannot be added without invite acceptance.
 */
import type { AlertChannel } from './alert.types';
export type { AlertChannel };
export type Relationship = 'FAMILY' | 'FRIEND' | 'COLLEAGUE' | 'PARTNER' | 'OTHER';
export type ContactStatus = 'PENDING' | 'ACTIVE' | 'REVOKED';
export interface TrustedContact {
    id: string;
    ownerId: string;
    contactUserId?: string | null;
    phone: string;
    name: string;
    relationship: Relationship;
    alertChannels: AlertChannel[];
    isVerified: boolean;
    status: ContactStatus;
    inviteToken?: string | null;
    inviteExpiresAt?: string | null;
    createdAt: string;
    updatedAt: string;
}
export interface AddContactDto {
    phone: string;
    name: string;
    relationship: Relationship;
    alertChannels: AlertChannel[];
}
export interface UpdateContactDto {
    name?: string;
    relationship?: Relationship;
    alertChannels?: AlertChannel[];
}
export interface ContactInviteDto {
    token: string;
}
export interface ContactSummary {
    id: string;
    phone: string;
    name: string;
    relationship: Relationship;
    alertChannels: AlertChannel[];
    isVerified: boolean;
    status: ContactStatus;
}
//# sourceMappingURL=contact.types.d.ts.map