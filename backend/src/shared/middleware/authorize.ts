import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { ErrorCodes } from '../errors/errorCodes';

type Rol = 'Admin' | 'Recepcion' | 'Groomer' | 'Cliente';

/**
 * Middleware de autorización basado en roles (RBAC)
 * @param roles - Array de roles permitidos para acceder a la ruta
 */
export const authorize = (...roles: Rol[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Verificar que el usuario esté autenticado
      if (!req.user) {
        throw new AppError(ErrorCodes.INVALID_TOKEN, 401, 'No autenticado');
      }

      // Verificar que el rol del usuario esté en los roles permitidos
      if (!roles.includes(req.user.rol as Rol)) {
        throw new AppError(
          ErrorCodes.INSUFFICIENT_PERMISSIONS,
          403,
          'No tienes permisos para realizar esta acción'
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware específico para Admin
 */
export const adminOnly = authorize('Admin');

/**
 * Middleware para personal (Admin, Recepcion, Groomer)
 */
export const staffOnly = authorize('Admin', 'Recepcion', 'Groomer');

/**
 * Middleware para cliente autenticado
 */
export const clientOnly = authorize('Cliente');

/**
 * Middleware para Admin o el propio usuario
 */
export const adminOrOwner = (req: Request, res: Response, next: NextFunction): void => {
  try {
    if (!req.user) {
      throw new AppError(ErrorCodes.INVALID_TOKEN, 401, 'No autenticado');
    }

    const userId = parseInt(req.params.id);
    
    // Es admin o es el propio usuario
    if (req.user.rol === 'Admin' || req.user.userId === userId) {
      return next();
    }

    throw new AppError(ErrorCodes.INSUFFICIENT_PERMISSIONS, 403);
  } catch (error) {
    next(error);
  }
};