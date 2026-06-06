import { Router } from 'express';
import { StoreController } from './store.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorize } from '../../shared/middleware/authorize';

const router = Router();

router.get('/catalogo', authenticate, StoreController.getCatalogo);
router.get('/cart', authenticate, authorize('Cliente'), StoreController.getCart);
router.post('/cart', authenticate, authorize('Cliente'), StoreController.addToCart);
// Cupones
router.post('/aplicar-cupon', authenticate, authorize('Cliente'), StoreController.aplicarCupon);
router.delete('/cupon', authenticate, authorize('Cliente'), StoreController.quitarCupon);
router.delete('/cart/:id', authenticate, authorize('Cliente'), StoreController.removeFromCart);
router.post('/pedido', authenticate, authorize('Cliente'), StoreController.generarPedido);

export default router;