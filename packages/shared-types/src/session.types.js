"use strict";
/**
 * session.types.ts — discriminated union session types for SafeCircle
 * This is the first critical file; all other session-related code depends on it.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isCheckIn = isCheckIn;
exports.isSafeRide = isSafeRide;
exports.isWalkAlone = isWalkAlone;
exports.isSOS = isSOS;
// ─── Type Guards ──────────────────────────────────────────────────────────────
function isCheckIn(s) {
    return s.type === 'CHECKIN';
}
function isSafeRide(s) {
    return s.type === 'SAFERIDE';
}
function isWalkAlone(s) {
    return s.type === 'WALKALONE';
}
function isSOS(s) {
    return s.type === 'SOS';
}
//# sourceMappingURL=session.types.js.map