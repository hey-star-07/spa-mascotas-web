import { Router } from 'express';
import { BillingController } from './billing.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorize } from '../../shared/middleware/authorize';
import { validate } from '../../shared/middleware/validate';
import { createFacturaSchema, createPagoSchema, createDetalleSchema } from './billing.validators';

const router = Router();

// Lectura
router.get('/facturas', authenticate, authorize('Admin', 'Recepcion'), BillingController.getAll);
router.get('/facturas/mis-facturas', authenticate, authorize('Cliente'), BillingController.getMyFacturas);
router.get('/facturas/:id', authenticate, BillingController.getById);
router.get('/facturas/:id/qr', authenticate, authorize('Admin', 'Recepcion'), BillingController.generarQR);
router.get('/cierre-caja', authenticate, authorize('Admin', 'Recepcion'), BillingController.getCierreCaja);

// Escritura
router.post('/facturas', authenticate, authorize('Admin', 'Recepcion'), validate(createFacturaSchema), BillingController.createFactura);
router.post('/detalles', authenticate, authorize('Admin', 'Recepcion'), validate(createDetalleSchema), BillingController.addDetalle);
router.post('/pagos', authenticate, authorize('Admin', 'Recepcion'), validate(createPagoSchema), BillingController.registrarPago);

export default router;