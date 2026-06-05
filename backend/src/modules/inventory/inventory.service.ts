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

    // Si se pide solo bajo stock — estrictamente menor al mínimo
    if (params?.bajoStock) {
      return productos.filter(p => {
        const stockVariantes = p.variantes.reduce((sum, v) => sum + v.stockAdicional, 0);
        return stockVariantes < p.stockMinimo;
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

    // Crear variante por defecto con el stock INICIAL real (no el mínimo)
    const stockInicial = data.stockInicial ?? data.stockMinimo ?? 5;
    await prisma.varianteProducto.create({
      data: {
        productoId: producto.id,
        atributo: 'Unico',
        valor: 'Estandar',
        skuVariante: `${data.sku}-STD`,
        precioExtra: 0,
        stockAdicional: stockInicial,
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
      // Alerta solo cuando el stock está ESTRICTAMENTE por debajo del mínimo
      return stockTotal < p.stockMinimo;
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

  // ============================================
// INSUMOS ASIGNADOS - FLUJO COMPLETO 5 PASOS
// ============================================

// PASO 1: Obtener insumos sugeridos por servicio
static async getInsumosSugeridos(servicioId: number) {
  // Buscar el servicio para personalizar sugerencias
  const servicio = await prisma.servicio.findUnique({ where: { id: servicioId } });
  
  // Lista base de insumos comunes
  const sugeridos = [
    { nombre: "Shampoo neutro", cantidadSugerida: 100, unidad: "ml" },
    { nombre: "Acondicionador", cantidadSugerida: 50, unidad: "ml" },
    { nombre: "Guantes desechables", cantidadSugerida: 2, unidad: "pares" },
    { nombre: "Perfume", cantidadSugerida: 1, unidad: "dosis" },
    { nombre: "Toallas desechables", cantidadSugerida: 3, unidad: "unidades" },
  ];

  // Buscar productos reales en inventario que coincidan
  const productos = await prisma.producto.findMany({
    where: {
      activo: true,
      OR: sugeridos.map(s => ({ nombre: { contains: s.nombre.split(' ')[0], mode: 'insensitive' as any } })),
    },
    include: { variantes: { where: { stockAdicional: { gt: 0 } } } },
  });

  return {
    servicio: servicio?.nombre || 'Desconocido',
    sugeridos: sugeridos.map(s => {
      const productoMatch = productos.find(p => 
        p.nombre.toLowerCase().includes(s.nombre.toLowerCase().split(' ')[0])
      );
      return {
        ...s,
        productoId: productoMatch?.id || null,
        varianteId: productoMatch?.variantes?.[0]?.id || null,
        stockDisponible: productoMatch?.variantes?.reduce((sum, v) => sum + v.stockAdicional, 0) || 0,
      };
    }),
  };
}

  // PASO 1: Asignar insumos a una cita
  static async asignarInsumos(
    citaId: number,
    insumos: Array<{ productoId: number; varianteId?: number; cantidad: number }>,
    asignadoPor: number
  ) {
    const cita = await prisma.cita.findUnique({ where: { id: citaId } });
    if (!cita) throw new AppError(ErrorCodes.USER_NOT_FOUND, 404, 'Cita no encontrada');

    // Eliminar asignaciones anteriores pendientes
    await prisma.insumoAsignado.deleteMany({
      where: { citaId, estado: 'pendiente' },
    });

    const resultados = [];
    for (const insumo of insumos) {
      // Verificar stock
      if (insumo.varianteId) {
        const variante = await prisma.varianteProducto.findUnique({ where: { id: insumo.varianteId } });
        if (!variante) throw new AppError(ErrorCodes.USER_NOT_FOUND, 404, 'Variante no encontrada');
        if (variante.stockAdicional < insumo.cantidad) {
          throw new AppError(
            ErrorCodes.VALIDATION_ERROR, 
            422,
            `Stock insuficiente. Disponible: ${variante.stockAdicional}, Solicitado: ${insumo.cantidad}`
          );
        }
      }

      const asignado = await prisma.insumoAsignado.create({
        data: {
          citaId,
          productoId: insumo.productoId,
          varianteId: insumo.varianteId || null,
          cantidadAsignada: insumo.cantidad,
          estado: 'pendiente',
          asignadoPor,
        },
        include: {
          producto: { select: { nombre: true } },
          variante: { select: { valor: true } },
          asignador: { select: { nombre: true, apellido: true } },
        },
      });
      resultados.push(asignado);
    }

    // Registrar en auditoría
    await prisma.auditLog.create({
      data: {
        tablaAfectada: 'insumos_asignados',
        registroId: citaId,
        accion: 'ASIGNAR_INSUMOS',
        usuarioId: asignadoPor,
        datosNuevos: { cantidad: insumos.length, citaId },
      },
    });

    return resultados;
  }

  // PASO 1/2: Obtener insumos asignados a una cita
  static async getInsumosAsignados(citaId: number) {
    return prisma.insumoAsignado.findMany({
      where: { citaId },
      include: {
        producto: { select: { id: true, nombre: true, sku: true, imagenUrl: true } },
        variante: { select: { id: true, atributo: true, valor: true } },
        asignador: { select: { id: true, nombre: true, apellido: true } },
        confirmador: { select: { id: true, nombre: true, apellido: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  // PASO 2: Groomer confirma recepción de insumo
  static async confirmarRecepcionInsumo(insumoId: number, groomerId: number) {
    const insumo = await prisma.insumoAsignado.findUnique({ where: { id: insumoId } });
    if (!insumo) throw new AppError(ErrorCodes.USER_NOT_FOUND, 404, 'Insumo no encontrado');
    if (insumo.estado !== 'pendiente') {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 422, 'Este insumo ya fue procesado');
    }

    return prisma.insumoAsignado.update({
      where: { id: insumoId },
      data: {
        estado: 'confirmado',
        confirmadoPor: groomerId,
        fechaConfirmacion: new Date(),
      },
    });
  }

  // PASO 2: Verificar si todos los insumos están confirmados
  static async verificarInsumosConfirmados(citaId: number): Promise<boolean> {
    const insumos = await prisma.insumoAsignado.findMany({ where: { citaId } });
    if (insumos.length === 0) return true;
    return insumos.every(i => i.estado !== 'pendiente');
  }

  // PASO 3: Groomer registra uso de insumo
  static async registrarUsoInsumo(
    insumoId: number,
    data: { estado: string; cantidadUsada?: number; observacion?: string }
  ) {
    const insumo = await prisma.insumoAsignado.findUnique({ where: { id: insumoId } });
    if (!insumo) throw new AppError(ErrorCodes.USER_NOT_FOUND, 404, 'Insumo no encontrado');
    
    const estadosFinales = ['usado', 'devuelto', 'merma'];
    if (estadosFinales.includes(insumo.estado)) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 422, 'Este insumo ya tiene un destino asignado');
    }

    return prisma.insumoAsignado.update({
      where: { id: insumoId },
      data: {
        estado: data.estado,
        cantidadUsada: data.cantidadUsada || insumo.cantidadAsignada,
        observacion: data.observacion,
        fechaUso: new Date(),
      },
    });
  }

  // PASO 3: Verificar si todos los insumos tienen destino
  static async verificarInsumosConDestino(citaId: number): Promise<boolean> {
    const insumos = await prisma.insumoAsignado.findMany({ where: { citaId } });
    if (insumos.length === 0) return true;
    const estadosFinales = ['usado', 'devuelto', 'merma'];
    return insumos.every(i => estadosFinales.includes(i.estado));
  }

  // PASO 4: Procesar descuento automático al cerrar ficha
  static async procesarDescuentoInsumos(citaId: number) {
    const insumos = await prisma.insumoAsignado.findMany({
      where: { citaId, estado: 'usado' },
    });

    for (const insumo of insumos) {
      if (insumo.varianteId) {
        const variante = await prisma.varianteProducto.findUnique({ where: { id: insumo.varianteId } });
        if (variante) {
          const nuevoStock = Math.max(0, variante.stockAdicional - Number(insumo.cantidadUsada || insumo.cantidadAsignada));
          await prisma.varianteProducto.update({
            where: { id: insumo.varianteId },
            data: { stockAdicional: nuevoStock },
          });
        }
      }
    }

    // También procesar mermas (descuentan igual)
    const mermas = await prisma.insumoAsignado.findMany({
      where: { citaId, estado: 'merma' },
    });

    for (const merma of mermas) {
      if (merma.varianteId) {
        const variante = await prisma.varianteProducto.findUnique({ where: { id: merma.varianteId } });
        if (variante) {
          const nuevoStock = Math.max(0, variante.stockAdicional - Number(merma.cantidadUsada || merma.cantidadAsignada));
          await prisma.varianteProducto.update({
            where: { id: merma.varianteId },
            data: { stockAdicional: nuevoStock },
          });
        }
      }
    }
  }

  // PASO 5: Log completo para admin
  static async getLogCompleto(params?: {
    citaId?: number;
    groomerId?: number;
    desde?: string;
    hasta?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};
    if (params?.citaId) where.citaId = params.citaId;
    if (params?.groomerId) {
      where.cita = { groomerId: params.groomerId };
    }
    if (params?.desde || params?.hasta) {
      where.fechaAsignacion = {};
      if (params?.desde) where.fechaAsignacion.gte = new Date(params.desde);
      if (params?.hasta) where.fechaAsignacion.lte = new Date(params.hasta);
    }

    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const [insumos, total] = await Promise.all([
      prisma.insumoAsignado.findMany({
        where,
        include: {
          producto: { select: { id: true, nombre: true, sku: true } },
          variante: { select: { id: true, valor: true } },
          asignador: { select: { id: true, nombre: true, apellido: true } },
          confirmador: { select: { id: true, nombre: true, apellido: true } },
          cita: {
            select: {
              id: true,
              fechaHoraInicio: true,
              mascota: { select: { nombre: true } },
              servicio: { select: { nombre: true } },
              groomer: { select: { usuario: { select: { nombre: true, apellido: true } } } },
            },
          },
        },
        orderBy: { fechaAsignacion: 'desc' },
        skip,
        take: limit,
      }),
      prisma.insumoAsignado.count({ where }),
    ]);

    // Resumen para dashboard
    const todos = await prisma.insumoAsignado.findMany({ where });
    const resumen = {
      total,
      pendientes: todos.filter(i => i.estado === 'pendiente').length,
      confirmados: todos.filter(i => i.estado === 'confirmado').length,
      usados: todos.filter(i => i.estado === 'usado').length,
      devueltos: todos.filter(i => i.estado === 'devuelto').length,
      mermas: todos.filter(i => i.estado === 'merma').length,
      cantidadTotalAsignada: todos.reduce((sum, i) => sum + Number(i.cantidadAsignada), 0),
      cantidadTotalUsada: todos.filter(i => i.estado === 'usado').reduce((sum, i) => sum + Number(i.cantidadUsada || i.cantidadAsignada), 0),
      cantidadTotalDevuelta: todos.filter(i => i.estado === 'devuelto').reduce((sum, i) => sum + Number(i.cantidadAsignada), 0),
      cantidadTotalMerma: todos.filter(i => i.estado === 'merma').reduce((sum, i) => sum + Number(i.cantidadUsada || i.cantidadAsignada), 0),
    };

    return { insumos, resumen, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ============================================
  // CATÁLOGO DE TIENDA
  // ============================================

  // Obtener productos de tienda (catálogo público)
  static async getCatalogoTienda(params?: { categoriaId?: number; search?: string }) {
    const where: any = { 
      activo: true, 
      esTienda: true  // 👈 Solo productos de tienda
    };
    
    if (params?.categoriaId) where.categoriaId = params.categoriaId;
    if (params?.search) {
      where.OR = [
        { nombre: { contains: params.search, mode: 'insensitive' } },
        { sku: { contains: params.search, mode: 'insensitive' } },
        { descripcion: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    return prisma.producto.findMany({
      where,
      include: {
        categoria: { select: { id: true, nombre: true } },
        variantes: { 
          where: { stockAdicional: { gt: 0 } },
          select: { id: true, atributo: true, valor: true, stockAdicional: true, precioExtra: true },
        },
      },
      orderBy: { nombre: 'asc' },
    });
  }

  // Obtener insumos técnicos (para asignación a groomers)
  static async getInsumosTecnicos(params?: { search?: string }) {
    const where: any = { 
      activo: true,
      esInsumo: true,
    };
    
    if (params?.search) {
      where.OR = [
        { nombre: { contains: params.search, mode: 'insensitive' } },
        { sku: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    console.log('🔍 Buscando insumos técnicos con where:', JSON.stringify(where));

    const productos = await prisma.producto.findMany({
      where,
      include: {
        variantes: { 
          select: { id: true, atributo: true, valor: true, stockAdicional: true },
        },
      },
      orderBy: { nombre: 'asc' },
    });

    console.log('🔍 Insumos técnicos encontrados:', productos.length);
    return productos;
  }

  // Obtener ambos (para admin)
  static async getAllProductos(params?: { 
    categoriaId?: number; 
    search?: string; 
    tipo?: 'insumo' | 'tienda' | 'todos';
    bajoStock?: boolean;
  }) {
    const where: any = { activo: true };
    
    if (params?.categoriaId) where.categoriaId = params.categoriaId;
    if (params?.tipo === 'insumo') where.esInsumo = true;
    if (params?.tipo === 'tienda') where.esTienda = true;
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

    if (params?.bajoStock) {
      return productos.filter(p => {
        const stockTotal = p.variantes.reduce((sum, v) => sum + v.stockAdicional, 0);
        return stockTotal < p.stockMinimo;
      });
    }

    return productos;
  }

  // ============================================
// INSUMOS SUGERIDOS POR SERVICIO
// ============================================

// Obtener o crear plantilla de insumos para un servicio
static async getInsumosSugeridosPorServicio(servicioId: number) {
  // Buscar si ya hay insumos configurados para este servicio
  const configurados = await prisma.insumoServicio.findMany({
    where: { servicioId },
    include: {
      producto: {
        select: { id: true, nombre: true, sku: true, imagenUrl: true, unidadMedida: true },
      },
      variante: {
        select: { id: true, atributo: true, valor: true },
      },
    },
    orderBy: { orden: 'asc' },
  });

  if (configurados.length > 0) {
    return configurados;
  }

  // Si no hay configurados, devolver lista vacía (el admin debe configurarlos)
  return [];
}

// Configurar insumos para un servicio
static async configurarInsumosServicio(
  servicioId: number,
  insumos: Array<{ productoId: number; varianteId?: number; cantidadSugerida: number; orden?: number }>
) {
  // Eliminar configuración anterior
  await prisma.insumoServicio.deleteMany({ where: { servicioId } });

  // Crear nueva configuración
  const resultados = [];
  for (let i = 0; i < insumos.length; i++) {
    const insumo = insumos[i];
    const creado = await prisma.insumoServicio.create({
      data: {
        servicioId,
        productoId: insumo.productoId,
        varianteId: insumo.varianteId || null,
        cantidadSugerida: insumo.cantidadSugerida,
        orden: insumo.orden || i + 1,
      },
      include: {
        producto: { select: { nombre: true } },
        variante: { select: { valor: true } },
      },
    });
    resultados.push(creado);
  }

  return resultados;
}

  // Asignar insumos automáticamente al crear una cita
  static async asignarInsumosAutomaticos(citaId: number, asignadoPor: number) {
    const cita = await prisma.cita.findUnique({
      where: { id: citaId },
      include: { servicio: true },
    });

    if (!cita) throw new AppError(ErrorCodes.USER_NOT_FOUND, 404, 'Cita no encontrada');

    // Buscar insumos configurados para este servicio
    const insumosServicio = await prisma.insumoServicio.findMany({
      where: { servicioId: cita.servicioId },
      include: {
        producto: { select: { id: true, nombre: true } },
        variante: { select: { id: true, valor: true } },
      },
      orderBy: { orden: 'asc' },
    });

    if (insumosServicio.length === 0) {
      return { asignados: 0, mensaje: 'No hay insumos configurados para este servicio' };
    }

    // Eliminar asignaciones anteriores pendientes de esta cita
    await prisma.insumoAsignado.deleteMany({
      where: { citaId, estado: 'pendiente' },
    });

    // Crear asignaciones
    const asignados = [];
    for (const insumo of insumosServicio) {
      // Verificar stock
      if (insumo.varianteId) {
        const variante = await prisma.varianteProducto.findUnique({ where: { id: insumo.varianteId } });
        if (!variante || variante.stockAdicional < Number(insumo.cantidadSugerida)) {
          continue; // Saltar si no hay stock suficiente
        }
      }

      const asignado = await prisma.insumoAsignado.create({
        data: {
          citaId,
          productoId: insumo.productoId,
          varianteId: insumo.varianteId,
          cantidadAsignada: insumo.cantidadSugerida,
          estado: 'pendiente',
          asignadoPor,
        },
      });
      asignados.push(asignado);
    }

    return {
      asignados: asignados.length,
      mensaje: `${asignados.length} insumo(s) asignado(s) automáticamente`,
      insumos: asignados,
    };
  }

  // ============================================
  // CATEGORÍAS
  // ============================================

  static async getCategorias() {
    return prisma.categoria.findMany({
      orderBy: { nombre: 'asc' },
      select: { id: true, nombre: true, descripcion: true },
    });
  }

  static async createCategoria(data: { nombre: string; descripcion?: string }) {
    return prisma.categoria.create({ data });
  }

}