/**
 * geo.ts — Geospatial utilities for SafeCircle
 * - Haversine distance (meters)
 * - Point-to-polyline shortest distance (used by SafeRide rules engine)
 * - Encoded polyline decoder (Google format)
 * - Geohash encode (for reduced-precision long-term storage)
 */
import type { LatLng } from '@safecircle/shared-types';
/** Returns great-circle distance between two points in metres. */
export declare function haversineDistance(a: LatLng, b: LatLng): number;
/** Decodes a Google Directions API encoded polyline string into an array of LatLng. */
export declare function decodePolyline(encoded: string): LatLng[];
/**
 * Shortest distance (metres) from point P to any segment of the polyline.
 * Used by SafeRideRule to detect route deviation.
 */
export declare function pointToPolylineDistance(point: LatLng, polyline: LatLng[]): number;
/** Convenience: takes an encoded polyline string (Google format). */
export declare function distanceFromRoute(point: LatLng, encodedPolyline: string): number;
/**
 * Encodes a LatLng to a geohash string of the given precision.
 * Precision 6 ≈ ±0.6km — used for reduced-precision long-term storage.
 */
export declare function encodeGeohash(point: LatLng, precision?: number): string;
/** Bearing in degrees (0–360) from A to B. */
export declare function bearing(a: LatLng, b: LatLng): number;
/**
 * Speed in m/s between two location pings.
 * Returns null if timestamps are identical.
 */
export declare function speedBetween(prev: {
    lat: number;
    lng: number;
    timestamp: string;
}, curr: {
    lat: number;
    lng: number;
    timestamp: string;
}): number | null;
export interface BoundingBox {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
}
/** Returns a bounding box around a point with a given radius in metres. */
export declare function boundingBox(center: LatLng, radiusMeters: number): BoundingBox;
//# sourceMappingURL=geo.d.ts.map