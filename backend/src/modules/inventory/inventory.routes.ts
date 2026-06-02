import { Router } from 'express';
import { InventoryController } from './inventory.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorize } from '../../shared/middleware/authorize';
import { validate } from '../../shared/middleware/validate';
import { createProductoSchema, updateProductoSchema, createVarianteSchema, movimientoInventarioSchema } from './inventory.validators';

const router = Router();

// Productos
router.get('/productos', authenticate, InventoryController.getProductos);
router.get('/productos/:id', authenticate, InventoryController.getProductoById);
router.post('/productos', authenticate, authorize('Admin'), validate(createProductoSchema), InventoryController.createProducto);
router.put('/productos/:id', authenticate, authorize('Admin'), validate(updateProductoSchema), InventoryController.updateProducto);

// Variantes
router.post('/variantes', authenticate, authorize('Admin'), validate(createVarianteSchema), InventoryController.createVariante);
router.put('/variantes/:id/stock', authenticate, authorize('Admin', 'Recepcion'), InventoryController.updateStock);

// Alertas
router.get('/alertas', authenticate, authorize('Admin', 'Recepcion'), InventoryController.getAlertas);
router.get('/resumen', authenticate, authorize('Admin', 'Recepcion'), InventoryController.getResumen);

// Alertas de consumo
router.get('/alertas-consumo', authenticate, authorize('Admin', 'Recepcion'), InventoryController.getAlertasConsumo);


// Movimientos
router.post('/movimientos', authenticate, authorize('Admin', 'Recepcion', 'Groomer'), validate(movimientoInventarioSchema), InventoryController.registrarMovimiento);
router.get('/consumo', authenticate, authorize('Admin', 'Recepcion'), InventoryController.getConsumo);

// Recomendaciones de reabastecimiento
router.get('/recomendaciones-reabastecimiento', authenticate, authorize('Admin', 'Recepcion'), InventoryController.getRecomendacionesReabastecimiento);

// Log de insumos
router.get('/log-insumos', authenticate, authorize('Admin'), InventoryController.getLogInsumos);
router.get('/log-insumos/resumen', authenticate, authorize('Admin'), InventoryController.getResumenPorGroomer);
export default router;