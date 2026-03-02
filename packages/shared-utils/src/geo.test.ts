import {
  haversineDistance,
  decodePolyline,
  pointToPolylineDistance,
  distanceFromRoute,
  encodeGeohash,
  speedBetween,
} from './geo';

describe('haversineDistance', () => {
  it('returns 0 for identical points', () => {
    expect(haversineDistance({ lat: 23.8, lng: 90.4 }, { lat: 23.8, lng: 90.4 })).toBe(0);
  });

  it('returns ~111km per degree latitude', () => {
    const d = haversineDistance({ lat: 0, lng: 0 }, { lat: 1, lng: 0 });
    expect(d).toBeCloseTo(111_195, -2); // ±100m tolerance
  });

  it('returns correct distance for Dhaka landmarks', () => {
    // Shahjalal Airport to Gulshan-1 ≈ 13.5km
    const airport = { lat: 23.8433, lng: 90.3978 };
    const gulshan = { lat: 23.7806, lng: 90.4152 };
    const d = haversineDistance(airport, gulshan);
    expect(d).toBeGreaterThan(7_000);
    expect(d).toBeLessThan(15_000);
  });
});

describe('decodePolyline', () => {
  it('decodes a known Google polyline', () => {
    // Encoded: (38.5, -120.2), (40.7, -120.95), (43.252, -126.453)
    const encoded = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';
    const pts = decodePolyline(encoded);
    expect(pts).toHaveLength(3);
    expect(pts[0]!.lat).toBeCloseTo(38.5, 4);
    expect(pts[0]!.lng).toBeCloseTo(-120.2, 4);
    expect(pts[2]!.lat).toBeCloseTo(43.252, 4);
    expect(pts[2]!.lng).toBeCloseTo(-126.453, 4);
  });
});

describe('pointToPolylineDistance', () => {
  it('returns 0 for a point on the polyline', () => {
    const line = [
      { lat: 0, lng: 0 },
      { lat: 0, lng: 1 },
    ];
    const d = pointToPolylineDistance({ lat: 0, lng: 0.5 }, line);
    expect(d).toBeCloseTo(0, 0);
  });

  it('returns Infinity for empty polyline', () => {
    expect(pointToPolylineDistance({ lat: 0, lng: 0 }, [])).toBe(Infinity);
  });

  it('detects a point significantly off route', () => {
    const line = [
      { lat: 23.78, lng: 90.4 },
      { lat: 23.79, lng: 90.41 },
    ];
    const offRoute = { lat: 23.80, lng: 90.45 }; // ~4km off
    const d = pointToPolylineDistance(offRoute, line);
    expect(d).toBeGreaterThan(200);
  });
});

describe('distanceFromRoute', () => {
  it('accepts encoded polyline string', () => {
    const encoded = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';
    const point = { lat: 38.5, lng: -120.2 }; // exactly on route start
    const d = distanceFromRoute(point, encoded);
    expect(d).toBeCloseTo(0, 0);
  });
});

describe('encodeGeohash', () => {
  it('encodes known location to correct geohash prefix', () => {
    // Dhaka, Bangladesh ≈ "u651"
    const hash = encodeGeohash({ lat: 23.8103, lng: 90.4125 }, 6);
    expect(hash).toHaveLength(6);
    expect(typeof hash).toBe('string');
  });

  it('returns same hash for same point', () => {
    const p = { lat: 23.8103, lng: 90.4125 };
    expect(encodeGeohash(p, 6)).toBe(encodeGeohash(p, 6));
  });
});

describe('speedBetween', () => {
  it('returns null for zero time delta', () => {
    const t = '2024-01-01T00:00:00.000Z';
    expect(speedBetween({ lat: 0, lng: 0, timestamp: t }, { lat: 1, lng: 0, timestamp: t })).toBeNull();
  });

  it('calculates correct speed for stationary point', () => {
    const speed = speedBetween(
      { lat: 23.8, lng: 90.4, timestamp: '2024-01-01T00:00:00.000Z' },
      { lat: 23.8, lng: 90.4, timestamp: '2024-01-01T00:01:00.000Z' },
    );
    expect(speed).toBeCloseTo(0, 1);
  });
});
