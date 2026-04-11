import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/authMiddleware';
import { getAdminStats, getAdminOffices, updateOfficeStatus, getAdminBookings, getAdminUsers, deleteOffice, deleteUser, deleteBooking } from '../controllers/adminController';

const router = Router();

router.use(authenticate);
router.use(requireRole('ADMIN'));

router.get('/stats', getAdminStats);
router.get('/offices', getAdminOffices);
router.patch('/offices/:id/status', updateOfficeStatus);
router.delete('/offices/:id', deleteOffice);
router.get('/bookings', getAdminBookings);
router.delete('/bookings/:id', deleteBooking);
router.get('/users', getAdminUsers);
router.delete('/users/:id', deleteUser);

export default router;
