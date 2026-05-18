import { Router } from 'express';
import { AuditLogsController } from './audit-logs.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { adminOnly } from '../../shared/middleware/authorize';

const router = Router();

router.get('/', authenticate, adminOnly, AuditLogsController.getLogs);
router.get('/stats', authenticate, adminOnly, AuditLogsController.getLogStats);

export default router;