import { Request, Response } from 'express';
import { PrismaClient, BookingStatus } from '@prisma/client';
import { bookingSchema, cancelBookingSchema } from '../validators/authSchemas';

const prisma = new PrismaClient();

// ── Race-Condition-Safe Accept ─────────────────────────────────────────────
export const acceptOrder = async (req: any, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const booking = await prisma.$transaction(async (tx) => {
      const existing = await tx.booking.findUnique({ where: { id } });
      if (!existing) throw new Error('NOT_FOUND');
      if (existing.status !== 'PENDING') throw new Error('ALREADY_ACCEPTED');

      return tx.booking.update({
        where: { id, status: 'PENDING' },
        data: { captainId: req.user.id, status: 'ACCEPTED', acceptedAt: new Date() },
      });
    });
    res.json({ success: true, booking });
  } catch (e: any) {
    if (e.message === 'NOT_FOUND') {
      res.status(404).json({ success: false, error: 'Booking not found' });
    } else if (e.message === 'ALREADY_ACCEPTED' || e.code === 'P2025') {
      res.status(409).json({ success: false, error: 'Order already accepted by another captain' });
    } else {
      res.status(500).json({ success: false, error: e.message });
    }
  }
};

// ── Create Booking ─────────────────────────────────────────────────────────
export const createBooking = async (req: any, res: Response): Promise<void> => {
  try {
    const data = bookingSchema.parse(req.body);
    const booking = await prisma.booking.create({
      data: {
        customerId: req.user.id,
        price: data.price,
        capacityLitres: data.capacityLitres,
        dropoffLat: data.dropoffLat,
        dropoffLng: data.dropoffLng,
        societyName: data.societyName,
        addressLine: data.addressLine,
        city: data.city,
        addressTag: data.addressTag,
        officeId: data.officeId,
      },
    });
    res.status(201).json({ success: true, booking });
  } catch (e: any) {
    if (e.errors) {
      res.status(400).json({ success: false, errors: e.errors.map((err: any) => ({ field: err.path.join('.'), message: err.message })) });
    } else {
      res.status(400).json({ success: false, error: e.message });
    }
  }
};

// ── Get My Bookings ────────────────────────────────────────────────────────
export const getMyBookings = async (req: any, res: Response): Promise<void> => {
  const whereClause = req.user.role === 'CAPTAIN' ? { captainId: req.user.id } : { customerId: req.user.id };
  const bookings = await prisma.booking.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    include: {
      captain: {
        select: { name: true, phoneNumber: true, vehicleNumber: true, tankerCapacity: true },
      },
      office: {
        select: { name: true, code: true, phone: true },
      },
    },
  });
  res.json({ success: true, bookings });
};

// ── Get Booking By ID ──────────────────────────────────────────────────────
export const getBookingById = async (req: any, res: Response): Promise<void> => {
  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: {
      customer: { select: { name: true, phoneNumber: true } },
      captain: { select: { name: true, phoneNumber: true, vehicleNumber: true, captainLocation: true } },
      office: { select: { name: true, code: true, phone: true } },
    },
  });
  if (!booking) { res.status(404).json({ success: false, error: 'Not found' }); return; }
  res.json({ success: true, booking });
};

// ── Pending Orders (for Captains — excludes already-accepted) ──────────────
export const getPendingOrders = async (req: any, res: Response): Promise<void> => {
  const captain = await prisma.user.findUnique({ where: { id: req.user.id }, select: { tankerCapacity: true, operationLat: true, operationLng: true, serviceRadiusKm: true } });
  if (!captain || !captain.tankerCapacity) { res.json({ success: true, bookings: [] }); return; }

  const bookings = await prisma.booking.findMany({
    where: { status: 'PENDING', capacityLitres: captain.tankerCapacity },
    orderBy: { createdAt: 'asc' },
    include: { customer: { select: { name: true } } },
  });

  const R = 6371;
  const validBookings = bookings.filter((b: any) => {
    if (!captain.operationLat) return true;
    const dLat = (captain.operationLat - b.dropoffLat) * Math.PI / 180;
    const dLng = (captain.operationLng! - b.dropoffLng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(b.dropoffLat * Math.PI / 180) * Math.cos(captain.operationLat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return dist <= (captain.serviceRadiusKm || 20);
  });

  res.json({ success: true, bookings: validBookings });
};

// ── Update Status ──────────────────────────────────────────────────────────
export const updateBookingStatus = async (req: any, res: Response): Promise<void> => {
  const { status } = req.body;
  if (!['IN_TRANSIT', 'DELIVERED', 'CANCELLED'].includes(status)) {
    res.status(400).json({ success: false, error: 'Invalid status' });
    return;
  }
  const booking = await prisma.booking.update({
    where: { id: req.params.id },
    data: { status: status as BookingStatus },
  });
  res.json({ success: true, booking });
};

// ── Cancel Booking ─────────────────────────────────────────────────────────
// Both customer and captain can cancel with a reason.
export const cancelBooking = async (req: any, res: Response): Promise<void> => {
  try {
    const { reason } = cancelBookingSchema.parse(req.body);
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });

    if (!booking) {
      res.status(404).json({ success: false, error: 'Booking not found' });
      return;
    }

    // Only allow cancellation for non-terminal states
    if (['DELIVERED', 'CANCELLED'].includes(booking.status)) {
      res.status(400).json({ success: false, error: 'Cannot cancel a completed or already cancelled booking' });
      return;
    }

    // Verify the user is either the customer or the assigned captain
    const isCustomer = booking.customerId === req.user.id;
    const isCaptain = booking.captainId === req.user.id;
    if (!isCustomer && !isCaptain) {
      res.status(403).json({ success: false, error: 'You can only cancel your own booking' });
      return;
    }

    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data: {
        status: 'CANCELLED',
        cancelledBy: isCustomer ? 'CUSTOMER' : 'CAPTAIN',
        cancelReason: reason,
        cancelledAt: new Date(),
      },
    });

    res.json({ success: true, booking: updated });
  } catch (e: any) {
    if (e.errors) {
      res.status(400).json({ success: false, errors: e.errors.map((err: any) => ({ field: err.path.join('.'), message: err.message })) });
    } else {
      res.status(400).json({ success: false, error: e.message });
    }
  }
};
