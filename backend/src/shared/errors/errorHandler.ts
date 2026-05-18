import { Request, Response, NextFunction } from 'express';
import { AppError } from './AppError';
import { ErrorCodes } from './errorCodes';
import { logger } from '../../config/logger';
import { ZodError } from 'zod';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log del error
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    user: (req as any).user?.id,
  });

  // Error de validación de Zod
  if (err instanceof ZodError) {
    return res.status(422).json({
      status: 'error',
      code: ErrorCodes.VALIDATION_ERROR,
      message: 'Error de validación',
      errors: err.errors.map((e) => ({
        campo: e.path.join('.'),
        mensaje: e.message,
      })),
    });
  }

  // Error personalizado de la aplicación
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(err.toJSON());
  }

  // Error de Prisma
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    if (prismaError.code === 'P2002') {
      return res.status(409).json({
        status: 'error',
        code: 'DUPLICATE_ENTRY',
        message: 'Ya existe un registro con estos datos',
      });
    }
  }

  // Error de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'error',
      code: ErrorCodes.INVALID_TOKEN,
      message: 'Token inválido',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'error',
      code: ErrorCodes.TOKEN_EXPIRED,
      message: 'Token expirado',
    });
  }

  // Error desconocido
  return res.status(500).json({
    status: 'error',
    code: ErrorCodes.INTERNAL_SERVER_ERROR,
    message: process.env.NODE_ENV === 'production'
      ? 'Error interno del servidor'
      : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};