import { Router } from 'express';
import { NotificationsController } from './notifications.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { adminOnly } from '../../shared/middleware/authorize';

const router = Router();

router.post('/send-pending', authenticate, adminOnly, NotificationsController.sendPending);

export default router;