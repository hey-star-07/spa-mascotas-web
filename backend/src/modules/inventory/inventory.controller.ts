import { Request, Response, NextFunction } from 'express';
import { InventoryService } from './inventory.service';
import prisma from '../../config/database';

export class InventoryController {
  // GET /api/inventory/productos (ACTUALIZADO - acepta filtro tipo)
  static async getProductos(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, tipo, categoriaId, bajoStock } = req.query as any;
      const productos = await InventoryService.getAllProductos({
        search,
        tipo,
        categoriaId: categoriaId ? parseInt(categoriaId) : undefined,
        // req.query siempre llega como string — convertir explicitamente a booleano
        bajoStock: bajoStock === 'true' || bajoStock === true,
      });
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
      const { cantidad, tipo, motivo } = req.body;
      const varianteId = parseInt(req.params.id);
      
      // 👇 Validar que cantidad sea positiva para entrada
      const cantidadAbsoluta = Math.abs(parseInt(cantidad) || 0);
      
      if (cantidadAbsoluta <= 0) {
        return res.status(400).json({ status: 'error', message: 'Cantidad debe ser mayor a 0' });
      }

      const variante = await prisma.varianteProducto.findUnique({ where: { id: varianteId } });
      if (!variante) {
        return res.status(404).json({ status: 'error', message: 'Variante no encontrada' });
      }

      // 👇 Para entrada/salida
      let nuevoStock: number;
      if (tipo === 'entrada' || tipo === 'devolucion' || tipo === 'Reabastecimiento') {
        nuevoStock = variante.stockAdicional + cantidadAbsoluta;
      } else if (tipo === 'salida' || tipo === 'merma') {
        nuevoStock = Math.max(0, variante.stockAdicional - cantidadAbsoluta);
      } else {
        // Por defecto: sumar (el frontend envía "Reabastecimiento" o similar)
        nuevoStock = variante.stockAdicional + cantidadAbsoluta;
      }

      const updated = await prisma.varianteProducto.update({
        where: { id: varianteId },
        data: { stockAdicional: nuevoStock },
      });

      // Registrar en auditoría
      await prisma.auditLog.create({
        data: {
          tablaAfectada: 'variantes_producto',
          registroId: varianteId,
          accion: tipo === 'entrada' || tipo === 'Reabastecimiento' ? 'STOCK_ENTRADA' : 'STOCK_SALIDA',
          usuarioId: req.user!.userId,
          datosAntiguos: { stockAnterior: variante.stockAdicional },
          datosNuevos: { stockNuevo: nuevoStock, cantidad: cantidadAbsoluta, motivo: motivo || 'Reabastecimiento' },
        },
      });

