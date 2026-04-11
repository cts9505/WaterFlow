import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { getNearbyCaptains, updateCaptainLocation } from '../controllers/captainController';

const router = Router();

router.get('/nearby', getNearbyCaptains);
router.post('/location', authenticate, updateCaptainLocation);

export default router;
