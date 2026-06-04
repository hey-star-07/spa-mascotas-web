import { Router } from 'express';
import { ReportsController } from './reports.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorize } from '../../shared/middleware/authorize';

const router = Router();

// Admin
router.get('/ventas', authenticate, authorize('Admin'), ReportsController.getVentas);
router.get('/rentabilidad', authenticate, authorize('Admin'), ReportsController.getRentabilidad);
router.get('/ocupacion', authenticate, authorize('Admin', 'Recepcion'), ReportsController.getOcupacion);
router.get('/insumos', authenticate, authorize('Admin'), ReportsController.getAuditoriaInsumos);

// Groomer
router.get('/groomer', authenticate, authorize('Groomer'), ReportsController.getReporteGroomer);
router.get('/groomer/insumos', authenticate, authorize('Groomer'), ReportsController.getConsumoGroomer);

// Cliente
router.get('/cliente', authenticate, authorize('Cliente'), ReportsController.getReporteCliente);

export default router;