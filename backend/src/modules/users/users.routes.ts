import { Router } from 'express';
import { UsersController } from './users.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { adminOnly, adminOrOwner, staffOnly } from '../../shared/middleware/authorize';
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
// RUTAS DE STAFF (Admin, Recepcion, Groomer)
// ============================================

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

// Estadísticas de usuarios
router.get(
  '/stats',
  authenticate,
  adminOnly,
  UsersController.getUserStats
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