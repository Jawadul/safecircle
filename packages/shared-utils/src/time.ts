/**
 * time.ts — Time utilities for SafeCircle
 */

/** Returns true if the given ISO date string is in the past. */
export function isPast(isoDate: string): boolean {
  return new Date(isoDate).getTime() < Date.now();
}

/** Returns true if the given ISO date string is in the future. */
export function isFuture(isoDate: string): boolean {
  return new Date(isoDate).getTime() > Date.now();
}

/** Milliseconds until the given ISO date string (negative if past). */
export function msUntil(isoDate: string): number {
  return new Date(isoDate).getTime() - Date.now();
}

/** Minutes since the given ISO date string (negative if future). */
export function minutesSince(isoDate: string): number {
  return (Date.now() - new Date(isoDate).getTime()) / 60_000;
}

/** Seconds since the given ISO date string. */
export function secondsSince(isoDate: string): number {
  return (Date.now() - new Date(isoDate).getTime()) / 1_000;
}

/** Adds minutes to an ISO date string, returns new ISO string. */
export function addMinutes(isoDate: string, minutes: number): string {
  return new Date(new Date(isoDate).getTime() + minutes * 60_000).toISOString();
}

/** Adds seconds to an ISO date string, returns new ISO string. */
export function addSeconds(isoDate: string, seconds: number): string {
  return new Date(new Date(isoDate).getTime() + seconds * 1_000).toISOString();
}

/** Formats a duration in seconds as "Xm Ys". */
export function formatDuration(seconds: number): string {
  const m = Math.floor(Math.abs(seconds) / 60);
  const s = Math.floor(Math.abs(seconds) % 60);
  const sign = seconds < 0 ? '-' : '';
  if (m === 0) return `${sign}${s}s`;
  return `${sign}${m}m ${s}s`;
}

/** Returns the current UTC ISO string. */
export function nowISO(): string {
  return new Date().toISOString();
}
