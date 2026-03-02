"use strict";
/**
 * crypto.ts — Cryptographic utilities for SafeCircle
 * NOTE: bcrypt is intentionally NOT imported here (it's a Node.js dep).
 *       This file provides browser/RN-safe crypto utilities only.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.randomHex = randomHex;
exports.generateOtp = generateOtp;
exports.randomToken = randomToken;
exports.safeCompare = safeCompare;
/** Generates a cryptographically random hex string of the given byte length. */
function randomHex(bytes = 16) {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const arr = new Uint8Array(bytes);
        crypto.getRandomValues(arr);
        return Array.from(arr)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
    }
    // Node.js fallback (for shared-utils used in API)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nodeCrypto = require('crypto');
    return nodeCrypto.randomBytes(bytes).toString('hex');
}
/** Generates a 6-digit numeric OTP string. */
function generateOtp() {
    // Use rejection sampling to avoid modulo bias
    const max = 1_000_000;
    let n;
    do {
        const bytes = new Uint8Array(4);
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
            crypto.getRandomValues(bytes);
        }
        else {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const nodeCrypto = require('crypto');
            const buf = nodeCrypto.randomBytes(4);
            bytes.set(buf);
        }
        n = ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0;
    } while (n >= Math.floor(0xffffffff / max) * max);
    return (n % max).toString().padStart(6, '0');
}
/** Generates a URL-safe random token (for invite links). */
function randomToken(bytes = 32) {
    return randomHex(bytes).replace(/[+/=]/g, '');
}
/** Constant-time string comparison to prevent timing attacks. */
function safeCompare(a, b) {
    if (a.length !== b.length)
        return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) {
        diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return diff === 0;
}
//# sourceMappingURL=crypto.js.map