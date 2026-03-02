"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileSchema = exports.updateContactSchema = exports.addContactSchema = exports.extendSessionSchema = exports.startSOSSchema = exports.startWalkAloneSchema = exports.startSafeRideSchema = exports.startCheckInSchema = exports.locationPingSchema = exports.latLngSchema = exports.verifyOtpSchema = exports.requestOtpSchema = exports.phoneSchema = void 0;
/**
 * validation.ts — Zod schemas shared between mobile and API
 */
const zod_1 = require("zod");
// ─── Phone ────────────────────────────────────────────────────────────────────
/** E.164 phone number validation. */
exports.phoneSchema = zod_1.z
    .string()
    .regex(/^\+[1-9]\d{6,14}$/, 'Phone must be in E.164 format (e.g. +8801XXXXXXXXX)');
// ─── Auth ─────────────────────────────────────────────────────────────────────
exports.requestOtpSchema = zod_1.z.object({
    phone: exports.phoneSchema,
});
exports.verifyOtpSchema = zod_1.z.object({
    phone: exports.phoneSchema,
    otp: zod_1.z.string().length(6).regex(/^\d+$/, 'OTP must be 6 digits'),
});
// ─── Session ──────────────────────────────────────────────────────────────────
exports.latLngSchema = zod_1.z.object({
    lat: zod_1.z.number().min(-90).max(90),
    lng: zod_1.z.number().min(-180).max(180),
});
exports.locationPingSchema = zod_1.z.object({
    lat: zod_1.z.number().min(-90).max(90),
    lng: zod_1.z.number().min(-180).max(180),
    accuracy: zod_1.z.number().nonnegative(),
    altitude: zod_1.z.number().nullable().optional(),
    speed: zod_1.z.number().nonnegative().nullable().optional(),
    heading: zod_1.z.number().min(0).max(360).nullable().optional(),
    timestamp: zod_1.z.string().datetime(),
});
exports.startCheckInSchema = zod_1.z.object({
    destination: zod_1.z.string().min(1).max(255),
    etaAt: zod_1.z.string().datetime(),
    gracePeriodMinutes: zod_1.z.number().int().min(5).max(120).default(15),
    shareWith: zod_1.z.array(zod_1.z.string().uuid()).min(1),
});
exports.startSafeRideSchema = zod_1.z.object({
    origin: exports.latLngSchema,
    destination: exports.latLngSchema,
    deviationThresholdMeters: zod_1.z.number().int().min(50).max(1000).default(200),
    stopThresholdSeconds: zod_1.z.number().int().min(30).max(600).default(120),
    shareWith: zod_1.z.array(zod_1.z.string().uuid()).min(1),
});
exports.startWalkAloneSchema = zod_1.z.object({
    promptIntervalSeconds: zod_1.z.number().int().min(60).max(1800).default(300),
    shareWith: zod_1.z.array(zod_1.z.string().uuid()).min(1),
});
exports.startSOSSchema = zod_1.z.object({
    shareWith: zod_1.z.array(zod_1.z.string().uuid()).optional().default([]),
});
exports.extendSessionSchema = zod_1.z.object({
    additionalMinutes: zod_1.z.number().int().min(1).max(240),
});
// ─── Contact ──────────────────────────────────────────────────────────────────
exports.addContactSchema = zod_1.z.object({
    phone: exports.phoneSchema,
    name: zod_1.z.string().min(1).max(100),
    relationship: zod_1.z.enum(['FAMILY', 'FRIEND', 'COLLEAGUE', 'PARTNER', 'OTHER']),
    alertChannels: zod_1.z
        .array(zod_1.z.enum(['PUSH', 'SMS', 'CALL', 'IN_APP']))
        .min(1)
        .default(['PUSH', 'SMS']),
});
exports.updateContactSchema = exports.addContactSchema.partial();
// ─── Profile ──────────────────────────────────────────────────────────────────
exports.updateProfileSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).optional(),
    privacySettings: zod_1.z
        .object({
        locationRetentionDays: zod_1.z.union([zod_1.z.literal(7), zod_1.z.literal(14), zod_1.z.literal(30)]).optional(),
        shareLocationWithContacts: zod_1.z.boolean().optional(),
        reduceLocationPrecision: zod_1.z.boolean().optional(),
    })
        .optional(),
});
//# sourceMappingURL=validation.js.map