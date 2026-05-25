import { Router } from 'express';
import { AvailabilityController } from './availability.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorize } from '../../shared/middleware/authorize';
import { validate } from '../../shared/middleware/validate';
import { createAvailabilitySchema, createBloqueoSchema } from './availability.validators';

const router = Router();

// Lectura (Admin, Recepcion)
router.get('/', authenticate, authorize('Admin', 'Recepcion'), AvailabilityController.getAll);
router.get('/check', authenticate, authorize('Admin', 'Recepcion'), AvailabilityController.checkAvailability);
router.get('/slots', authenticate, AvailabilityController.getSlots);
router.get('/bloqueos', authenticate, authorize('Admin', 'Recepcion'), AvailabilityController.getBloqueos);
router.get('/groomer/:groomerId', authenticate, AvailabilityController.getByGroomer);

// Escritura (Admin)
router.post('/', authenticate, authorize('Admin'), validate(createAvailabilitySchema), AvailabilityController.create);
router.delete('/:id', authenticate, authorize('Admin'), AvailabilityController.delete);
router.post('/bloqueos', authenticate, authorize('Admin', 'Recepcion'), validate(createBloqueoSchema), AvailabilityController.createBloqueo);
router.delete('/bloqueos/:id', authenticate, authorize('Admin', 'Recepcion'), AvailabilityController.deleteBloqueo);

export default router;