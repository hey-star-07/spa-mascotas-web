import prisma from '../../config/database';
import { AppError } from '../../shared/errors/AppError';
import { ErrorCodes } from '../../shared/errors/errorCodes';
import { CreateProductoDTO, UpdateProductoDTO, CreateVarianteDTO, MovimientoInventario } from './inventory.types';

export class InventoryService {
  // ============================================
  // PRODUCTOS
  // ============================================

  // Obtener todos los productos
  static async getProductos(params?: { categoriaId?: number; search?: string; bajoStock?: boolean }) {
    const where: any = {};

    if (params?.categoriaId) where.categoriaId = params.categoriaId;
    if (params?.search) {
      where.OR = [
        { nombre: { contains: params.search, mode: 'insensitive' } },
        { sku: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const productos = await prisma.producto.findMany({
      where,
      include: {
        categoria: { select: { id: true, nombre: true } },
        variantes: true,
      },
      orderBy: { nombre: 'asc' },
    });

    // Si se pide solo bajo stock
    if (params?.bajoStock) {
      return productos.filter(p => {
        const stockVariantes = p.variantes.reduce((sum, v) => sum + v.stockAdicional, 0);
        return stockVariantes <= p.stockMinimo;
      });
    }

    return productos;
  }

  // Obtener producto por ID
  static async getProductoById(id: number) {
    const producto = await prisma.producto.findUnique({
      where: { id },
      include: {
        categoria: true,
        variantes: true,
        consumoInsumos: {
          include: {
            fichaGrooming: {
              include: {
                cita: {
                  include: {
                    groomer: { include: { usuario: { select: { nombre: true } } } },
                  },
                },
              },
            },
          },
          take: 20,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!producto) throw new AppError(ErrorCodes.USER_NOT_FOUND, 404, 'Producto no encontrado');
    return producto;
  }

  // Crear producto
  static async createProducto(data: CreateProductoDTO) {
    const existing = await prisma.producto.findUnique({ where: { sku: data.sku } });
    if (existing) throw new AppError(ErrorCodes.VALIDATION_ERROR, 422, 'SKU ya existe');

    const producto = await prisma.producto.create({
      data: {
        sku: data.sku,
        nombre: data.nombre,
        descripcion: data.descripcion,
        categoriaId: data.categoriaId,
        precioBase: data.precioBase,
        stockMinimo: data.stockMinimo || 5,
        imagenUrl: data.imagenUrl || null,  
      },
    });

    // Crear variante por defecto
    await prisma.varianteProducto.create({
      data: {
        productoId: producto.id,
        atributo: 'Unico',
        valor: 'Estandar',
        skuVariante: `${data.sku}-STD`,
        precioExtra: 0,
        stockAdicional: data.stockMinimo || 5,
      },
    });

    return producto;
  }

  // Actualizar producto
  static async updateProducto(id: number, data: UpdateProductoDTO) {
    return prisma.producto.update({ where: { id }, data });
  }

  // ============================================
  // VARIANTES
  // ============================================

  // Crear variante
  static async createVariante(data: CreateVarianteDTO) {
    const existing = await prisma.varianteProducto.findUnique({ where: { skuVariante: data.skuVariante } });
    if (existing) throw new AppError(ErrorCodes.VALIDATION_ERROR, 422, 'SKU de variante ya existe');

    return prisma.varianteProducto.create({ data });
  }

  // Actualizar stock de variante
  static async updateStockVariante(id: number, cantidad: number) {
    return prisma.varianteProducto.update({
      where: { id },
      data: { stockAdicional: { decrement: Math.abs(cantidad) } },
    });
  }

  // ============================================
  // ALERTAS DE INVENTARIO
  // ============================================

  // Obtener productos con bajo stock
  static async getAlertasBajoStock() {
    const productos = await prisma.producto.findMany({
      include: { variantes: true },
    });

    return productos.filter(p => {
      const stockTotal = p.variantes.reduce((sum, v) => sum + v.stockAdicional, 0);
      return stockTotal <= p.stockMinimo;
    }).map(p => ({
      id: p.id,
      nombre: p.nombre,
      sku: p.sku,
      stockActual: p.variantes.reduce((sum, v) => sum + v.stockAdicional, 0),
      stockMinimo: p.stockMinimo,
      variantes: p.variantes.map(v => ({
        id: v.id,
        atributo: v.atributo,
        valor: v.valor,
        stockAdicional: v.stockAdicional,
      })),
    }));
  }

  // Obtener consumo por groomer
  static async getConsumoPorGroomer(groomerId?: number, desde?: string, hasta?: string) {
    const where: any = {};

    if (groomerId) {
      where.fichaGrooming = {
        cita: { groomerId },
      };
    }

    if (desde || hasta) {
      where.createdAt = {};
      if (desde) where.createdAt.gte = new Date(desde);
      if (hasta) where.createdAt.lte = new Date(hasta);
    }

    return prisma.consumoInsumo.findMany({
      where,
      include: {
        producto: { select: { id: true, nombre: true, sku: true } },
        fichaGrooming: {
          include: {
            cita: {
              include: {
                groomer: { include: { usuario: { select: { nombre: true, apellido: true } } } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ============================================
  // MOVIMIENTOS DE INVENTARIO
  // ============================================

  // Registrar movimiento
  static async registrarMovimiento(data: MovimientoInventario) {
    // Actualizar stock según tipo
    const factor = data.tipo === 'entrada' || data.tipo === 'devolucion' ? 1 : -1;

    if (data.varianteId) {
      await prisma.varianteProducto.update({
        where: { id: data.varianteId },
        data: { stockAdicional: { increment: data.cantidad * factor } },
      });
    }

    // Registrar en consumo de insumos si es salida para grooming
    if (data.fichaGroomingId && data.tipo === 'salida') {
      await prisma.consumoInsumo.create({
        data: {
          fichaGroomingId: data.fichaGroomingId,
          productoId: data.productoId,
          varianteId: data.varianteId,
          cantidad: data.cantidad,
        },
      });
    }

    return { message: `Movimiento de ${data.tipo} registrado exitosamente` };
  }

  // ============================================
  // REPORTES DE INVENTARIO
  // ============================================

  // Resumen de inventario
  static async getResumenInventario() {
    const [totalProductos, totalVariantes, productosBajoStock, consumoReciente] = await Promise.all([
      prisma.producto.count(),
      prisma.varianteProducto.count(),
      this.getAlertasBajoStock(),
      prisma.consumoInsumo.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          producto: { select: { nombre: true } },
          fichaGrooming: {
            include: {
              cita: { include: { groomer: { include: { usuario: { select: { nombre: true } } } } } },
            },
          },
        },
      }),
    ]);

    return {
      totalProductos,
      totalVariantes,
      productosBajoStock: productosBajoStock.length,
      alertas: productosBajoStock.slice(0, 5),
      consumoReciente,
    };
  }
}