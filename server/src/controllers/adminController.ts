import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ── GET /api/admin/stats — Dashboard overview ─────────────────────────────
export const getAdminStats = async (_req: Request, res: Response): Promise<void> => {
  const [
    totalUsers,
    totalCaptains,
    totalCustomers,
    totalOffices,
    pendingOffices,
    totalBookings,
    deliveredBookings,
    cancelledBookings,
    pendingBookings,
    revenueResult,
    todayBookings,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'CAPTAIN' } }),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.office.count({ where: { status: 'APPROVED' } }),
    prisma.office.count({ where: { status: 'PENDING' } }),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: 'DELIVERED' } }),
    prisma.booking.count({ where: { status: 'CANCELLED' } }),
    prisma.booking.count({ where: { status: 'PENDING' } }),
    prisma.booking.aggregate({ where: { status: 'DELIVERED' }, _sum: { price: true } }),
    prisma.booking.count({
      where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    }),
  ]);

  const totalRevenue = revenueResult._sum.price || 0;
  const cancellationRate = totalBookings > 0 ? Math.round((cancelledBookings / totalBookings) * 100) : 0;

  res.json({
    success: true,
    stats: {
      totalUsers,
      totalCaptains,
      totalCustomers,
      totalOffices,
      pendingOffices,
      totalBookings,
      deliveredBookings,
      cancelledBookings,
      pendingBookings,
      todayBookings,
      totalRevenue: Math.round(totalRevenue),
      cancellationRate,
    },
  });
};

// ── GET /api/admin/offices — List all offices ─────────────────────────────
export const getAdminOffices = async (req: Request, res: Response): Promise<void> => {
  const status = req.query.status as string | undefined;
  const where = status ? { status: status as any } : {};

  const offices = await prisma.office.findMany({
    where,
    include: {
      members: {
        where: { status: 'APPROVED' },
        include: { captain: { select: { id: true, name: true, isOnline: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({
    success: true,
    offices: offices.map(o => ({
      id: o.id,
      code: o.code,
      name: o.name,
      phone: o.phone,
      ownerName: o.ownerName,
      city: o.city,
      status: o.status,
      serviceRadiusKm: o.serviceRadiusKm,
      viewCount: o.viewCount,
      callCount: o.callCount,
      memberCount: o.members.length,
      onlineCount: o.members.filter(m => m.captain.isOnline).length,
      createdAt: o.createdAt,
    })),
  });
};

// ── PATCH /api/admin/offices/:id/status — Approve/reject/suspend ──────────
export const updateOfficeStatus = async (req: Request, res: Response): Promise<void> => {
  const { status } = req.body;
  if (!['APPROVED', 'REJECTED', 'SUSPENDED'].includes(status)) {
    res.status(400).json({ success: false, error: 'Invalid status' });
    return;
  }

  try {
    const officeId = req.params.id as string;
    const office = await prisma.office.update({
      where: { id: officeId },
      data: { status },
    });
    res.json({ success: true, office });
  } catch {
    res.status(404).json({ success: false, error: 'Office not found' });
  }
};

// ── GET /api/admin/bookings — All bookings ─────────────────────────────────
export const getAdminBookings = async (req: Request, res: Response): Promise<void> => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const status = req.query.status as string | undefined;

  const where = status ? { status: status as any } : {};

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        customer: { select: { name: true, phoneNumber: true } },
        captain: { select: { name: true, phoneNumber: true, vehicleNumber: true } },
        office: { select: { name: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.booking.count({ where }),
  ]);

  res.json({
    success: true,
    bookings,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
};

// ── GET /api/admin/users — All users ─────────────────────────────────────
export const getAdminUsers = async (req: Request, res: Response): Promise<void> => {
  const role = req.query.role as string | undefined;
  const where = role ? { role: role as any } : {};

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      phoneNumber: true,
      email: true,
      role: true,
      isVerified: true,
      isOnline: true,
      vehicleNumber: true,
      tankerCapacity: true,
      createdAt: true,
      _count: { select: { bookingsAsCustomer: true, bookingsAsCaptain: true, officeMemberships: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  res.json({ success: true, users });
};

// ── DELETE /api/admin/offices/:id — Admin Force Delete Office ─────────────
export const deleteOffice = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    await prisma.booking.deleteMany({ where: { officeId: id } });
    await prisma.officeMember.deleteMany({ where: { officeId: id } });
    await prisma.office.delete({ where: { id } });
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ success: false, error: 'Failed to delete office' });
  }
};

// ── DELETE /api/admin/bookings/:id — Admin Force Delete Booking ───────────
export const deleteBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    await prisma.booking.delete({ where: { id } });
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ success: false, error: 'Failed to delete booking' });
  }
};

// ── DELETE /api/admin/users/:id — Admin Force Delete User ─────────────────
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    await prisma.booking.deleteMany({ where: { OR: [{ customerId: id }, { captainId: id }] } });
    await prisma.officeMember.deleteMany({ where: { captainId: id } });
    await prisma.captainLocation.deleteMany({ where: { captainId: id } });
    await prisma.savedAddress.deleteMany({ where: { userId: id } });
    await prisma.user.delete({ where: { id } });
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ success: false, error: 'Failed to delete user' });
  }
};
