import { Router } from 'express';
import { PromotionsController } from './promotions.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorize } from '../../shared/middleware/authorize';

const router = Router();

router.get('/', authenticate, PromotionsController.getAll);
router.post('/', authenticate, authorize('Admin'), PromotionsController.create);
router.post('/aplicar-cupon', authenticate, PromotionsController.aplicarCupon);
router.put('/:id', authenticate, authorize('Admin'), PromotionsController.update);
router.delete('/:id', authenticate, authorize('Admin'), PromotionsController.delete);

export default router;