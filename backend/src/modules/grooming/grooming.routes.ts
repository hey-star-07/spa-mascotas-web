import { Router } from 'express';
import { GroomingController } from './grooming.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorize } from '../../shared/middleware/authorize';
import { validate } from '../../shared/middleware/validate';
import { createFichaSchema, updateFichaSchema, createFotoSchema, createConsumoInsumoSchema } from './grooming.validators';

const router = Router();

// Fichas
router.get('/fichas/:id', authenticate, authorize('Admin', 'Recepcion', 'Groomer'), GroomingController.getFicha);
router.get('/my-fichas', authenticate, authorize('Groomer'), GroomingController.getMyFichas);
router.post('/fichas', authenticate, authorize('Admin', 'Recepcion', 'Groomer'), validate(createFichaSchema), GroomingController.createFicha);
router.put('/fichas/:id', authenticate, authorize('Admin', 'Recepcion', 'Groomer'), validate(updateFichaSchema), GroomingController.updateFicha);
router.put('/fichas/:id/cerrar', authenticate, authorize('Admin', 'Recepcion', 'Groomer'), GroomingController.cerrarFicha);

// Regenerar checklist desde plantilla
router.post('/fichas/:id/regenerar-checklist', authenticate, authorize('Groomer', 'Admin'), GroomingController.regenerarChecklist);
// Iniciar servicio (crear ficha desde cita)
router.post('/iniciar-servicio/:citaId', authenticate, authorize('Groomer'), GroomingController.iniciarServicio);
// Checklist
router.put('/checklist/:id', authenticate, authorize('Groomer'), GroomingController.updateChecklist);

// Fotos
router.post('/fotos', authenticate, authorize('Groomer'), validate(createFotoSchema), GroomingController.addFoto);
router.delete('/fotos/:id', authenticate, authorize('Groomer'), GroomingController.deleteFoto);

// Insumos
router.post('/insumos', authenticate, authorize('Groomer'), validate(createConsumoInsumoSchema), GroomingController.addConsumoInsumo);
router.put('/insumos/:id', authenticate, authorize('Groomer'), GroomingController.updateConsumoInsumo);
router.delete('/insumos/:id', authenticate, authorize('Groomer'), GroomingController.deleteConsumoInsumo);

export default router;