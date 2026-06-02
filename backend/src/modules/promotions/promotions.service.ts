import prisma from '../../config/database';
import { AppError } from '../../shared/errors/AppError';
import { ErrorCodes } from '../../shared/errors/errorCodes';
import { CreatePromocionDTO, AplicarPromocionDTO } from './promotions.types';

export class PromotionsService {
  // Obtener todas las promociones
  static async getAll(onlyActive: boolean = false) {
    const where: any = {};
    if (onlyActive) {
      where.activo = true;
      where.fechaInicio = { lte: new Date() };
      where.fechaFin = { gte: new Date() };
    }

    return prisma.promocion.findMany({
      where,
      include: {
        producto: { select: { id: true, nombre: true } },
        servicio: { select: { id: true, nombre: true } },
        cliente: { select: { id: true, usuario: { select: { nombre: true, apellido: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Crear promoción
  static async create(data: CreatePromocionDTO) {
    if (new Date(data.fechaFin) <= new Date(data.fechaInicio)) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 422, 'La fecha de fin debe ser posterior a la de inicio');
    }

    return prisma.promocion.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        tipo: data.tipo,
        valor: data.valor,
        fechaInicio: new Date(data.fechaInicio),
        fechaFin: new Date(data.fechaFin),
        productoId: data.productoId || null,
        servicioId: data.servicioId || null,
        clienteId: data.clienteId || null,
        codigoCupon: data.codigoCupon || null,
        activo: data.activo !== false,
      },
    });
  }

  // Aplicar cupón
  static async aplicarCupon(data: AplicarPromocionDTO) {
    const promocion = await prisma.promocion.findFirst({
      where: {
        codigoCupon: data.codigoCupon,
        activo: true,
        fechaInicio: { lte: new Date() },
        fechaFin: { gte: new Date() },
      },
    });

    if (!promocion) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 422, 'Cupón inválido o expirado');
    }

    let descuento = 0;

    if (promocion.tipo === 'porcentaje') {
      descuento = data.subtotal * (promocion.valor / 100);
    } else {
      descuento = Math.min(promocion.valor, data.subtotal);
    }

    return {
      promocion: {
        id: promocion.id,
        nombre: promocion.nombre,
        tipo: promocion.tipo,
        valor: promocion.valor,
      },
      subtotalOriginal: data.subtotal,
      descuento,
      totalConDescuento: data.subtotal - descuento,
    };
  }

  // Actualizar promoción
  static async update(id: number, data: Partial<CreatePromocionDTO>) {
    return prisma.promocion.update({ where: { id }, data });
  }

  // Eliminar promoción
  static async delete(id: number) {
    return prisma.promocion.delete({ where: { id } });
  }
}