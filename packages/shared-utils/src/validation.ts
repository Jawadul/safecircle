/**
 * validation.ts — Zod schemas shared between mobile and API
 */
import { z } from 'zod';

// ─── Phone ────────────────────────────────────────────────────────────────────

/** E.164 phone number validation. */
export const phoneSchema = z
  .string()
  .regex(/^\+[1-9]\d{6,14}$/, 'Phone must be in E.164 format (e.g. +8801XXXXXXXXX)');

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const requestOtpSchema = z.object({
  phone: phoneSchema,
});

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  otp: z.string().length(6).regex(/^\d+$/, 'OTP must be 6 digits'),
});

// ─── Session ──────────────────────────────────────────────────────────────────

export const latLngSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const locationPingSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().nonnegative(),
  altitude: z.number().nullable().optional(),
  speed: z.number().nonnegative().nullable().optional(),
  heading: z.number().min(0).max(360).nullable().optional(),
  timestamp: z.string().datetime(),
});

export const startCheckInSchema = z.object({
  destination: z.string().min(1).max(255),
  etaAt: z.string().datetime(),
  gracePeriodMinutes: z.number().int().min(5).max(120).default(15),
  shareWith: z.array(z.string().uuid()).min(1),
});

export const startSafeRideSchema = z.object({
  origin: latLngSchema,
  destination: latLngSchema,
  deviationThresholdMeters: z.number().int().min(50).max(1000).default(200),
  stopThresholdSeconds: z.number().int().min(30).max(600).default(120),
  shareWith: z.array(z.string().uuid()).min(1),
});

export const startWalkAloneSchema = z.object({
  promptIntervalSeconds: z.number().int().min(60).max(1800).default(300),
  shareWith: z.array(z.string().uuid()).min(1),
});

export const startSOSSchema = z.object({
  shareWith: z.array(z.string().uuid()).optional().default([]),
});

export const extendSessionSchema = z.object({
  additionalMinutes: z.number().int().min(1).max(240),
});

// ─── Contact ──────────────────────────────────────────────────────────────────

export const addContactSchema = z.object({
  phone: phoneSchema,
  name: z.string().min(1).max(100),
  relationship: z.enum(['FAMILY', 'FRIEND', 'COLLEAGUE', 'PARTNER', 'OTHER']),
  alertChannels: z
    .array(z.enum(['PUSH', 'SMS', 'CALL', 'IN_APP']))
    .min(1)
    .default(['PUSH', 'SMS']),
});

export const updateContactSchema = addContactSchema.partial();

// ─── Profile ──────────────────────────────────────────────────────────────────

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  privacySettings: z
    .object({
      locationRetentionDays: z.union([z.literal(7), z.literal(14), z.literal(30)]).optional(),
      shareLocationWithContacts: z.boolean().optional(),
      reduceLocationPrecision: z.boolean().optional(),
    })
    .optional(),
});

// ─── Type Exports ─────────────────────────────────────────────────────────────

export type RequestOtpInput = z.infer<typeof requestOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type LatLngInput = z.infer<typeof latLngSchema>;
export type LocationPingInput = z.infer<typeof locationPingSchema>;
export type StartCheckInInput = z.infer<typeof startCheckInSchema>;
export type StartSafeRideInput = z.infer<typeof startSafeRideSchema>;
export type StartWalkAloneInput = z.infer<typeof startWalkAloneSchema>;
export type StartSOSInput = z.infer<typeof startSOSSchema>;
export type AddContactInput = z.infer<typeof addContactSchema>;
