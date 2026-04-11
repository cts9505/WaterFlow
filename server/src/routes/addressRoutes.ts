import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { getAddresses, createAddress, updateAddress, deleteAddress } from '../controllers/addressController';

const router = Router();

router.get('/', authenticate, getAddresses);
router.post('/', authenticate, createAddress);
router.patch('/:id', authenticate, updateAddress);
router.delete('/:id', authenticate, deleteAddress);

export default router;
