/**
 * validation.ts — Zod schemas shared between mobile and API
 */
import { z } from 'zod';
/** E.164 phone number validation. */
export declare const phoneSchema: z.ZodString;
export declare const requestOtpSchema: z.ZodObject<{
    phone: z.ZodString;
}, "strip", z.ZodTypeAny, {
    phone: string;
}, {
    phone: string;
}>;
export declare const verifyOtpSchema: z.ZodObject<{
    phone: z.ZodString;
    otp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    phone: string;
    otp: string;
}, {
    phone: string;
    otp: string;
}>;
export declare const latLngSchema: z.ZodObject<{
    lat: z.ZodNumber;
    lng: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    lat: number;
    lng: number;
}, {
    lat: number;
    lng: number;
}>;
export declare const locationPingSchema: z.ZodObject<{
    lat: z.ZodNumber;
    lng: z.ZodNumber;
    accuracy: z.ZodNumber;
    altitude: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    speed: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    heading: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    timestamp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    lat: number;
    lng: number;
    accuracy: number;
    timestamp: string;
    altitude?: number | null | undefined;
    speed?: number | null | undefined;
    heading?: number | null | undefined;
}, {
    lat: number;
    lng: number;
    accuracy: number;
    timestamp: string;
    altitude?: number | null | undefined;
    speed?: number | null | undefined;
    heading?: number | null | undefined;
}>;
export declare const startCheckInSchema: z.ZodObject<{
    destination: z.ZodString;
    etaAt: z.ZodString;
    gracePeriodMinutes: z.ZodDefault<z.ZodNumber>;
    shareWith: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    destination: string;
    etaAt: string;
    gracePeriodMinutes: number;
    shareWith: string[];
}, {
    destination: string;
    etaAt: string;
    shareWith: string[];
    gracePeriodMinutes?: number | undefined;
}>;
export declare const startSafeRideSchema: z.ZodObject<{
    origin: z.ZodObject<{
        lat: z.ZodNumber;
        lng: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        lat: number;
        lng: number;
    }, {
        lat: number;
        lng: number;
    }>;
    destination: z.ZodObject<{
        lat: z.ZodNumber;
        lng: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        lat: number;
        lng: number;
    }, {
        lat: number;
        lng: number;
    }>;
    deviationThresholdMeters: z.ZodDefault<z.ZodNumber>;
    stopThresholdSeconds: z.ZodDefault<z.ZodNumber>;
    shareWith: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    destination: {
        lat: number;
        lng: number;
    };
    shareWith: string[];
    origin: {
        lat: number;
        lng: number;
    };
    deviationThresholdMeters: number;
    stopThresholdSeconds: number;
}, {
    destination: {
        lat: number;
        lng: number;
    };
    shareWith: string[];
    origin: {
        lat: number;
        lng: number;
    };
    deviationThresholdMeters?: number | undefined;
    stopThresholdSeconds?: number | undefined;
}>;
export declare const startWalkAloneSchema: z.ZodObject<{
    promptIntervalSeconds: z.ZodDefault<z.ZodNumber>;
    shareWith: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    shareWith: string[];
    promptIntervalSeconds: number;
}, {
    shareWith: string[];
    promptIntervalSeconds?: number | undefined;
}>;
export declare const startSOSSchema: z.ZodObject<{
    shareWith: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
}, "strip", z.ZodTypeAny, {
    shareWith: string[];
}, {
    shareWith?: string[] | undefined;
}>;
export declare const extendSessionSchema: z.ZodObject<{
    additionalMinutes: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    additionalMinutes: number;
}, {
    additionalMinutes: number;
}>;
export declare const addContactSchema: z.ZodObject<{
    phone: z.ZodString;
    name: z.ZodString;
    relationship: z.ZodEnum<["FAMILY", "FRIEND", "COLLEAGUE", "PARTNER", "OTHER"]>;
    alertChannels: z.ZodDefault<z.ZodArray<z.ZodEnum<["PUSH", "SMS", "CALL", "IN_APP"]>, "many">>;
}, "strip", z.ZodTypeAny, {
    phone: string;
    name: string;
    relationship: "FAMILY" | "FRIEND" | "COLLEAGUE" | "PARTNER" | "OTHER";
    alertChannels: ("PUSH" | "SMS" | "CALL" | "IN_APP")[];
}, {
    phone: string;
    name: string;
    relationship: "FAMILY" | "FRIEND" | "COLLEAGUE" | "PARTNER" | "OTHER";
    alertChannels?: ("PUSH" | "SMS" | "CALL" | "IN_APP")[] | undefined;
}>;
export declare const updateContactSchema: z.ZodObject<{
    phone: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    relationship: z.ZodOptional<z.ZodEnum<["FAMILY", "FRIEND", "COLLEAGUE", "PARTNER", "OTHER"]>>;
    alertChannels: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodEnum<["PUSH", "SMS", "CALL", "IN_APP"]>, "many">>>;
}, "strip", z.ZodTypeAny, {
    phone?: string | undefined;
    name?: string | undefined;
    relationship?: "FAMILY" | "FRIEND" | "COLLEAGUE" | "PARTNER" | "OTHER" | undefined;
    alertChannels?: ("PUSH" | "SMS" | "CALL" | "IN_APP")[] | undefined;
}, {
    phone?: string | undefined;
    name?: string | undefined;
    relationship?: "FAMILY" | "FRIEND" | "COLLEAGUE" | "PARTNER" | "OTHER" | undefined;
    alertChannels?: ("PUSH" | "SMS" | "CALL" | "IN_APP")[] | undefined;
}>;
export declare const updateProfileSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    privacySettings: z.ZodOptional<z.ZodObject<{
        locationRetentionDays: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<7>, z.ZodLiteral<14>, z.ZodLiteral<30>]>>;
        shareLocationWithContacts: z.ZodOptional<z.ZodBoolean>;
        reduceLocationPrecision: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        locationRetentionDays?: 7 | 14 | 30 | undefined;
        shareLocationWithContacts?: boolean | undefined;
        reduceLocationPrecision?: boolean | undefined;
    }, {
        locationRetentionDays?: 7 | 14 | 30 | undefined;
        shareLocationWithContacts?: boolean | undefined;
        reduceLocationPrecision?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    privacySettings?: {
        locationRetentionDays?: 7 | 14 | 30 | undefined;
        shareLocationWithContacts?: boolean | undefined;
        reduceLocationPrecision?: boolean | undefined;
    } | undefined;
}, {
    name?: string | undefined;
    privacySettings?: {
        locationRetentionDays?: 7 | 14 | 30 | undefined;
        shareLocationWithContacts?: boolean | undefined;
        reduceLocationPrecision?: boolean | undefined;
    } | undefined;
}>;
export type RequestOtpInput = z.infer<typeof requestOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type LatLngInput = z.infer<typeof latLngSchema>;
export type LocationPingInput = z.infer<typeof locationPingSchema>;
export type StartCheckInInput = z.infer<typeof startCheckInSchema>;
export type StartSafeRideInput = z.infer<typeof startSafeRideSchema>;
export type StartWalkAloneInput = z.infer<typeof startWalkAloneSchema>;
export type StartSOSInput = z.infer<typeof startSOSSchema>;
export type AddContactInput = z.infer<typeof addContactSchema>;
//# sourceMappingURL=validation.d.ts.map