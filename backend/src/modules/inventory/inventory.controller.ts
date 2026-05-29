import { Request, Response, NextFunction } from 'express';
import { InventoryService } from './inventory.service';
import prisma from '../../config/database';

export class InventoryController {
  // GET /api/inventory/productos
  static async getProductos(req: Request, res: Response, next: NextFunction) {
    try {
      const productos = await InventoryService.getProductos(req.query as any);
      res.status(200).json({ status: 'success', data: productos, total: productos.length });
    } catch (error) { next(error); }
  }

  // GET /api/inventory/productos/:id
  static async getProductoById(req: Request, res: Response, next: NextFunction) {
    try {
      const producto = await InventoryService.getProductoById(parseInt(req.params.id));
      res.status(200).json({ status: 'success', data: producto });
    } catch (error) { next(error); }
  }

  // POST /api/inventory/productos
  static async createProducto(req: Request, res: Response, next: NextFunction) {
    try {
      const producto = await InventoryService.createProducto(req.body);
      res.status(201).json({ status: 'success', data: producto });
    } catch (error) { next(error); }
  }

  // PUT /api/inventory/productos/:id
  static async updateProducto(req: Request, res: Response, next: NextFunction) {
    try {
      const producto = await InventoryService.updateProducto(parseInt(req.params.id), req.body);
      res.status(200).json({ status: 'success', data: producto });
    } catch (error) { next(error); }
  }

  // POST /api/inventory/variantes
  static async createVariante(req: Request, res: Response, next: NextFunction) {
    try {
      const variante = await InventoryService.createVariante(req.body);
      res.status(201).json({ status: 'success', data: variante });
    } catch (error) { next(error); }
  }

  // PUT /api/inventory/variantes/:id/stock
  static async updateStock(req: Request, res: Response, next: NextFunction) {
    try {
      const { cantidad } = req.body;
      const variante = await InventoryService.updateStockVariante(parseInt(req.params.id), cantidad);
      res.status(200).json({ status: 'success', data: variante });
    } catch (error) { next(error); }
  }

  // GET /api/inventory/alertas
  static async getAlertas(req: Request, res: Response, next: NextFunction) {
    try {
      const alertas = await InventoryService.getAlertasBajoStock();
      res.status(200).json({ status: 'success', data: alertas, total: alertas.length });
    } catch (error) { next(error); }
  }

  // GET /api/inventory/resumen
  static async getResumen(req: Request, res: Response, next: NextFunction) {
    try {
      const resumen = await InventoryService.getResumenInventario();
      res.status(200).json({ status: 'success', data: resumen });
    } catch (error) { next(error); }
  }

  // POST /api/inventory/movimientos
  static async registrarMovimiento(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await InventoryService.registrarMovimiento(req.body);
      res.status(201).json({ status: 'success', ...result });
    } catch (error) { next(error); }
  }

  // GET /api/inventory/consumo
  static async getConsumo(req: Request, res: Response, next: NextFunction) {
    try {
      const { groomerId, desde, hasta } = req.query;
      const consumo = await InventoryService.getConsumoPorGroomer(
        groomerId ? parseInt(groomerId as string) : undefined,
        desde as string,
        hasta as string
      );
      res.status(200).json({ status: 'success', data: consumo });
    } catch (error) { next(error); }
  }

  /**
 * GET /api/inventory/log-insumos
 * Log completo de consumo de insumos por groomer
 */
static async getLogInsumos(req: Request, res: Response, next: NextFunction) {
  try {
    const { groomerId, desde, hasta, page = '1', limit = '20' } = req.query as any;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: any = {};

    if (groomerId) {
      where.fichaGrooming = {
        cita: { groomerId: parseInt(groomerId) },
      };
    }

    if (desde || hasta) {
      where.createdAt = {};
      if (desde) where.createdAt.gte = new Date(desde);
      if (hasta) where.createdAt.lte = new Date(hasta);
    }

    const [consumos, total] = await Promise.all([
      prisma.consumoInsumo.findMany({
        where,
        include: {
          producto: { select: { id: true, nombre: true, sku: true } },
          variante: { select: { id: true, atributo: true, valor: true } },
          fichaGrooming: {
            select: {
              id: true,
              fechaCierre: true,
              cita: {
                select: {
                  id: true,
                  fechaHoraInicio: true,
                  mascota: { select: { nombre: true } },
                  servicio: { select: { nombre: true } },
                  groomer: {
                    select: {
                      id: true,
                      usuario: { select: { id: true, nombre: true, apellido: true } },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.consumoInsumo.count({ where }),
    ]);

    // Calcular resumen
    const resumen = {
      totalConsumos: total,
      usados: consumos.filter(c => !c.devuelto && !c.merma).length,
      devueltos: consumos.filter(c => c.devuelto).length,
      mermas: consumos.filter(c => c.merma).length,
      cantidadTotalUsada: consumos
        .filter(c => !c.devuelto)
        .reduce((sum, c) => sum + Number(c.cantidad), 0),
      cantidadDevuelta: consumos
        .filter(c => c.devuelto)
        .reduce((sum, c) => sum + Number(c.cantidad), 0),
    };

    res.status(200).json({
      status: 'success',
      data: {
        consumos,
        resumen,
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

/**
 * GET /api/inventory/log-insumos/resumen
 * Resumen agrupado por groomer
 */
static async getResumenPorGroomer(req: Request, res: Response, next: NextFunction) {
  try {
    const { desde, hasta } = req.query as any;
    const whereConsumo: any = {};

    if (desde || hasta) {
      whereConsumo.createdAt = {};
      if (desde) whereConsumo.createdAt.gte = new Date(desde);
      if (hasta) whereConsumo.createdAt.lte = new Date(hasta);
    }

    const consumos = await prisma.consumoInsumo.findMany({
      where: whereConsumo,
      include: {
        producto: { select: { nombre: true } },
        fichaGrooming: {
          select: {
            cita: {
              select: {
                groomer: {
                  select: {
                    id: true,
                    usuario: { select: { nombre: true, apellido: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Agrupar por groomer
    const porGroomer: Record<number, any> = {};
    for (const c of consumos) {
      const groomer = c.fichaGrooming?.cita?.groomer;
      if (!groomer) continue;

      const key = groomer.id;
      if (!porGroomer[key]) {
        porGroomer[key] = {
          groomerId: key,
          nombre: groomer.usuario.nombre,
          apellido: groomer.usuario.apellido,
          totalConsumos: 0,
          usados: 0,
          devueltos: 0,
          mermas: 0,
          cantidadUsada: 0,
          cantidadDevuelta: 0,
          productos: {} as Record<string, number>,
        };
      }

      porGroomer[key].totalConsumos++;
      if (c.devuelto) {
        porGroomer[key].devueltos++;
        porGroomer[key].cantidadDevuelta += Number(c.cantidad);
      } else if (c.merma) {
        porGroomer[key].mermas++;
        porGroomer[key].cantidadUsada += Number(c.cantidad);
      } else {
        porGroomer[key].usados++;
        porGroomer[key].cantidadUsada += Number(c.cantidad);
      }

      const prodNombre = c.producto.nombre;
      porGroomer[key].productos[prodNombre] = (porGroomer[key].productos[prodNombre] || 0) + Number(c.cantidad);
    }

    res.status(200).json({
      status: 'success',
      data: Object.values(porGroomer),
    });
  } catch (error) {
    next(error);
  }
}
  
}