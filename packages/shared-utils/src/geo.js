"use strict";
/**
 * geo.ts — Geospatial utilities for SafeCircle
 * - Haversine distance (meters)
 * - Point-to-polyline shortest distance (used by SafeRide rules engine)
 * - Encoded polyline decoder (Google format)
 * - Geohash encode (for reduced-precision long-term storage)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.haversineDistance = haversineDistance;
exports.decodePolyline = decodePolyline;
exports.pointToPolylineDistance = pointToPolylineDistance;
exports.distanceFromRoute = distanceFromRoute;
exports.encodeGeohash = encodeGeohash;
exports.bearing = bearing;
exports.speedBetween = speedBetween;
exports.boundingBox = boundingBox;
const EARTH_RADIUS_M = 6_371_000;
// ─── Haversine ────────────────────────────────────────────────────────────────
/** Returns great-circle distance between two points in metres. */
function haversineDistance(a, b) {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const sinDLat = Math.sin(dLat / 2);
    const sinDLng = Math.sin(dLng / 2);
    const aVal = sinDLat * sinDLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng;
    const c = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
    return EARTH_RADIUS_M * c;
}
// ─── Polyline Decoder ─────────────────────────────────────────────────────────
/** Decodes a Google Directions API encoded polyline string into an array of LatLng. */
function decodePolyline(encoded) {
    const points = [];
    let index = 0;
    let lat = 0;
    let lng = 0;
    while (index < encoded.length) {
        let result = 0;
        let shift = 0;
        let b;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        const dLat = result & 1 ? ~(result >> 1) : result >> 1;
        lat += dLat;
        result = 0;
        shift = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        const dLng = result & 1 ? ~(result >> 1) : result >> 1;
        lng += dLng;
        points.push({ lat: lat / 1e5, lng: lng / 1e5 });
    }
    return points;
}
// ─── Point-to-Segment Distance ────────────────────────────────────────────────
/**
 * Shortest distance (metres) from point P to the infinite line defined by A→B,
 * clamped to the segment endpoints.
 */
function pointToSegmentDistance(p, a, b) {
    const dx = b.lng - a.lng;
    const dy = b.lat - a.lat;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) {
        return haversineDistance(p, a);
    }
    const t = Math.max(0, Math.min(1, ((p.lng - a.lng) * dx + (p.lat - a.lat) * dy) / lenSq));
    const closest = { lat: a.lat + t * dy, lng: a.lng + t * dx };
    return haversineDistance(p, closest);
}
/**
 * Shortest distance (metres) from point P to any segment of the polyline.
 * Used by SafeRideRule to detect route deviation.
 */
function pointToPolylineDistance(point, polyline) {
    if (polyline.length === 0)
        return Infinity;
    if (polyline.length === 1)
        return haversineDistance(point, polyline[0]);
    let minDist = Infinity;
    for (let i = 0; i < polyline.length - 1; i++) {
        const d = pointToSegmentDistance(point, polyline[i], polyline[i + 1]);
        if (d < minDist)
            minDist = d;
    }
    return minDist;
}
/** Convenience: takes an encoded polyline string (Google format). */
function distanceFromRoute(point, encodedPolyline) {
    const route = decodePolyline(encodedPolyline);
    return pointToPolylineDistance(point, route);
}
// ─── Geohash ──────────────────────────────────────────────────────────────────
const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';
/**
 * Encodes a LatLng to a geohash string of the given precision.
 * Precision 6 ≈ ±0.6km — used for reduced-precision long-term storage.
 */
function encodeGeohash(point, precision = 6) {
    let minLat = -90;
    let maxLat = 90;
    let minLng = -180;
    let maxLng = 180;
    let isEven = true;
    let bit = 0;
    let ch = 0;
    let hash = '';
    while (hash.length < precision) {
        if (isEven) {
            const mid = (minLng + maxLng) / 2;
            if (point.lng >= mid) {
                ch |= 1 << (4 - bit);
                minLng = mid;
            }
            else {
                maxLng = mid;
            }
        }
        else {
            const mid = (minLat + maxLat) / 2;
            if (point.lat >= mid) {
                ch |= 1 << (4 - bit);
                minLat = mid;
            }
            else {
                maxLat = mid;
            }
        }
        isEven = !isEven;
        if (bit < 4) {
            bit++;
        }
        else {
            hash += BASE32[ch];
            bit = 0;
            ch = 0;
        }
    }
    return hash;
}
// ─── Speed / Bearing ──────────────────────────────────────────────────────────
/** Bearing in degrees (0–360) from A to B. */
function bearing(a, b) {
    const toRad = (d) => (d * Math.PI) / 180;
    const dLng = toRad(b.lng - a.lng);
    const y = Math.sin(dLng) * Math.cos(toRad(b.lat));
    const x = Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) -
        Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(dLng);
    return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}
/**
 * Speed in m/s between two location pings.
 * Returns null if timestamps are identical.
 */
function speedBetween(prev, curr) {
    const dtMs = new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime();
    if (dtMs <= 0)
        return null;
    const dist = haversineDistance(prev, curr);
    return dist / (dtMs / 1000);
}
/** Returns a bounding box around a point with a given radius in metres. */
function boundingBox(center, radiusMeters) {
    const deltaLat = radiusMeters / EARTH_RADIUS_M;
    const deltaLng = radiusMeters / (EARTH_RADIUS_M * Math.cos((center.lat * Math.PI) / 180));
    return {
        minLat: center.lat - (deltaLat * 180) / Math.PI,
        maxLat: center.lat + (deltaLat * 180) / Math.PI,
        minLng: center.lng - (deltaLng * 180) / Math.PI,
        maxLng: center.lng + (deltaLng * 180) / Math.PI,
    };
}
//# sourceMappingURL=geo.js.map