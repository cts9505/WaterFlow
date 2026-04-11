import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { nearbyQuerySchema, captainLocationSchema } from '../validators/authSchemas';

const prisma = new PrismaClient();

// ── Geo helpers ────────────────────────────────────────────────────────────

/** Haversine distance in km between two lat/lng points */
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** 1° latitude ≈ 111.32 km.  Returns a bounding box {minLat,maxLat,minLng,maxLng}
 *  that fully contains a circle of `radiusKm` around (lat, lng).
 *  Used as a fast pre-filter so the DB only returns offices that *could* be in range. */
function boundingBox(lat: number, lng: number, radiusKm: number) {
  const latDelta = radiusKm / 111.32;
  const lngDelta = radiusKm / (111.32 * Math.cos(lat * Math.PI / 180));
  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta,
  };
}

// Maximum service radius any captain can have (used for bounding-box upper bound)
const MAX_POSSIBLE_RADIUS_KM = 50;

// ── GET /api/captains/nearby ───────────────────────────────────────────────
// Returns ONLY offices whose service radius covers the user's location.
//
// Logic:  distance(user, office) <= office.serviceRadiusKm
//   → If an office serves 1 km and the user is 2 km away → NOT shown.
//   → If an office serves 10 km and user is 5 km away   → shown.
//
// Performance: bounding-box pre-filter pushed into the DB WHERE clause
// so only geographically plausible rows are loaded, then verified with
// exact Haversine.  This avoids loading every captain in the country.
export const getNearbyCaptains = async (req: Request, res: Response): Promise<void> => {
  try {
    const { lat, lng } = nearbyQuerySchema.parse(req.query);

    // ── Step 1: fast bounding-box pre-filter at DB level ──────────────
    // We use MAX_POSSIBLE_RADIUS_KM so we never accidentally clip a
    // captain whose radius is larger than the query's radiusKm param.
    const bbox = boundingBox(lat, lng, MAX_POSSIBLE_RADIUS_KM);

    const captains = await prisma.user.findMany({
      where: {
        role: 'CAPTAIN',
        isOnline: true,
        operationLat: { not: null, gte: bbox.minLat, lte: bbox.maxLat },
        operationLng: { not: null, gte: bbox.minLng, lte: bbox.maxLng },
      },
      select: {
        id: true,
        name: true,
        vehicleNumber: true,
        tankerCapacity: true,
        serviceRadiusKm: true,
        basePrice: true,
        operationLat: true,
        operationLng: true,
        bookingsAsCaptain: {
          where: { status: { in: ['ACCEPTED', 'IN_TRANSIT'] } },
          select: { id: true },
          take: 1,
        },
      },
    });

    // ── Step 2: exact Haversine filter ────────────────────────────────
    // An office is visible ONLY if the user falls within the office's
    // own declared service radius (defaults to 10 km if not set).
    const result = captains
      .map(c => {
        const dist = haversine(lat, lng, c.operationLat!, c.operationLng!);
        const officeRadius = c.serviceRadiusKm ?? 10;
        return { c, dist, officeRadius };
      })
      .filter(({ dist, officeRadius }) => dist <= officeRadius)
      .map(({ c, dist }) => ({
        id: c.id,
        name: c.name,
        vehicleNumber: c.vehicleNumber,
        capacityLitres: c.tankerCapacity,
        basePrice: c.basePrice || 500,
        serviceRadiusKm: c.serviceRadiusKm ?? 10,
        lat: c.operationLat!,       // always the office location
        lng: c.operationLng!,       // never the live GPS
        isBusy: c.bookingsAsCaptain.length > 0,
        distanceKm: Math.round(dist * 10) / 10,
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm);

    res.json({ success: true, captains: result, count: result.length });
  } catch (e: any) {
    res.status(400).json({ success: false, errors: e.errors?.map((err: any) => ({ field: err.path.join('.'), message: err.message })) || e.message });
  }
};

// ── POST /api/captains/location ────────────────────────────────────────────
// Captain pushes GPS — upsert to CaptainLocation (always stored in DB!)
// Also forwards to SSE pipeline if a booking is active.
export const updateCaptainLocation = async (req: any, res: Response): Promise<void> => {
  try {
    const data = captainLocationSchema.parse(req.body);
    const captainId = req.user.id;

    // Always upsert real-time position to DB
    await prisma.captainLocation.upsert({
      where: { captainId },
      update: { lat: data.lat, lng: data.lng, heading: data.heading },
      create: { captainId, lat: data.lat, lng: data.lng, heading: data.heading },
    });

    // Sampled history (every ping for now — can reduce to 20% in prod)
    if (Math.random() < 0.20) {
      prisma.location.create({ data: { userId: captainId, lat: data.lat, lng: data.lng } }).catch(() => {});
    }

    // If active booking, push to SSE pipeline for customer live tracking
    if (data.bookingId) {
      const payload = { captainId, lat: data.lat, lng: data.lng, heading: data.heading };
      // Try Kafka first, fall back to direct SSE
      try {
        const { producer } = await import('../utils/kafka');
        await producer.send({ topic: 'tanker-locations', messages: [{ value: JSON.stringify({ ...payload, bookingId: data.bookingId }) }] });
      } catch {
        const { sendLocationUpdate } = await import('../utils/sseManager');
        sendLocationUpdate(data.bookingId, payload);
      }
    }

    res.status(200).json({ success: true });
  } catch (e: any) {
    res.status(400).json({ success: false, errors: e.errors?.map((err: any) => ({ field: err.path.join('.'), message: err.message })) || e.message });
  }
};
