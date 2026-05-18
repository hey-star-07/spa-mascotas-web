import { Request, Response, NextFunction } from 'express';
import { TokenUtils } from '../../shared/utils/tokens';
import { AppError } from '../../shared/errors/AppError';
import { ErrorCodes } from '../../shared/errors/errorCodes';

/**
 * Middleware para verificar refresh token
 */
export const validateRefreshToken = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      throw new AppError(ErrorCodes.INVALID_TOKEN, 400, 'Refresh token requerido');
    }

    const decoded = TokenUtils.verifyRefreshToken(refreshToken);
    req.user = decoded;
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware para verificar que el usuario esté verificando su propio email
 */
export const verifyEmailOwnership = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { token } = req.params;
    const decoded = TokenUtils.verifyEmailToken(token);
    
    // Si hay usuario autenticado, verificar que sea el mismo
    if (req.user && req.user.userId !== decoded.userId) {
      throw new AppError(ErrorCodes.INSUFFICIENT_PERMISSIONS, 403);
    }
    
    next();
  } catch (error) {
    next(error);
  }
};