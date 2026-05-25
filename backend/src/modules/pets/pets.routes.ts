import { Router } from 'express';
import { PetsController } from './pets.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorize } from '../../shared/middleware/authorize';
import { validate } from '../../shared/middleware/validate';
import { createPetSchema, updatePetSchema } from './pets.validators';

const router = Router();

// 👇 RUTAS ESPECÍFICAS PRIMERO (evitar conflicto con :id)
router.get('/all', authenticate, authorize('Admin', 'Recepcion'), PetsController.getAllPets);

// 👇 RUTAS GENERALES DESPUÉS
router.get('/', authenticate, authorize('Admin', 'Recepcion', 'Cliente'), PetsController.getMyPets);
router.get('/:id', authenticate, authorize('Admin', 'Recepcion', 'Cliente'), PetsController.getById);
router.post('/', authenticate, authorize('Admin', 'Recepcion', 'Cliente'), validate(createPetSchema), PetsController.create);
router.put('/:id', authenticate, authorize('Admin', 'Recepcion', 'Cliente'), validate(updatePetSchema), PetsController.update);
router.delete('/:id', authenticate, authorize('Admin', 'Recepcion'), PetsController.delete);

export default router;