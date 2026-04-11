import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { savedAddressSchema } from '../validators/authSchemas';

const prisma = new PrismaClient();

export const getAddresses = async (req: any, res: Response): Promise<void> => {
  const addresses = await prisma.savedAddress.findMany({
    where: { userId: req.user.id },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
  });
  res.json({ success: true, addresses });
};

export const createAddress = async (req: any, res: Response): Promise<void> => {
  try {
    const data = savedAddressSchema.parse(req.body);
    // If this is set as default, clear others first
    if (data.isDefault) {
      await prisma.savedAddress.updateMany({ where: { userId: req.user.id }, data: { isDefault: false } });
    }
    const address = await prisma.savedAddress.create({ data: { ...data, userId: req.user.id } });
    res.status(201).json({ success: true, address });
  } catch (e: any) {
    res.status(400).json({ success: false, errors: e.errors?.map((err: any) => ({ field: err.path.join('.'), message: err.message })) || e.message });
  }
};

export const updateAddress = async (req: any, res: Response): Promise<void> => {
  try {
    const data = savedAddressSchema.partial().parse(req.body);
    if (data.isDefault) {
      await prisma.savedAddress.updateMany({ where: { userId: req.user.id }, data: { isDefault: false } });
    }
    const address = await prisma.savedAddress.update({ where: { id: req.params.id }, data });
    res.json({ success: true, address });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
};

export const deleteAddress = async (req: any, res: Response): Promise<void> => {
  await prisma.savedAddress.delete({ where: { id: req.params.id } });
  res.json({ success: true });
};
