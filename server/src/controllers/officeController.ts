import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createOfficeSchema, joinOfficeSchema, officeNearbySchema } from '../validators/authSchemas';

const prisma = new PrismaClient();

// ── Geo helpers ────────────────────────────────────────────────────────────

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

function boundingBox(lat: number, lng: number, radiusKm: number) {
  const latDelta = radiusKm / 111.32;
  const lngDelta = radiusKm / (111.32 * Math.cos(lat * Math.PI / 180));
  return {
    minLat: lat - latDelta, maxLat: lat + latDelta,
    minLng: lng - lngDelta, maxLng: lng + lngDelta,
  };
}

/** Generate a unique 4-digit code */
async function generateUniqueCode(): Promise<string> {
  for (let i = 0; i < 50; i++) {
    const code = String(Math.floor(1000 + Math.random() * 9000)); // 1000–9999
    const exists = await prisma.office.findUnique({ where: { code } });
    if (!exists) return code;
  }
  throw new Error('Failed to generate unique code');
}

const MAX_BBOX_KM = 50;

// ── POST /api/offices — Create a new office ───────────────────────────────
export const createOffice = async (req: any, res: Response): Promise<void> => {
  try {
    const data = createOfficeSchema.parse(req.body);
    const code = await generateUniqueCode();

    const office = await prisma.office.create({
      data: {
        code,
        name: data.name,
        phone: data.phone,
        ownerName: data.ownerName || req.user.name,
        address: data.address,
        city: data.city,
        lat: data.lat,
        lng: data.lng,
        serviceRadiusKm: data.serviceRadiusKm,
        ownerId: req.user.id,
        status: 'APPROVED', // auto-approve for now; admin can suspend later
        members: {
          create: {
            captainId: req.user.id,
            status: 'APPROVED',
          },
        },
      },
    });

    res.status(201).json({ success: true, office });
  } catch (e: any) {
    if (e.errors) {
      res.status(400).json({ success: false, errors: e.errors.map((err: any) => ({ field: err.path.join('.'), message: err.message })) });
    } else {
      res.status(400).json({ success: false, error: e.message });
    }
  }
};

// ── GET /api/offices/nearby — All approved offices in user's area ──────────
// Shows ALL offices regardless of captain online status.
export const getNearbyOffices = async (req: Request, res: Response): Promise<void> => {
  try {
    const { lat, lng } = officeNearbySchema.parse(req.query);
    const bbox = boundingBox(lat, lng, MAX_BBOX_KM);

    const offices = await prisma.office.findMany({
      where: {
        status: 'APPROVED',
        lat: { gte: bbox.minLat, lte: bbox.maxLat },
        lng: { gte: bbox.minLng, lte: bbox.maxLng },
      },
      include: {
        members: {
          where: { status: 'APPROVED' },
          include: {
            captain: {
              select: {
                id: true,
                name: true,
                vehicleNumber: true,
                tankerCapacity: true,
                basePrice: true,
                isOnline: true,
              },
            },
          },
        },
      },
    });

    const result = offices
      .map(o => {
        const dist = haversine(lat, lng, o.lat, o.lng);
        return { o, dist };
      })
      .filter(({ o, dist }) => dist <= o.serviceRadiusKm)
      .map(({ o, dist }) => {
        const captains = o.members.map(m => m.captain);
        const onlineCaptains = captains.filter(c => c.isOnline);
        return {
          id: o.id,
          code: o.code,
          name: o.name,
          phone: o.phone,
          ownerName: o.ownerName,
          address: o.address,
          city: o.city,
          lat: o.lat,
          lng: o.lng,
          serviceRadiusKm: o.serviceRadiusKm,
          distanceKm: Math.round(dist * 10) / 10,
          totalCaptains: captains.length,
          onlineCaptains: onlineCaptains.length,
          hasOnline: onlineCaptains.length > 0,
          captains: captains.map(c => ({
            id: c.id,
            name: c.name,
            vehicleNumber: c.vehicleNumber,
            capacityLitres: c.tankerCapacity,
            basePrice: c.basePrice || 500,
            isOnline: c.isOnline,
          })),
          viewCount: o.viewCount,
          callCount: o.callCount,
        };
      })
      .sort((a, b) => {
        // Online offices first, then by distance
        if (a.hasOnline !== b.hasOnline) return a.hasOnline ? -1 : 1;
        return a.distanceKm - b.distanceKm;
      });

    res.json({ success: true, offices: result, count: result.length });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
};

// ── GET /api/offices/:id — Office detail (increments viewCount) ──────────
export const getOfficeDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const officeId = req.params.id as string;
    const office = await prisma.office.update({
      where: { id: officeId },
      data: { viewCount: { increment: 1 } },
      include: {
        members: {
          where: { status: 'APPROVED' },
          include: {
            captain: {
              select: { id: true, name: true, vehicleNumber: true, tankerCapacity: true, basePrice: true, isOnline: true },
            },
          },
        },
      },
    });

    res.json({
      success: true,
      office: {
        ...office,
        captains: office.members.map(m => ({
          id: m.captain.id,
          name: m.captain.name,
          vehicleNumber: m.captain.vehicleNumber,
          capacityLitres: m.captain.tankerCapacity,
          basePrice: m.captain.basePrice || 500,
          isOnline: m.captain.isOnline,
        })),
      },
    });
  } catch (e: any) {
    res.status(404).json({ success: false, error: 'Office not found' });
  }
};

