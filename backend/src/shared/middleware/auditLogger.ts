import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { logger } from '../../config/logger';

/**
 * Middleware para registrar auditoría de acciones críticas
 */
export const auditLog = (accion: string, tabla: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const originalJson = res.json.bind(res);
    
    res.json = function (body: any) {
      // Solo registrar si la operación fue exitosa (2xx)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const registroId = req.params.id ? parseInt(req.params.id) : body?.id;
        
        prisma.auditLog.create({
          data: {
            tablaAfectada: tabla,
            registroId,
            accion,
            usuarioId: req.user?.userId,
            datosNuevos: body,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'] || '',
          },
        }).catch((error) => {
          logger.error('Error al crear registro de auditoría:', error);
        });
      }
      
      return originalJson(body);
    };
    
    next();
  };
};