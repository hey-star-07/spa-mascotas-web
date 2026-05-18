import prisma from '../../config/database';
import { AppError } from '../../shared/errors/AppError';
import { ErrorCodes } from '../../shared/errors/errorCodes';
import { logger } from '../../config/logger';
import { UpdateUserDTO, UpdateUserAsAdminDTO, UserResponse, UserListResponse } from './users.types';
import { RolUsuario, Prisma } from '@prisma/client';

export class UsersService {
  /**
   * Obtener lista de usuarios (paginado, filtrado)
   */
  static async getUsers(
    page: number = 1,
    limit: number = 10,
    filters?: {
      rol?: RolUsuario;
      activo?: boolean;
      search?: string;
    }
  ): Promise<UserListResponse> {
    const where: Prisma.UsuarioWhereInput = {};

    if (filters?.rol) {
      where.rol = filters.rol;
    }

    if (filters?.activo !== undefined) {
      where.activo = filters.activo;
    }

    if (filters?.search) {
      where.OR = [
        { email: { contains: filters.search, mode: 'insensitive' } },
        { nombre: { contains: filters.search, mode: 'insensitive' } },
        { apellido: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.usuario.findMany({
        where,
        select: {
          id: true,
          email: true,
          nombre: true,
          apellido: true,
          telefono: true,
          rol: true,
          activo: true,
          emailVerificado: true,
          twoFactorEnabled: true,
          ultimoAcceso: true,
          createdAt: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.usuario.count({ where }),
    ]);

    return {
      users: users as UserResponse[],
      total,
      page,
      limit,
    };
  }

  /**
   * Obtener un usuario por ID
   */
  static async getUserById(userId: number): Promise<UserResponse> {
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        telefono: true,
        rol: true,
        activo: true,
        emailVerificado: true,
        twoFactorEnabled: true,
        ultimoAcceso: true,
        createdAt: true,
        cliente: {
          select: {
            direccionFisica: true,
            canalNotificacionPreferido: true,
            mascotas: {
              select: {
                id: true,
                nombre: true,
                especie: true,
                raza: true,
              },
            },
          },
        },
        groomer: {
          select: {
            especialidad: true,
            capacidadSimultanea: true,
            activo: true,
          },
        },
      },
    });

    if (!usuario) {
      throw new AppError(ErrorCodes.USER_NOT_FOUND, 404);
    }

    return usuario as UserResponse;
  }

  /**
   * Actualizar perfil del usuario autenticado
   */
  static async updateProfile(userId: number, data: UpdateUserDTO): Promise<UserResponse> {
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
    });

    if (!usuario) {
      throw new AppError(ErrorCodes.USER_NOT_FOUND, 404);
    }

    const updatedUser = await prisma.usuario.update({
      where: { id: userId },
      data: {
        nombre: data.nombre,
        apellido: data.apellido,
        telefono: data.telefono,
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        telefono: true,
        rol: true,
        activo: true,
        emailVerificado: true,
        twoFactorEnabled: true,
        ultimoAcceso: true,
        createdAt: true,
      },
    });

    logger.info(`Usuario ${userId} actualizó su perfil`);

