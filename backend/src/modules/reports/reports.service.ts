import prisma from '../../config/database';
import { AppError } from '../../shared/errors/AppError';
import { ErrorCodes } from '../../shared/errors/errorCodes';

export class ReportsService {
  // ============================================
  // ADMIN - VENTAS Y FACTURACIÓN
  // ============================================
  static async getVentasFacturacion(desde?: string, hasta?: string) {
    const where: any = { estado: 'Pagada' };
    if (desde || hasta) {
      where.fechaEmision = {};
      if (desde) where.fechaEmision.gte = new Date(desde);
      if (hasta) where.fechaEmision.lte = new Date(hasta);
    }

    const facturas = await prisma.factura.findMany({
      where,
      include: {
        cita: { select: { servicio: { select: { nombre: true } } } },
        pagos: true,
        detalles: true,
      },
      orderBy: { fechaEmision: 'desc' },
    });

    const totalServicios = facturas
      .filter(f => f.citaId)
      .reduce((sum, f) => sum + Number(f.total), 0);
    const totalProductos = facturas
      .filter(f => f.pedidoId)
      .reduce((sum, f) => sum + Number(f.total), 0);

    // Agrupar por día
    const porDiaMap: Record<string, any> = {};
    for (const f of facturas) {
      const fecha = f.fechaEmision.toISOString().split('T')[0];
      if (!porDiaMap[fecha]) {
        porDiaMap[fecha] = { fecha, total: 0, servicios: 0, productos: 0 };
      }
      porDiaMap[fecha].total += Number(f.total);
      if (f.citaId) porDiaMap[fecha].servicios += Number(f.total);
      if (f.pedidoId) porDiaMap[fecha].productos += Number(f.total);
    }

    // Agrupar por método de pago
    const porMetodoMap: Record<string, any> = {};
    for (const f of facturas) {
      const metodo = f.metodoPago || 'No especificado';
      if (!porMetodoMap[metodo]) {
        porMetodoMap[metodo] = { metodo, total: 0, cantidad: 0 };
      }
      porMetodoMap[metodo].total += Number(f.total);
      porMetodoMap[metodo].cantidad++;
    }

    return {
      totalServicios,
      totalProductos,
      totalGeneral: totalServicios + totalProductos,
      totalFacturas: facturas.length,
      porDia: Object.values(porDiaMap).sort((a: any, b: any) => b.fecha.localeCompare(a.fecha)).slice(0, 30),
      porMetodoPago: Object.values(porMetodoMap),
    };
  }

  // ============================================
  // ADMIN - RANKING DE RENTABILIDAD
  // ============================================
  static async getRankingRentabilidad() {
    // Top servicios
    const servicios = await prisma.cita.groupBy({
      by: ['servicioId'],
      where: { estado: 'Completada' },
      _count: { servicioId: true },
    });

    const serviciosConNombre = await Promise.all(
      servicios.map(async (s) => {
        const servicio = await prisma.servicio.findUnique({ where: { id: s.servicioId } });
        return {
          nombre: servicio?.nombre || 'Desconocido',
          cantidad: s._count.servicioId,
          ingresos: s._count.servicioId * (Number(servicio?.precioBase) || 0),
        };
      })
    );

    // Top productos (por consumo en fichas)
    const productosConsumo = await prisma.consumoInsumo.groupBy({
      by: ['productoId'],
      _sum: { cantidad: true },
      _count: { productoId: true },
    });

    const productosConNombre = await Promise.all(
      productosConsumo.map(async (p) => {
        const producto = await prisma.producto.findUnique({ where: { id: p.productoId } });
        return {
          nombre: producto?.nombre || 'Desconocido',
          cantidad: p._count.productoId,
          ingresos: Number(p._sum.cantidad || 0) * (Number(producto?.precioBase) || 0),
        };
      })
    );

    return {
      topServicios: serviciosConNombre.sort((a, b) => b.ingresos - a.ingresos).slice(0, 10),
      topProductos: productosConNombre.sort((a, b) => b.ingresos - a.ingresos).slice(0, 10),
    };
  }

