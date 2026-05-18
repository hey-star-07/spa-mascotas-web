import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';

export class AuditLogsController {
  static async getLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, accion, page = '1', limit = '20' } = req.query as any;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where: any = {};

      if (accion) {
        where.accion = accion;
      }

      if (search) {
        where.OR = [
          { ipAddress: { contains: search, mode: 'insensitive' } },
          { userAgent: { contains: search, mode: 'insensitive' } },
          { tablaAfectada: { contains: search, mode: 'insensitive' } },
          {
            usuario: {
              OR: [
                { nombre: { contains: search, mode: 'insensitive' } },
                { apellido: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
              ],
            },
          },
        ];
      }

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          include: {
            usuario: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                rol: true,
                email: true,
              },
            },
          },
          orderBy: { fechaAccion: 'desc' },
          skip,
          take: parseInt(limit),
        }),
        prisma.auditLog.count({ where }),
      ]);

      res.status(200).json({
        status: 'success',
        data: {
          logs,
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getLogStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const [total24h, total7d, total, failedLogins, lockedAccounts] = await Promise.all([
        prisma.auditLog.count({ where: { fechaAccion: { gte: last24h } } }),
        prisma.auditLog.count({ where: { fechaAccion: { gte: last7d } } }),
        prisma.auditLog.count(),
        prisma.auditLog.count({
          where: { accion: 'LOGIN_FAILED', fechaAccion: { gte: last24h } },
        }),
        prisma.usuario.count({
          where: { lockedUntil: { gte: now }, activo: true },
        }),
      ]);

      const accionStats = await prisma.auditLog.groupBy({
        by: ['accion'],
        _count: { accion: true },
        where: { fechaAccion: { gte: last7d } },
        orderBy: { _count: { accion: 'desc' } },
        take: 10,
      });

      res.status(200).json({
        status: 'success',
        data: {
          total24h,
          total7d,
          total,
          failedLogins24h: failedLogins,
          lockedAccounts,
          topActions: accionStats.map((a) => ({
            accion: a.accion,
            count: a._count.accion,
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  }
}