// ── POST /api/offices/:id/call — Increment call count ─────────────────────
export const trackCall = async (req: Request, res: Response): Promise<void> => {
  try {
    const officeId = req.params.id as string;
    await prisma.office.update({
      where: { id: officeId },
      data: { callCount: { increment: 1 } },
    });
    res.json({ success: true });
  } catch {
    res.status(404).json({ success: false, error: 'Office not found' });
  }
};

// ── POST /api/offices/join — Captain joins office by code ──────────────────
export const joinOffice = async (req: any, res: Response): Promise<void> => {
  try {
    const { code } = joinOfficeSchema.parse(req.body);
    const office = await prisma.office.findUnique({ where: { code } });

    if (!office) {
      res.status(404).json({ success: false, error: 'No office found with this code' });
      return;
    }
    if (office.status !== 'APPROVED') {
      res.status(400).json({ success: false, error: 'This office is not active' });
      return;
    }

    // Check if already a member
    const existing = await prisma.officeMember.findUnique({
      where: { officeId_captainId: { officeId: office.id, captainId: req.user.id } },
    });
    if (existing) {
      res.status(409).json({ success: false, error: `You already ${existing.status === 'APPROVED' ? 'belong to' : 'requested to join'} this office` });
      return;
    }

    const member = await prisma.officeMember.create({
      data: { officeId: office.id, captainId: req.user.id, status: 'PENDING' },
    });

    res.status(201).json({ success: true, member, officeName: office.name });
  } catch (e: any) {
    if (e.errors) {
      res.status(400).json({ success: false, errors: e.errors.map((err: any) => ({ field: err.path.join('.'), message: err.message })) });
    } else {
      res.status(400).json({ success: false, error: e.message });
    }
  }
};

// ── GET /api/offices/:id/members — List members of an office ───────────────
export const getOfficeMembers = async (req: any, res: Response): Promise<void> => {
  const office = await prisma.office.findUnique({ where: { id: req.params.id } });
  if (!office || office.ownerId !== req.user.id) {
    res.status(403).json({ success: false, error: 'Only the office owner can view members' });
    return;
  }

  const members = await prisma.officeMember.findMany({
    where: { officeId: req.params.id },
    include: { captain: { select: { id: true, name: true, phoneNumber: true, vehicleNumber: true, tankerCapacity: true, isOnline: true } } },
    orderBy: { joinedAt: 'desc' },
  });

  res.json({ success: true, members });
};

// ── PATCH /api/offices/:id/members/:memberId — Approve/reject ─────────────
export const updateMemberStatus = async (req: any, res: Response): Promise<void> => {
  const office = await prisma.office.findUnique({ where: { id: req.params.id } });
  if (!office || office.ownerId !== req.user.id) {
    res.status(403).json({ success: false, error: 'Only the office owner can manage members' });
    return;
  }

  const { status } = req.body;
  if (!['APPROVED', 'REJECTED'].includes(status)) {
    res.status(400).json({ success: false, error: 'Status must be APPROVED or REJECTED' });
    return;
  }

  try {
    const member = await prisma.officeMember.update({
      where: { id: req.params.memberId },
      data: { status },
    });
    res.json({ success: true, member });
  } catch {
    res.status(404).json({ success: false, error: 'Member not found' });
  }
};

// ── GET /api/offices/my — Captain's offices ───────────────────────────────
export const getMyOffices = async (req: any, res: Response): Promise<void> => {
  const memberships = await prisma.officeMember.findMany({
    where: { captainId: req.user.id },
    include: {
      office: {
        select: {
          id: true, code: true, name: true, phone: true, city: true,
          lat: true, lng: true, serviceRadiusKm: true, status: true,
          ownerId: true, viewCount: true, callCount: true,
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  });

  res.json({
    success: true,
    offices: memberships.map(m => ({
      ...m.office,
      memberStatus: m.status,
      isOwner: m.office.ownerId === req.user.id,
    })),
  });
};

// ── PATCH /api/offices/:id — Update basic office config ───────────────
export const updateOfficeDetails = async (req: any, res: Response): Promise<void> => {
  try {
    const officeId = req.params.id as string;
    const { name, city, lat, lng, serviceRadiusKm } = req.body;
    
    const office = await prisma.office.findUnique({ where: { id: officeId } });
    if (!office) {
      res.status(404).json({ success: false, error: 'Office not found' });
      return;
    }
    if (office.ownerId !== req.user.id) {
      res.status(403).json({ success: false, error: 'Only the owner can modify settings' });
      return;
    }

    const updated = await prisma.office.update({
      where: { id: officeId },
      data: { name, city, lat, lng, serviceRadiusKm: Number(serviceRadiusKm) },
    });
    
    res.json({ success: true, office: updated });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
};
