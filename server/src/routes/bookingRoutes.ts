import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { createBooking, getMyBookings, getBookingById, getPendingOrders, acceptOrder, updateBookingStatus, cancelBooking } from '../controllers/bookingController';

const router = Router();

router.post('/', authenticate, createBooking);
router.get('/my', authenticate, getMyBookings);
router.get('/pending', authenticate, getPendingOrders);
router.get('/:id', authenticate, getBookingById);
router.patch('/:id/accept', authenticate, acceptOrder);    // race-condition-safe
router.patch('/:id/status', authenticate, updateBookingStatus);
router.post('/:id/cancel', authenticate, cancelBooking);

export default router;
