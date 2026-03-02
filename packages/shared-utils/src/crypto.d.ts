/**
 * crypto.ts — Cryptographic utilities for SafeCircle
 * NOTE: bcrypt is intentionally NOT imported here (it's a Node.js dep).
 *       This file provides browser/RN-safe crypto utilities only.
 */
/** Generates a cryptographically random hex string of the given byte length. */
export declare function randomHex(bytes?: number): string;
/** Generates a 6-digit numeric OTP string. */
export declare function generateOtp(): string;
/** Generates a URL-safe random token (for invite links). */
export declare function randomToken(bytes?: number): string;
/** Constant-time string comparison to prevent timing attacks. */
export declare function safeCompare(a: string, b: string): boolean;
//# sourceMappingURL=crypto.d.ts.map