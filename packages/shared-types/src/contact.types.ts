/**
 * contact.types.ts — Trusted contact types for SafeCircle
 * Anti-stalking: contacts cannot be added without invite acceptance.
 */

import type { AlertChannel } from './alert.types';
export type { AlertChannel };

export type Relationship =
  | 'FAMILY'
  | 'FRIEND'
  | 'COLLEAGUE'
  | 'PARTNER'
  | 'OTHER';

export type ContactStatus = 'PENDING' | 'ACTIVE' | 'REVOKED';

export interface TrustedContact {
  id: string;
  ownerId: string;                 // user who added this contact
  contactUserId?: string | null;   // if the contact has a SafeCircle account
  phone: string;
  name: string;
  relationship: Relationship;
  alertChannels: AlertChannel[];
  isVerified: boolean;             // true after invite accepted
  status: ContactStatus;
  inviteToken?: string | null;     // one-time token sent via SMS
  inviteExpiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Contact DTOs ─────────────────────────────────────────────────────────────

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
