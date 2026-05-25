import { Request, Response, NextFunction } from 'express';
import { UsersService } from './users.service';
import { logger } from '../../config/logger';
import prisma from '../../config/database';

export class UsersController {
  /**
   * GET /api/users
   * Listar usuarios (paginado, filtrado)
   */
  static async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, rol, activo, search } = req.query as any;

      const result = await UsersService.getUsers(
        page ? parseInt(page) : 1,
        limit ? parseInt(limit) : 10,
        { rol, activo, search }
      );

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/users/stats
   * Estadísticas de usuarios (solo Admin)
   */
  static async getUserStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await UsersService.getUserStats();

      res.status(200).json({
        status: 'success',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/users/search?q=termino
   * Buscar usuarios
   */
  static async searchUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { q, limit } = req.query as any;

      if (!q || q.length < 2) {
        res.status(400).json({
          status: 'error',
          message: 'El término de búsqueda debe tener al menos 2 caracteres',
        });
        return;
      }

      const users = await UsersService.searchUsers(q, limit ? parseInt(limit) : 10);

      res.status(200).json({
        status: 'success',
        data: users,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/users/:id
   * Obtener usuario por ID
   */
  static async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = parseInt(req.params.id);

      const user = await UsersService.getUserById(userId);

      res.status(200).json({
        status: 'success',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/users/profile
   * Actualizar perfil propio
   */
  static async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { nombre, apellido, telefono } = req.body;

      const user = await UsersService.updateProfile(userId, {
        nombre,
        apellido,
        telefono,
      });

      logger.info(`Usuario ${userId} actualizó su perfil`);

      res.status(200).json({
        status: 'success',
        data: user,
        message: 'Perfil actualizado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/users/:id (Admin)
   * Actualizar usuario como administrador
   */
  static async updateUserAsAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = parseInt(req.params.id);
      const { nombre, apellido, telefono, rol, activo } = req.body;

      const user = await UsersService.updateUserAsAdmin(userId, {
        nombre,
        apellido,
        telefono,
        rol,
        activo,
      });

      logger.info(`Admin actualizó usuario ${userId}`);

      res.status(200).json({
        status: 'success',
        data: user,
        message: 'Usuario actualizado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/users/:id/deactivate
   * Desactivar usuario (soft delete)
   */
  static async deactivateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = parseInt(req.params.id);

      const result = await UsersService.deactivateUser(userId);

      res.status(200).json({
        status: 'success',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/users/:id/reactivate
   * Reactivar usuario
   */
  static async reactivateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = parseInt(req.params.id);

      const result = await UsersService.reactivateUser(userId);

      res.status(200).json({
        status: 'success',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/users/:id
   * Eliminar usuario permanentemente (solo si no tiene transacciones)
   */
  static async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = parseInt(req.params.id);

      const result = await UsersService.deleteUser(userId);

      res.status(200).json({
        status: 'success',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

    /**
   * GET /api/users/groomers
   * Obtener lista de groomers activos (público para recepción)
   */
  static async getGroomers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const groomers = await prisma.usuario.findMany({
        where: { rol: 'Groomer', activo: true },
        select: {
          id: true,           // ID del usuario
          email: true,
          nombre: true,
          apellido: true,
          telefono: true,
          groomer: {
            select: {
              id: true,       // ID del groomer (para disponibilidad)
              especialidad: true,
              capacidadSimultanea: true,
            },
          },
        },
        orderBy: { nombre: 'asc' },
      });

      // Si el usuario es groomer pero no tiene registro en la tabla groomers, crear uno
      const result = await Promise.all(groomers.map(async (u) => {
        if (!u.groomer) {
          // Crear registro en tabla groomers si no existe
          const newGroomer = await prisma.groomer.create({
            data: {
              usuarioId: u.id,
              horarioTrabajo: {},
            },
            select: { id: true, especialidad: true, capacidadSimultanea: true },
          });
          return { ...u, groomer: newGroomer };
        }
        return u;
      }));

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}