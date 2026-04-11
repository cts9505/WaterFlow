import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import {
  createOffice, getNearbyOffices, getOfficeDetail, trackCall,
  joinOffice, getOfficeMembers, updateMemberStatus, getMyOffices, updateOfficeDetails
} from '../controllers/officeController';

const router = Router();

// Static paths first (before /:id param routes)
router.get('/nearby', getNearbyOffices);
router.get('/my/list', authenticate, getMyOffices);
router.post('/', authenticate, createOffice);
router.post('/join', authenticate, joinOffice);

// Parameterized routes
router.get('/:id', getOfficeDetail);           // increments viewCount
router.post('/:id/call', trackCall);           // increments callCount
router.get('/:id/members', authenticate, getOfficeMembers);
router.patch('/:id/members/:memberId', authenticate, updateMemberStatus);
router.patch('/:id', authenticate, updateOfficeDetails);

export default router;
