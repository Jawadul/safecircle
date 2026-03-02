"use strict";
/**
 * time.ts — Time utilities for SafeCircle
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPast = isPast;
exports.isFuture = isFuture;
exports.msUntil = msUntil;
exports.minutesSince = minutesSince;
exports.secondsSince = secondsSince;
exports.addMinutes = addMinutes;
exports.addSeconds = addSeconds;
exports.formatDuration = formatDuration;
exports.nowISO = nowISO;
/** Returns true if the given ISO date string is in the past. */
function isPast(isoDate) {
    return new Date(isoDate).getTime() < Date.now();
}
/** Returns true if the given ISO date string is in the future. */
function isFuture(isoDate) {
    return new Date(isoDate).getTime() > Date.now();
}
/** Milliseconds until the given ISO date string (negative if past). */
function msUntil(isoDate) {
    return new Date(isoDate).getTime() - Date.now();
}
/** Minutes since the given ISO date string (negative if future). */
function minutesSince(isoDate) {
    return (Date.now() - new Date(isoDate).getTime()) / 60_000;
}
/** Seconds since the given ISO date string. */
function secondsSince(isoDate) {
    return (Date.now() - new Date(isoDate).getTime()) / 1_000;
}
/** Adds minutes to an ISO date string, returns new ISO string. */
function addMinutes(isoDate, minutes) {
    return new Date(new Date(isoDate).getTime() + minutes * 60_000).toISOString();
}
/** Adds seconds to an ISO date string, returns new ISO string. */
function addSeconds(isoDate, seconds) {
    return new Date(new Date(isoDate).getTime() + seconds * 1_000).toISOString();
}
/** Formats a duration in seconds as "Xm Ys". */
function formatDuration(seconds) {
    const m = Math.floor(Math.abs(seconds) / 60);
    const s = Math.floor(Math.abs(seconds) % 60);
    const sign = seconds < 0 ? '-' : '';
    if (m === 0)
        return `${sign}${s}s`;
    return `${sign}${m}m ${s}s`;
}
/** Returns the current UTC ISO string. */
function nowISO() {
    return new Date().toISOString();
}
//# sourceMappingURL=time.js.map