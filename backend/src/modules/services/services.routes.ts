import { Router } from 'express';
import { ServicesController } from './services.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorize } from '../../shared/middleware/authorize';
import { validate } from '../../shared/middleware/validate';
import { createServiceSchema, updateServiceSchema } from './services.validators';

const router = Router();

// Rutas públicas (solo lectura para clientes autenticados)
router.get('/', authenticate, ServicesController.getAll);
router.get('/calculate-duration', authenticate, ServicesController.calculateDuration);
router.get('/:id', authenticate, ServicesController.getById);

// Rutas de Admin/Recepcion
router.post('/', authenticate, authorize('Admin'), validate(createServiceSchema), ServicesController.create);
router.put('/:id', authenticate, authorize('Admin'), validate(updateServiceSchema), ServicesController.update);

// Checklist del servicio
router.get('/:id/checklist', authenticate, authorize('Admin'), ServicesController.getChecklist);
router.post('/:id/checklist', authenticate, authorize('Admin'), ServicesController.addChecklistItem);
router.delete('/:id/checklist/:itemId', authenticate, authorize('Admin'), ServicesController.deleteChecklistItem);
export default router;