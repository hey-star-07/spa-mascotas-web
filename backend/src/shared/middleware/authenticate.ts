import { Request, Response, NextFunction } from 'express';
import { TokenUtils } from '../utils/tokens';
import { AppError } from '../errors/AppError';
import { ErrorCodes } from '../errors/errorCodes';

/**
 * Middleware de autenticación - Verifica que el usuario tenga un JWT válido
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Obtener token del header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      throw new AppError(ErrorCodes.INVALID_TOKEN, 401, 'Token no proporcionado');
    }

    // Formato: "Bearer <token>"
    const parts = authHeader.split(' ');
    
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new AppError(ErrorCodes.INVALID_TOKEN, 401, 'Formato de token inválido');
    }

    const token = parts[1];

    // Verificar token
    const decoded = TokenUtils.verifyAccessToken(token);
    
    // Agregar datos del usuario al request
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError(ErrorCodes.INVALID_TOKEN, 401));
    }
  }
};