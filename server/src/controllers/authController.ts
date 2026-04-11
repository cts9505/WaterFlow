import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { registerSchema, loginSchema, aadhaarSchema, updateProfileSchema } from '../validators/authSchemas';
import { JWT_SECRET_KEY } from '../middleware/authMiddleware';

const prisma = new PrismaClient();
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const setAuthCookie = (res: Response, user: any) => {
  const token = jwt.sign(
    { id: user.id, role: user.role, phoneNumber: user.phoneNumber },
    JWT_SECRET_KEY,
    { expiresIn: '7d' }
  );
  res.cookie('waterflow_token', token, {
    httpOnly: true, sameSite: 'lax', maxAge: COOKIE_MAX_AGE,
    secure: process.env.NODE_ENV === 'production',
  });
};

const formatZodErrors = (e: any): Record<string, string> => {
  const map: Record<string, string> = {};
  if (e.errors) e.errors.forEach((err: any) => { map[err.path.join('.')] = err.message; });
  return map;
};

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = registerSchema.parse(req.body);
    
    // Check phone uniqueness
    const existingPhone = await prisma.user.findUnique({ where: { phoneNumber: data.phoneNumber } });
    if (existingPhone) {
      res.status(409).json({ success: false, errors: { phoneNumber: 'This phone number is already registered' } }); return;
    }
    
    // Check email uniqueness if provided
    if (data.email) {
      const existingEmail = await prisma.user.findFirst({ where: { email: data.email } });
      if (existingEmail) {
        res.status(409).json({ success: false, errors: { email: 'This email is already in use' } }); return;
      }
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        phoneNumber: data.phoneNumber,
        email: data.email || null,
        name: data.name,
        role: data.role,
        passwordHash,
        serviceRadiusKm: data.serviceRadiusKm,
        vehicleNumber: data.vehicleNumber,
        tankerCapacity: data.tankerCapacity,
        operationLat: data.operationLat,
        operationLng: data.operationLng,
      },
    });
    setAuthCookie(res, user);
    res.status(201).json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, phoneNumber: user.phoneNumber, isVerified: user.isVerified },
    });
  } catch (e: any) {
    if (e.name === 'ZodError') {
      res.status(400).json({ success: false, errors: formatZodErrors(e) });
    } else {
      res.status(400).json({ success: false, error: e.message });
    }
  }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { phoneNumber: data.phoneNumber } });
    if (!user || !user.passwordHash) {
      res.status(401).json({ success: false, errors: { phoneNumber: 'No account found with this number' } }); return;
    }
    if (data.role && user.role !== data.role) {
      res.status(403).json({ success: false, errors: { role: `This number is registered as ${user.role.toLowerCase()}` } }); return;
    }
    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ success: false, errors: { password: 'Incorrect password' } }); return;
    }
    setAuthCookie(res, user);
    res.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, isVerified: user.isVerified, phoneNumber: user.phoneNumber },
    });
  } catch (e: any) {
    if (e.name === 'ZodError') {
      res.status(400).json({ success: false, errors: formatZodErrors(e) });
    } else {
      res.status(400).json({ success: false, error: e.message });
    }
  }
};

export const getMe = async (req: any, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true, name: true, email: true, phoneNumber: true, role: true,
      isVerified: true, serviceRadiusKm: true, vehicleNumber: true,
      tankerCapacity: true, isOnline: true, operationLat: true, operationLng: true,
      basePrice: true, createdAt: true,
      addresses: { orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }], take: 10 },
    },
  });
  res.json({ success: true, user });
};

export const updateProfile = async (req: any, res: Response): Promise<void> => {
  try {
    const data = updateProfileSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: {
        id: true, name: true, email: true, phoneNumber: true, role: true,
        vehicleNumber: true, tankerCapacity: true, serviceRadiusKm: true,
        operationLat: true, operationLng: true,
      },
    });
    res.json({ success: true, user });
  } catch (e: any) {
    if (e.name === 'ZodError') {
      res.status(400).json({ success: false, errors: formatZodErrors(e) });
    } else {
      res.status(400).json({ success: false, error: e.message });
    }
  }
};

export const verifyAadhaar = async (req: any, res: Response): Promise<void> => {
  try {
    const { aadhaarNumber } = aadhaarSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { aadhaarNumber, isVerified: true },
    });
    res.json({ success: true, isVerified: user.isVerified });
  } catch (e: any) {
    if (e.name === 'ZodError') {
      res.status(400).json({ success: false, errors: formatZodErrors(e) });
    } else {
      res.status(400).json({ success: false, error: e.message });
    }
  }
};

export const logoutUser = async (req: any, res: Response): Promise<void> => {
  // Set captain offline on logout
  if (req.user?.id) {
    await prisma.user.update({ where: { id: req.user.id }, data: { isOnline: false } }).catch(() => {});
  }
  res.clearCookie('waterflow_token');
  res.json({ success: true });
};

// Captain stats — real earnings, trips from DB
export const getCaptainStats = async (req: any, res: Response): Promise<void> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [todayBookings, totalBookings] = await Promise.all([
    prisma.booking.findMany({
      where: { captainId: req.user.id, status: 'DELIVERED', updatedAt: { gte: today } },
      select: { price: true },
    }),
    prisma.booking.findMany({
      where: { captainId: req.user.id, status: 'DELIVERED' },
      select: { price: true },
    }),
  ]);

  const todayEarnings = todayBookings.reduce((sum: number, b: { price: number }) => sum + b.price, 0);
  const totalEarnings = totalBookings.reduce((sum: number, b: { price: number }) => sum + b.price, 0);

  res.json({
    success: true,
    stats: {
      todayEarnings: Math.round(todayEarnings),
      todayTrips: todayBookings.length,
      totalEarnings: Math.round(totalEarnings),
      totalTrips: totalBookings.length,
    },
  });
};
