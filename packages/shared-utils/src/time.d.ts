/**
 * time.ts — Time utilities for SafeCircle
 */
/** Returns true if the given ISO date string is in the past. */
export declare function isPast(isoDate: string): boolean;
/** Returns true if the given ISO date string is in the future. */
export declare function isFuture(isoDate: string): boolean;
/** Milliseconds until the given ISO date string (negative if past). */
export declare function msUntil(isoDate: string): number;
/** Minutes since the given ISO date string (negative if future). */
export declare function minutesSince(isoDate: string): number;
/** Seconds since the given ISO date string. */
export declare function secondsSince(isoDate: string): number;
/** Adds minutes to an ISO date string, returns new ISO string. */
export declare function addMinutes(isoDate: string, minutes: number): string;
/** Adds seconds to an ISO date string, returns new ISO string. */
export declare function addSeconds(isoDate: string, seconds: number): string;
/** Formats a duration in seconds as "Xm Ys". */
export declare function formatDuration(seconds: number): string;
/** Returns the current UTC ISO string. */
export declare function nowISO(): string;
//# sourceMappingURL=time.d.ts.map