  // ============================================
  // ADMIN - OCUPACIÓN GLOBAL
  // ============================================
  static async getOcupacionGlobal(fecha?: string) {
    const fechaConsulta = fecha || new Date().toISOString().split('T')[0];
    const año = new Date(fechaConsulta).getFullYear();
    
    // Rango de todo el año
    const inicioAño = new Date(`${año}-01-01T00:00:00`);
    const finAño = new Date(`${año}-12-31T23:59:59`);

    // Obtener todos los groomers activos
    const groomers = await prisma.groomer.findMany({
      where: { activo: true },
      include: {
        usuario: { select: { nombre: true, apellido: true } },
        disponibilidades: true,
      },
    });

    // Para cada groomer, contar sus citas del AÑO
    const porGroomer = await Promise.all(
      groomers.map(async (g) => {
        // Contar citas del AÑO para este groomer
        const citasAño = await prisma.cita.count({
          where: {
            groomerId: g.id,
            fechaHoraInicio: { gte: inicioAño, lte: finAño },
            estado: { notIn: ['Cancelada', 'NoAsistio'] },
          },
        });

        // Contar citas completadas
        const citasCompletadas = await prisma.cita.count({
          where: {
            groomerId: g.id,
            fechaHoraInicio: { gte: inicioAño, lte: finAño },
            estado: 'Completada',
          },
        });

        // Capacidad diaria configurada
        const capacidadDiaria = g.capacidadDiaria || 6;
        
        // Días laborales en el año (aproximado: 5 días/semana × 52 semanas = 260 días)
        const diasLaboralesAño = 260;
        const capacidadAnual = capacidadDiaria * diasLaboralesAño;

        // Horas totales trabajadas en el año
        const horasTrabajadas = await prisma.cita.aggregate({
          where: {
            groomerId: g.id,
            fechaHoraInicio: { gte: inicioAño, lte: finAño },
            estado: 'Completada',
          },
          _sum: { duracionRealMinutos: true },
        });

        const horasTotales = (horasTrabajadas._sum.duracionRealMinutos || 0) / 60;

        // Porcentaje de ocupación anual
        const porcentaje = capacidadAnual > 0 
          ? Math.round((citasAño / capacidadAnual) * 100) 
          : 0;

        return {
          groomer: `${g.usuario.nombre} ${g.usuario.apellido}`,
          totalCitas: citasAño,
          citasCompletadas,
          horasTrabajadas: Math.round(horasTotales * 10) / 10,
          capacidadAnual,
          porcentajeOcupacion: Math.min(porcentaje, 100),
          año,
        };
      })
    );

    // Citas por MES (últimos 12 meses)
    const porMes = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(año, new Date().getMonth() - i, 1);
      const mesInicio = new Date(d.getFullYear(), d.getMonth(), 1);
      const mesFin = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

      const totalCitas = await prisma.cita.count({
        where: {
          fechaHoraInicio: { gte: mesInicio, lte: mesFin },
          estado: { notIn: ['Cancelada', 'NoAsistio'] },
        },
      });

      const totalCompletadas = await prisma.cita.count({
        where: {
          fechaHoraInicio: { gte: mesInicio, lte: mesFin },
          estado: 'Completada',
        },
      });

      // Capacidad mensual (todos los groomers)
      const capacidadMensual = groomers.reduce((sum, g) => {
        return sum + ((g.capacidadDiaria || 6) * 22); // ~22 días hábiles por mes
      }, 0);

      porMes.push({
        mes: d.toLocaleDateString('es-BO', { month: 'long', year: 'numeric' }),
        mesAbrev: d.toLocaleDateString('es-BO', { month: 'short' }),
        totalCitas,
        totalCompletadas,
        capacidadMensual,
        porcentaje: capacidadMensual > 0 ? Math.round((totalCitas / capacidadMensual) * 100) : 0,
      });
    }

