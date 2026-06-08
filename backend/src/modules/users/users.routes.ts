import { Router } from 'express';
import { UsersController } from './users.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { adminOnly, adminOrOwner, authorize, staffOnly } from '../../shared/middleware/authorize';
import { validate } from '../../shared/middleware/validate';
import {
  updateUserSchema,
  updateUserAsAdminSchema,
  userIdParamsSchema,
  userListQuerySchema,
} from './users.validators';
import { auditLog } from '../../shared/middleware/auditLogger';

const router = Router();


// ============================================
// RUTAS DE STAFF (Admin, Recepcion, Groomer)
// ============================================
// Obtener groomers activos (accesible para Admin, Recepcion, Cliente)
router.get(
  '/groomers',
  authenticate,
  authorize('Admin', 'Recepcion', 'Cliente'),
  UsersController.getGroomers
);

// Estadísticas de usuarios
router.get(
  '/stats',
  authenticate,
  adminOnly,
  UsersController.getUserStats
);

// Obtener clientes activos (Admin, Recepción)
router.get('/clientes', authenticate, authorize('Admin', 'Recepcion'), UsersController.getClientes);
// ============================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ============================================

// Actualizar perfil propio
router.put(
  '/profile',
  authenticate,
  validate(updateUserSchema),
  UsersController.updateProfile
);

// ============================================
// RUTAS DE ADMIN
// ============================================

// Listar usuarios (paginado, filtrado)
router.get(
  '/',
  authenticate,
  adminOnly,
  validate(userListQuerySchema),
  UsersController.getUsers
);

// Buscar usuarios (útil para recepción)
router.get(
  '/search',
  authenticate,
  staffOnly,
  UsersController.searchUsers
);

// Obtener usuario por ID
router.get(
  '/:id',
  authenticate,
  adminOrOwner,
  validate(userIdParamsSchema),
  UsersController.getUserById
);

// Actualizar usuario como Admin
router.put(
  '/:id',
  authenticate,
  adminOnly,
  validate(updateUserAsAdminSchema),
  auditLog('UPDATE', 'usuarios'),
  UsersController.updateUserAsAdmin
);

// Desactivar usuario
router.put(
  '/:id/deactivate',
  authenticate,
  adminOnly,
  validate(userIdParamsSchema),
  auditLog('DEACTIVATE', 'usuarios'),
  UsersController.deactivateUser
);

// Reactivar usuario
router.put(
  '/:id/reactivate',
  authenticate,
  adminOnly,
  validate(userIdParamsSchema),
  auditLog('REACTIVATE', 'usuarios'),
  UsersController.reactivateUser
);

// Eliminar usuario
router.delete(
  '/:id',
  authenticate,
  adminOnly,
  validate(userIdParamsSchema),
  auditLog('DELETE', 'usuarios'),
  UsersController.deleteUser
);


export default router;