      res.status(200).json({
        status: 'success',
        data: updated,
        message: `Stock actualizado: ${variante.stockAdicional} → ${nuevoStock} (+${cantidadAbsoluta})`,
      });
    } catch (error) {
      next(error);
    }
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

  // GET /api/inventory/insumos-servicio/:servicioId
  static async getInsumosServicio(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await InventoryService.getInsumosSugeridosPorServicio(parseInt(req.params.servicioId));
      res.status(200).json({ status: 'success', data });
    } catch (error) { next(error); }
  }

  // POST /api/inventory/insumos-servicio/:servicioId
  static async configurarInsumosServicio(req: Request, res: Response, next: NextFunction) {
    try {
      const { insumos } = req.body;
      if (!insumos || !Array.isArray(insumos)) {
        return res.status(400).json({ status: 'error', message: 'Lista de insumos requerida' });
      }
      const data = await InventoryService.configurarInsumosServicio(parseInt(req.params.servicioId), insumos);
      res.status(201).json({ status: 'success', data, message: `${insumos.length} insumo(s) configurado(s)` });
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

/**
 * GET /api/inventory/alertas-consumo
 * Alertas de alto consumo por groomer
 */
  static async getAlertasConsumo(req: Request, res: Response, next: NextFunction) {
    try {
      const { desde, hasta } = req.query;
      const whereConsumo: any = {};

      if (desde || hasta) {
        whereConsumo.createdAt = {};
        if (desde) whereConsumo.createdAt.gte = new Date(desde as string);
        if (hasta) whereConsumo.createdAt.lte = new Date(hasta as string);
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

      // Agrupar por producto y groomer para detectar consumo elevado
      const porGroomerYProducto: Record<string, any> = {};
      
      for (const c of consumos) {
        const groomerName = c.fichaGrooming?.cita?.groomer?.usuario?.nombre || 'Desconocido';
        const productoName = c.producto.nombre;
        const key = `${groomerName}|${productoName}`;
        
        if (!porGroomerYProducto[key]) {
          porGroomerYProducto[key] = {
            groomer: groomerName,
            producto: productoName,
            cantidadTotal: 0,
            vecesUsado: 0,
          };
        }
        porGroomerYProducto[key].cantidadTotal += Number(c.cantidad);
        porGroomerYProducto[key].vecesUsado++;
      }

      // Filtrar los que tienen consumo elevado (más de 5 usos o más de 10 unidades)
      const alertas = Object.values(porGroomerYProducto)
        .filter((a: any) => a.vecesUsado >= 5 || a.cantidadTotal >= 10)
        .sort((a: any, b: any) => b.cantidadTotal - a.cantidadTotal);

      res.status(200).json({
        status: 'success',
        data: alertas,
      });
    } catch (error) {
      next(error);
    }
  }

/**
 * GET /api/inventory/recomendaciones-reabastecimiento
 * Productos que necesitan reabastecimiento urgente
 */
  static async getRecomendacionesReabastecimiento(req: Request, res: Response, next: NextFunction) {
    try {
      const productos = await prisma.producto.findMany({
        include: { variantes: true },
      });

      const recomendaciones = productos
        .map(p => {
          const stockTotal = p.variantes.reduce((sum, v) => sum + v.stockAdicional, 0);
          const porcentaje = (stockTotal / Math.max(p.stockMinimo, 1)) * 100;
          let urgencia = 'Baja';
          let mensaje = '';
          
          if (stockTotal === 0) {
            urgencia = 'Crítica';
            mensaje = 'AGOTADO - Comprar inmediatamente';
          } else if (stockTotal <= p.stockMinimo * 0.5) {
            urgencia = 'Alta';
            mensaje = `Stock muy bajo (${stockTotal} uds). Comprar esta semana.`;
          } else if (stockTotal <= p.stockMinimo) {
            urgencia = 'Media';
            mensaje = `Stock bajo (${stockTotal} uds). Planificar compra.`;
          }

          return {
            id: p.id,
            nombre: p.nombre,
            sku: p.sku,
            stockActual: stockTotal,
            stockMinimo: p.stockMinimo,
            porcentaje,
            urgencia,
            mensaje,
          };
        })
        .filter(r => r.urgencia !== 'Baja')
        .sort((a, b) => a.porcentaje - b.porcentaje);

      res.status(200).json({
        status: 'success',
        data: recomendaciones,
      });
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // INSUMOS ASIGNADOS - PASO 1 AL 5
  // ============================================

  // GET /api/inventory/insumos-sugeridos/:servicioId
  static async getInsumosSugeridos(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await InventoryService.getInsumosSugeridos(parseInt(req.params.servicioId));
      res.status(200).json({ status: 'success', data });
    } catch (error) { next(error); }
  }

  // POST /api/inventory/asignar-insumos
  static async asignarInsumos(req: Request, res: Response, next: NextFunction) {
    try {
      const { citaId, insumos } = req.body;
      if (!citaId || !insumos || !Array.isArray(insumos) || insumos.length === 0) {
        return res.status(400).json({ status: 'error', message: 'Datos inválidos' });
      }
      const data = await InventoryService.asignarInsumos(citaId, insumos, req.user!.userId);
      res.status(201).json({ status: 'success', data, message: `${insumos.length} insumo(s) asignado(s)` });
    } catch (error) { next(error); }
  }

  // GET /api/inventory/insumos-asignados/:citaId
  static async getInsumosAsignados(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await InventoryService.getInsumosAsignados(parseInt(req.params.citaId));
      res.status(200).json({ status: 'success', data });
    } catch (error) { next(error); }
  }

  // PUT /api/inventory/confirmar-insumo/:id
  static async confirmarRecepcion(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await InventoryService.confirmarRecepcionInsumo(parseInt(req.params.id), req.user!.userId);
      res.status(200).json({ status: 'success', data, message: 'Recepción confirmada' });
    } catch (error) { next(error); }
  }

  // PUT /api/inventory/registrar-uso/:id
  static async registrarUso(req: Request, res: Response, next: NextFunction) {
    try {
      const { estado, cantidadUsada, observacion } = req.body;
      if (!['usado', 'devuelto', 'merma'].includes(estado)) {
        return res.status(400).json({ status: 'error', message: 'Estado inválido. Debe ser: usado, devuelto o merma' });
      }
      const data = await InventoryService.registrarUsoInsumo(parseInt(req.params.id), { estado, cantidadUsada, observacion });
      res.status(200).json({ status: 'success', data, message: `Insumo marcado como: ${estado}` });
    } catch (error) { next(error); }
  }

  // GET /api/inventory/verificar-insumos/:citaId
  static async verificarInsumos(req: Request, res: Response, next: NextFunction) {
    try {
      const citaId = parseInt(req.params.citaId);
      const [confirmados, conDestino] = await Promise.all([
        InventoryService.verificarInsumosConfirmados(citaId),
        InventoryService.verificarInsumosConDestino(citaId),
      ]);
      res.status(200).json({ status: 'success', data: { todosConfirmados: confirmados, todosConDestino: conDestino } });
    } catch (error) { next(error); }
  }

  // GET /api/inventory/catalogo-tienda
  static async getCatalogoTienda(req: Request, res: Response, next: NextFunction) {
    try {
      const productos = await InventoryService.getCatalogoTienda(req.query as any);
      res.status(200).json({ status: 'success', data: productos });
    } catch (error) { next(error); }
  }

  // GET /api/inventory/insumos-tecnicos
  static async getInsumosTecnicos(req: Request, res: Response, next: NextFunction) {
    try {
      const productos = await InventoryService.getInsumosTecnicos(req.query as any);
      res.status(200).json({ status: 'success', data: productos });
    } catch (error) { next(error); }
  }

  // GET /api/inventory/log-completo
  static async getLogCompleto(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await InventoryService.getLogCompleto(req.query as any);
      res.status(200).json({ status: 'success', data });
    } catch (error) { next(error); }
  }
  

  // GET /api/inventory/categorias
  static async getCategorias(req: Request, res: Response, next: NextFunction) {
    try {
      const categorias = await InventoryService.getCategorias();
      res.status(200).json({ status: 'success', data: categorias });
    } catch (error) { next(error); }
  }

  // POST /api/inventory/categorias
  static async createCategoria(req: Request, res: Response, next: NextFunction) {
    try {
      const { nombre, descripcion } = req.body;
      if (!nombre?.trim()) {
        return res.status(400).json({ status: 'error', message: 'El nombre es requerido' });
      }
      const categoria = await InventoryService.createCategoria({ nombre, descripcion });
      res.status(201).json({ status: 'success', data: categoria });
    } catch (error) { next(error); }
  }
  // GET /api/inventory/alertas/tienda
  static async getAlertasTienda(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await InventoryService.getAlertasTienda();
      res.status(200).json({ status: 'success', data, total: data.length });
    } catch (error) { next(error); }
  }

  // GET /api/inventory/alertas/insumos
  static async getAlertasInsumos(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await InventoryService.getAlertasInsumos();
      res.status(200).json({ status: 'success', data, total: data.length });
    } catch (error) { next(error); }
  }
}