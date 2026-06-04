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
    const inicio = new Date(fechaConsulta + 'T00:00:00');
    const fin = new Date(fechaConsulta + 'T23:59:59');

    const groomers = await prisma.groomer.findMany({
      where: { activo: true },
      include: {
        usuario: { select: { nombre: true, apellido: true } },
        disponibilidades: true,
      },
    });

    const porGroomer = await Promise.all(
      groomers.map(async (g) => {
        const citas = await prisma.cita.count({
          where: {
            groomerId: g.id,
            fechaHoraInicio: { gte: inicio, lte: fin },
            estado: { notIn: ['Cancelada', 'NoAsistio'] },
          },
        });

        const horasDisponibles = g.disponibilidades
          .filter(d => d.diaSemana === new Date(fechaConsulta).getDay())
          .reduce((sum, d) => {
            const [hi, mi] = d.horaInicio.split(':').map(Number);
            const [hf, mf] = d.horaFin.split(':').map(Number);
            return sum + (hf * 60 + mf - (hi * 60 + mi)) / 60;
          }, 0);

        const capacidadMaxima = g.capacidadDiaria || g.capacidadSimultanea * 3;
        const porcentaje = capacidadMaxima > 0 ? (citas / capacidadMaxima) * 100 : 0;

        return {
          groomer: `${g.usuario.nombre} ${g.usuario.apellido}`,
          totalCitas: citas,
          horasDisponibles,
          capacidadMaxima,
          porcentajeOcupacion: Math.round(porcentaje),
        };
      })
    );

    // Por día (últimos 7 días)
    const porDia = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const fechaStr = d.toISOString().split('T')[0];
      const diaInicio = new Date(fechaStr + 'T00:00:00');
      const diaFin = new Date(fechaStr + 'T23:59:59');

      const totalCitas = await prisma.cita.count({
        where: {
          fechaHoraInicio: { gte: diaInicio, lte: diaFin },
          estado: { notIn: ['Cancelada', 'NoAsistio'] },
        },
      });

      porDia.push({ fecha: fechaStr, totalCitas, capacidadUsada: totalCitas });
    }

    return { porGroomer, porDia };
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
        fotos: { select: { id: true } },
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

    // Por día (últimos 30 días)
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
      fichasRecientes: fichas.slice(0, 10).map(f => ({
        id: f.id,
        fecha: f.fechaCierre?.toISOString() || '',
        mascota: f.cita.mascota.nombre,
        servicio: f.cita.servicio.nombre,
        fotos: f.fotos.length,
        checklistCompletado: f.checklist.every(c => c.completado),
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
              include: {
                fotos: { select: { tipo: true, urlFoto: true } },
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
        })),
      })),
    };
  }
}