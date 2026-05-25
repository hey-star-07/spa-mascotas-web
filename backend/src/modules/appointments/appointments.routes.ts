import { Router } from 'express';
import { AppointmentsController } from './appointments.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorize } from '../../shared/middleware/authorize';
import { validate } from '../../shared/middleware/validate';
import { createAppointmentSchema, updateAppointmentSchema, appointmentFiltersSchema } from './appointments.validators';

const router = Router();

// Lectura
router.get('/', authenticate, authorize('Admin', 'Recepcion', 'Groomer'), validate(appointmentFiltersSchema), AppointmentsController.getAll);
router.get('/my', authenticate, authorize('Cliente'), AppointmentsController.getMyAppointments);
router.get('/my-day', authenticate, authorize('Groomer'), AppointmentsController.getMyDay);
router.get('/groomer/:groomerId', authenticate, authorize('Admin', 'Recepcion', 'Groomer'), AppointmentsController.getByGroomer);
router.get('/:id', authenticate, AppointmentsController.getById);

// Escritura
router.post('/', authenticate, authorize('Admin', 'Recepcion', 'Cliente'), validate(createAppointmentSchema), AppointmentsController.create);
router.put('/:id', authenticate, authorize('Admin', 'Recepcion'), validate(updateAppointmentSchema), AppointmentsController.update);
router.put('/:id/cancel', authenticate, AppointmentsController.cancel);
router.put('/:id/approve', authenticate, authorize('Admin', 'Recepcion'), AppointmentsController.approve);
router.put('/:id/reject', authenticate, authorize('Admin', 'Recepcion'), AppointmentsController.reject);

export default router;