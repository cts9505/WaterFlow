import { Router } from 'express';
import { registerUser, loginUser, getMe, updateProfile, verifyAadhaar, logoutUser, getCaptainStats } from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', authenticate, getMe);
router.patch('/profile', authenticate, updateProfile);
router.post('/verify-aadhaar', authenticate, verifyAadhaar);
router.post('/logout', authenticate, logoutUser);
router.get('/captain/stats', authenticate, getCaptainStats);

export default router;