    return updatedUser as UserResponse;
  }

  /**
   * Actualizar usuario como Admin
   */
  static async updateUserAsAdmin(
    userId: number,
    data: UpdateUserAsAdminDTO
  ): Promise<UserResponse> {
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
    });

    if (!usuario) {
      throw new AppError(ErrorCodes.USER_NOT_FOUND, 404);
    }

    // No permitir cambiar el rol al último Admin
    if (data.rol && data.rol !== 'Admin' && usuario.rol === 'Admin') {
      const adminCount = await prisma.usuario.count({
        where: { rol: 'Admin', activo: true },
      });

      if (adminCount <= 1) {
        throw new AppError(
          ErrorCodes.INSUFFICIENT_PERMISSIONS,
          400,
          'No se puede cambiar el rol del último administrador activo'
        );
      }
    }

    const updatedUser = await prisma.usuario.update({
      where: { id: userId },
      data: {
        nombre: data.nombre,
        apellido: data.apellido,
        telefono: data.telefono,
        rol: data.rol,
        activo: data.activo,
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        telefono: true,
        rol: true,
        activo: true,
        emailVerificado: true,
        twoFactorEnabled: true,
        ultimoAcceso: true,
        createdAt: true,
      },
    });

    logger.info(`Admin actualizó usuario ${userId}`);

    return updatedUser as UserResponse;
  }

  /**
   * Desactivar usuario (soft delete)
   */
  static async deactivateUser(userId: number): Promise<{ message: string }> {
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
    });

    if (!usuario) {
      throw new AppError(ErrorCodes.USER_NOT_FOUND, 404);
    }

    // No permitir desactivar al último Admin
    if (usuario.rol === 'Admin') {
      const adminCount = await prisma.usuario.count({
        where: { rol: 'Admin', activo: true },
      });

      if (adminCount <= 1) {
        throw new AppError(
          ErrorCodes.INSUFFICIENT_PERMISSIONS,
          400,
          'No se puede desactivar al último administrador activo'
        );
      }
    }

    // Desactivar usuario
    await prisma.usuario.update({
      where: { id: userId },
      data: { activo: false },
    });

    // Invalidar todas las sesiones activas
    await prisma.sesionUsuario.updateMany({
      where: {
        usuarioId: userId,
        activa: true,
      },
      data: { activa: false },
    });

    logger.info(`Usuario ${userId} desactivado`);

    return { message: 'Usuario desactivado exitosamente' };
  }

  /**
   * Reactivar usuario
   */
  static async reactivateUser(userId: number): Promise<{ message: string }> {
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
    });

    if (!usuario) {
      throw new AppError(ErrorCodes.USER_NOT_FOUND, 404);
    }

    await prisma.usuario.update({
      where: { id: userId },
      data: { activo: true },
    });

    logger.info(`Usuario ${userId} reactivado`);

    return { message: 'Usuario reactivado exitosamente' };
  }

  /**
   * Eliminar usuario (solo si no tiene transacciones)
   */
  static async deleteUser(userId: number): Promise<{ message: string }> {
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      include: {
        cliente: {
          include: {
            mascotas: {
              include: {
                citas: true,
              },
            },
            pedidos: true,
          },
        },
        groomer: {
          include: {
            citas: true,
          },
        },
      },
    });

    if (!usuario) {
      throw new AppError(ErrorCodes.USER_NOT_FOUND, 404);
    }

    // Verificar si tiene transacciones
    const hasTransactions =
      (usuario.cliente?.mascotas?.length ?? 0) > 0 ||
      (usuario.cliente?.pedidos?.length ?? 0) > 0 ||
      (usuario.groomer?.citas?.length ?? 0) > 0;

    if (hasTransactions) {
      throw new AppError(
        ErrorCodes.INSUFFICIENT_PERMISSIONS,
        400,
        'No se puede eliminar el usuario porque tiene transacciones asociadas. Considere desactivarlo.'
      );
    }

    // Eliminar en cascada (Prisma maneja las relaciones)
    await prisma.usuario.delete({
      where: { id: userId },
    });

    logger.info(`Usuario ${userId} eliminado permanentemente`);

    return { message: 'Usuario eliminado exitosamente' };
  }

  /**
   * Obtener estadísticas de usuarios
   */
  static async getUserStats(): Promise<{
    total: number;
    activos: number;
    porRol: Record<string, number>;
    nuevosUltimos30Dias: number;
  }> {
    const [total, activos, porRol, nuevosUltimos30Dias] = await Promise.all([
      prisma.usuario.count(),
      prisma.usuario.count({ where: { activo: true } }),
      prisma.usuario.groupBy({
        by: ['rol'],
        _count: { rol: true },
      }),
      prisma.usuario.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    const rolesCount: Record<string, number> = {};
    porRol.forEach((item) => {
      rolesCount[item.rol] = item._count.rol;
    });

    return {
      total,
      activos,
      porRol: rolesCount,
      nuevosUltimos30Dias,
    };
  }

  /**
   * Buscar usuarios por término
   */
  static async searchUsers(
    query: string,
    limit: number = 10
  ): Promise<UserResponse[]> {
    const users = await prisma.usuario.findMany({
      where: {
        OR: [
          { email: { contains: query, mode: 'insensitive' } },
          { nombre: { contains: query, mode: 'insensitive' } },
          { apellido: { contains: query, mode: 'insensitive' } },
          { telefono: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        telefono: true,
        rol: true,
        activo: true,
        emailVerificado: true,
        twoFactorEnabled: true,
        ultimoAcceso: true,
        createdAt: true,
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return users as UserResponse[];
  }
}