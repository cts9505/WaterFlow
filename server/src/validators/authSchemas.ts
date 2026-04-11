import { z } from 'zod';

// ── Auth ─────────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  phoneNumber: z
    .string()
    .trim()
    .min(10, 'Phone number must be at least 10 digits')
    .max(10, 'Phone number must be exactly 10 digits')
    .regex(/^[6-9]\d{9}$/, 'Enter a valid Indian mobile number (must start with 6-9)'),
  email: z
    .string()
    .trim()
    .email('Enter a valid email address')
    .max(254)
    .optional()
    .or(z.literal('')),
  role: z.enum(['CUSTOMER', 'CAPTAIN', 'ADMIN']).default('CUSTOMER'),
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name too long')
    .optional(),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password too long'),
  // Captain-specific
  serviceRadiusKm: z.number().min(1).max(100).optional(),
  vehicleNumber: z
    .string()
    .trim()
    .min(4, 'Vehicle number too short')
    .max(20)
    .regex(/^[A-Z0-9 -]+$/i, 'Invalid vehicle number format')
    .optional(),
  tankerCapacity: z.number().int().min(100).max(50000).optional(),
  operationLat: z.number().min(-90).max(90).optional(),
  operationLng: z.number().min(-180).max(180).optional(),
});

export const loginSchema = z.object({
  phoneNumber: z
    .string()
    .trim()
    .min(10, 'Phone number required')
    .max(10, 'Phone number must be exactly 10 digits')
    .regex(/^[6-9]\d{9}$/, 'Enter a valid Indian mobile number'),
  password: z.string().min(1, 'Password is required'),
  role: z.enum(['CUSTOMER', 'CAPTAIN', 'ADMIN']).optional(),
});

export const aadhaarSchema = z.object({
  aadhaarNumber: z
    .string()
    .trim()
    .length(12, 'Aadhaar number must be exactly 12 digits')
    .regex(/^\d{12}$/, 'Aadhaar must contain only digits'),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  email: z.string().trim().email('Invalid email').max(254).optional().or(z.literal('')),
  serviceRadiusKm: z.number().min(1).max(100).optional(),
  vehicleNumber: z
    .string()
    .trim()
    .regex(/^[A-Z0-9 -]+$/i, 'Invalid vehicle number')
    .min(4)
    .max(20)
    .optional()
    .or(z.literal('')),
  tankerCapacity: z.number().int().min(100).max(50000).optional(),
  basePrice: z.number().min(100).max(10000).optional(),
  operationLat: z.number().min(-90).max(90).optional(),
  operationLng: z.number().min(-180).max(180).optional(),
});

// ── Address ──────────────────────────────────────────────────────────────────

export const savedAddressSchema = z.object({
  tag: z.enum(['HOME', 'WORK', 'SOCIETY', 'OTHER']),
  label: z.string().trim().max(100).optional(),
  societyName: z
    .string()
    .trim()
    .min(2, 'Society/building name must be at least 2 characters')
    .max(200)
    .optional(),
  addressLine: z.string().trim().max(300).optional(),
  city: z.string().trim().min(2, 'City is required').max(100).default('Mumbai'),
  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Pincode must be exactly 6 digits')
    .optional()
    .or(z.literal('')),
  lat: z.number().min(-90, 'Invalid latitude').max(90, 'Invalid latitude'),
  lng: z.number().min(-180, 'Invalid longitude').max(180, 'Invalid longitude'),
  isDefault: z.boolean().optional().default(false),
});

// ── Booking ──────────────────────────────────────────────────────────────────

export const bookingSchema = z.object({
  price: z
    .number()
    .min(200, 'Minimum booking price is ₹200')
    .max(10000, 'Price too high'),
  capacityLitres: z.number().int().min(100).max(30000).default(1000),
  dropoffLat: z
    .number()
    .min(-90, 'Invalid latitude')
    .max(90, 'Invalid latitude'),
  dropoffLng: z
    .number()
    .min(-180, 'Invalid longitude')
    .max(180, 'Invalid longitude'),
  societyName: z
    .string()
    .trim()
    .min(2, 'Society name is required (min 2 chars)')
    .max(200),
  addressLine: z.string().trim().max(300).optional(),
  city: z.string().trim().min(2).max(100).optional(),
  addressTag: z.enum(['HOME', 'WORK', 'SOCIETY', 'OTHER']).optional(),
  preferredCaptainId: z.string().uuid('Invalid captain ID').optional(),
  officeId: z.string().uuid('Invalid office ID').optional(),
});

export const cancelBookingSchema = z.object({
  reason: z.string().trim().min(3, 'Please provide a reason (min 3 chars)').max(500),
});

export const bidSchema = z.object({
  price: z.number().min(200, 'Minimum ₹200').max(10000),
  dropoffLat: z.number().min(-90).max(90),
  dropoffLng: z.number().min(-180).max(180),
  societyName: z.string().trim().min(2).max(200),
  capacityLitres: z.number().int().min(100).max(30000).optional(),
});

// ── Location ─────────────────────────────────────────────────────────────────

export const captainLocationSchema = z.object({
  bookingId: z.string().uuid().optional(),
  lat: z.number().min(-90, 'Invalid latitude').max(90),
  lng: z.number().min(-180, 'Invalid longitude').max(180),
  heading: z.number().min(0).max(360).optional(),
});

export const nearbyQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radiusKm: z.coerce.number().min(0.1).max(100).default(20),
});

// ── Office ───────────────────────────────────────────────────────────────────

export const createOfficeSchema = z.object({
  name: z.string().trim().min(2, 'Office name must be at least 2 characters').max(200),
  phone: z
    .string()
    .trim()
    .min(10, 'Phone number required')
    .max(10)
    .regex(/^[6-9]\d{9}$/, 'Enter a valid Indian mobile number'),
  ownerName: z.string().trim().max(100).optional(),
  address: z.string().trim().max(300).optional(),
  city: z.string().trim().min(2).max(100).default('Mumbai'),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  serviceRadiusKm: z.number().min(1).max(100).default(10),
});

export const joinOfficeSchema = z.object({
  code: z.string().trim().min(4, 'Office code must be 4 digits').max(4).regex(/^\d{4}$/, 'Office code must be exactly 4 digits'),
});

export const officeNearbySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});