    return {
      porGroomer,
      porMes,
      año,
      totalGroomers: groomers.length,
      totalCitasAño: porGroomer.reduce((sum, g) => sum + g.totalCitas, 0),
      totalCompletadasAño: porGroomer.reduce((sum, g) => sum + g.citasCompletadas, 0),
      capacidadTotalAnual: porGroomer.reduce((sum, g) => sum + g.capacidadAnual, 0),
      porcentajeGlobal: porGroomer.reduce((sum, g) => sum + g.capacidadAnual, 0) > 0
        ? Math.round((porGroomer.reduce((sum, g) => sum + g.totalCitas, 0) / porGroomer.reduce((sum, g) => sum + g.capacidadAnual, 0)) * 100)
        : 0,
    };
  }

  // ============================================
  // ADMIN - AUDITORÍA DE INSUMOS
  // ============================================
  static async getAuditoriaInsumos() {
    const consumos = await prisma.consumoInsumo.findMany({
      include: {
        producto: { select: { nombre: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const porProducto: Record<string, any> = {};
    for (const c of consumos) {
      const key = c.producto.nombre;
      if (!porProducto[key]) {
        porProducto[key] = {
          producto: key,
          cantidadUsada: 0,
          cantidadDevuelta: 0,
          cantidadMerma: 0,
          totalRegistros: 0,
        };
      }
      porProducto[key].totalRegistros++;
      if (c.devuelto) {
        porProducto[key].cantidadDevuelta += Number(c.cantidad);
      } else if (c.merma) {
        porProducto[key].cantidadMerma += Number(c.cantidad);
      } else {
        porProducto[key].cantidadUsada += Number(c.cantidad);
      }
    }

    return {
      consumos: Object.values(porProducto).map((p: any) => ({
        ...p,
        eficiencia: p.totalRegistros > 0
          ? Math.round(((p.cantidadUsada) / (p.cantidadUsada + p.cantidadDevuelta + p.cantidadMerma)) * 100)
          : 100,
      })),
    };
  }

  // ============================================
  // GROOMER - PRODUCTIVIDAD INDIVIDUAL
  // ============================================
  static async getProductividadGroomer(groomerId: number) {
    const fichas = await prisma.fichaGrooming.findMany({
      where: {
        cita: { groomerId },
        fechaCierre: { not: null },
      },
      include: {
        cita: {
          include: {
            mascota: { select: { nombre: true } },
            servicio: { select: { nombre: true } },
          },
        },
        fotos: {
          select: {
            id: true,
            tipo: true,
            urlFoto: true,  // 👈 URL REAL
          },
        },
        checklist: { select: { completado: true } },
      },
      orderBy: { fechaCierre: 'desc' },
      take: 50,
    });

    const tiempos = fichas.map(f => {
      const cita = f.cita as any;
      return cita.duracionEstimadaMinutos || 60;
    });

    const tiempoPromedio = tiempos.length > 0
      ? Math.round(tiempos.reduce((a, b) => a + b, 0) / tiempos.length)
      : 0;

    const serviciosPorDia: Record<string, number> = {};
    for (const f of fichas) {
      if (!f.fechaCierre) continue;
      const fecha = f.fechaCierre.toISOString().split('T')[0];
      serviciosPorDia[fecha] = (serviciosPorDia[fecha] || 0) + 1;
    }

    return {
      totalServicios: fichas.length,
      tiempoPromedio,
      serviciosPorDia: Object.entries(serviciosPorDia).map(([fecha, cantidad]) => ({ fecha, cantidad })),
      fichasRecientes: fichas.slice(0, 20).map(f => ({
        id: f.id,
        fecha: f.fechaCierre?.toISOString() || '',
        mascota: f.cita.mascota.nombre,
        servicio: f.cita.servicio.nombre,
        fotos: f.fotos.length,
        fotosUrls: f.fotos.map(foto => ({  // 👈 ARRAY DE FOTOS REALES
          id: foto.id,
          tipo: foto.tipo,
          url: foto.urlFoto,
        })),
        checklistCompletado: f.checklist.every(c => c.completado),
        estadoIngreso: f.estadoIngreso || null,
        recomendaciones: f.recomendaciones || null,
      })),
    };
  }

  // ============================================
  // GROOMER - CONSUMO PERSONAL DE INSUMOS
  // ============================================
  static async getConsumoPersonal(groomerId: number) {
    const consumos = await prisma.consumoInsumo.findMany({
      where: {
        fichaGrooming: {
          cita: { groomerId },
        },
      },
      include: {
        producto: { select: { nombre: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const porProducto: Record<string, any> = {};
    for (const c of consumos) {
      const key = c.producto.nombre;
      if (!porProducto[key]) {
        porProducto[key] = { producto: key, usado: 0, devuelto: 0, merma: 0 };
      }
      if (c.devuelto) porProducto[key].devuelto += Number(c.cantidad);
      else if (c.merma) porProducto[key].merma += Number(c.cantidad);
      else porProducto[key].usado += Number(c.cantidad);
    }

    return {
      totalInsumos: consumos.length,
      porProducto: Object.values(porProducto),
    };
  }

  // ============================================
  // CLIENTE - HISTORIAL DE MASCOTAS
  // ============================================
  static async getHistorialCliente(clienteId: number) {
    const mascotas = await prisma.mascota.findMany({
      where: { clienteId },
      include: {
      citas: {
        include: {
          servicio: { select: { nombre: true } },
          fichaGrooming: {
            select: {
              fotos: { select: { tipo: true, urlFoto: true } },
              recomendaciones: true,  
              estadoIngreso: true,    
            },
          },
        },
        orderBy: { fechaHoraInicio: 'desc' },
      },
      },
    });

    return {
      mascotas: mascotas.map(m => ({
        id: m.id,
        nombre: m.nombre,
        totalServicios: m.citas.length,
        ultimoServicio: m.citas[0]?.fechaHoraInicio?.toISOString() || null,
        fotos: m.citas.flatMap(c =>
          c.fichaGrooming?.fotos.map(f => ({
            tipo: f.tipo,
            url: f.urlFoto,
            fecha: c.fechaHoraInicio.toISOString(),
          })) || []
        ).slice(0, 20),
        ultimasCitas: m.citas.slice(0, 5).map(c => ({
          fecha: c.fechaHoraInicio.toISOString(),
          servicio: c.servicio.nombre,
          estado: c.estado,
          recomendaciones: c.fichaGrooming?.recomendaciones || null, 
          estadoIngreso: c.fichaGrooming?.estadoIngreso || null,      
        })),
      })),
    };
  }
}