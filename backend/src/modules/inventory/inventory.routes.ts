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

// Recomendaciones de reabastecimiento
router.get('/recomendaciones-reabastecimiento', authenticate, authorize('Admin', 'Recepcion'), InventoryController.getRecomendacionesReabastecimiento);

// Movimientos
router.post('/movimientos', authenticate, authorize('Admin', 'Recepcion', 'Groomer'), validate(movimientoInventarioSchema), InventoryController.registrarMovimiento);
router.get('/consumo', authenticate, authorize('Admin', 'Recepcion'), InventoryController.getConsumo);

// Insumos asignados (PASO 1-5)
router.get('/insumos-sugeridos/:servicioId', authenticate, authorize('Admin', 'Recepcion'), InventoryController.getInsumosSugeridos);
router.post('/asignar-insumos', authenticate, authorize('Admin', 'Recepcion'), InventoryController.asignarInsumos);
router.get('/insumos-asignados/:citaId', authenticate, InventoryController.getInsumosAsignados);
router.put('/confirmar-insumo/:id', authenticate, authorize('Groomer'), InventoryController.confirmarRecepcion);
router.put('/registrar-uso/:id', authenticate, authorize('Groomer'), InventoryController.registrarUso);
router.get('/verificar-insumos/:citaId', authenticate, InventoryController.verificarInsumos);
router.get('/log-completo', authenticate, authorize('Admin'), InventoryController.getLogCompleto);

// Configuración de insumos por servicio
router.get('/insumos-servicio/:servicioId', authenticate, authorize('Admin'), InventoryController.getInsumosServicio);
router.post('/insumos-servicio/:servicioId', authenticate, authorize('Admin'), InventoryController.configurarInsumosServicio);

// Catálogo de tienda (público)
router.get('/catalogo-tienda', authenticate, InventoryController.getCatalogoTienda);

// Insumos técnicos (para asignación)
router.get('/insumos-tecnicos', authenticate, authorize('Admin', 'Recepcion'), InventoryController.getInsumosTecnicos);

// Actualizar la ruta existente de productos para aceptar filtro tipo
router.get('/productos', authenticate, InventoryController.getProductos);

// Log de insumos
router.get('/log-insumos', authenticate, authorize('Admin'), InventoryController.getLogInsumos);
router.get('/log-insumos/resumen', authenticate, authorize('Admin'), InventoryController.getResumenPorGroomer);

// Categorías
router.get('/categorias', authenticate, InventoryController.getCategorias);
router.post('/categorias', authenticate, authorize('Admin'), InventoryController.createCategoria);

// Alertas separadas por tipo
router.get('/alertas/tienda', authenticate, authorize('Admin', 'Recepcion'), InventoryController.getAlertasTienda);
router.get('/alertas/insumos', authenticate, authorize('Admin', 'Recepcion'), InventoryController.getAlertasInsumos);

export default router;