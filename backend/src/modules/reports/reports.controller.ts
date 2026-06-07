import { Request, Response, NextFunction } from 'express';
import { ReportsService } from './reports.service';
import prisma from '../../config/database';
import { ErrorCodes } from '../../shared/errors/errorCodes';
import { AppError } from '../../shared/errors/AppError';

export class ReportsController {
  // GET /api/reports/ventas
  static async getVentas(req: Request, res: Response, next: NextFunction) {
    try {
      const { desde, hasta } = req.query;
      const data = await ReportsService.getVentasFacturacion(desde as string, hasta as string);
      res.status(200).json({ status: 'success', data });
    } catch (error) { next(error); }
  }

  // GET /api/reports/rentabilidad
  static async getRentabilidad(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await ReportsService.getRankingRentabilidad();
      res.status(200).json({ status: 'success', data });
    } catch (error) { next(error); }
  }

  // GET /api/reports/ocupacion
  static async getOcupacion(req: Request, res: Response, next: NextFunction) {
    try {
      const { fecha } = req.query;
      const data = await ReportsService.getOcupacionGlobal(fecha as string);
      res.status(200).json({ status: 'success', data });
    } catch (error) { next(error); }
  }

  // GET /api/reports/insumos
  static async getAuditoriaInsumos(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await ReportsService.getAuditoriaInsumos();
      res.status(200).json({ status: 'success', data });
    } catch (error) { next(error); }
  }

  // GET /api/reports/groomer
  static async getReporteGroomer(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const groomer = await prisma.groomer.findUnique({ where: { usuarioId: userId } });
      if (!groomer) return res.status(404).json({ status: 'error', message: 'Groomer no encontrado' });
      const data = await ReportsService.getProductividadGroomer(groomer.id);
      res.status(200).json({ status: 'success', data });
    } catch (error) { next(error); }
  }

  // GET /api/reports/groomer/insumos
  static async getConsumoGroomer(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const groomer = await prisma.groomer.findUnique({ where: { usuarioId: userId } });
      if (!groomer) return res.status(404).json({ status: 'error', message: 'Groomer no encontrado' });
      const data = await ReportsService.getConsumoPersonal(groomer.id);
      res.status(200).json({ status: 'success', data });
    } catch (error) { next(error); }
  }

  // GET /api/reports/cliente
  static async getReporteCliente(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const cliente = await prisma.cliente.findUnique({ where: { usuarioId: userId } });
      if (!cliente) return res.status(200).json({ status: 'success', data: { mascotas: [] } });
      const data = await ReportsService.getHistorialCliente(cliente.id);
      res.status(200).json({ status: 'success', data });
    } catch (error) { next(error); }
  }
  /**
   * POST /api/reports/encuesta
   * Cliente envía encuesta de satisfacción
   */
  static async crearEncuesta(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const cliente = await prisma.cliente.findUnique({ where: { usuarioId: userId } });
      if (!cliente) throw new AppError(ErrorCodes.USER_NOT_FOUND, 404, 'Cliente no encontrado');

      const { citaId, puntuacion, comentario, preguntas } = req.body;

      // Verificar que la cita pertenece al cliente y está completada
      const cita = await prisma.cita.findFirst({
        where: {
          id: citaId,
          mascota: { clienteId: cliente.id },
          estado: 'Completada',
        },
      });

      if (!cita) throw new AppError(ErrorCodes.VALIDATION_ERROR, 422, 'Cita no válida para encuesta');

      // Verificar que no exista ya una encuesta
      const existente = await prisma.encuestaSatisfaccion.findUnique({ where: { citaId } });
      if (existente) throw new AppError(ErrorCodes.VALIDATION_ERROR, 422, 'Ya existe una encuesta para esta cita');

      const encuesta = await prisma.encuestaSatisfaccion.create({
        data: {
          citaId,
          clienteId: cliente.id,
          puntuacion,
          comentario,
          preguntas: preguntas || {},
        },
      });

      res.status(201).json({ status: 'success', data: encuesta });
    } catch (error) { next(error); }
  }

  /**
   * GET /api/reports/encuestas
   * Admin obtiene todas las encuestas
   */
  static async getEncuestas(req: Request, res: Response, next: NextFunction) {
    try {
      const encuestas = await prisma.encuestaSatisfaccion.findMany({
        include: {
          cita: {
            include: {
              mascota: { select: { nombre: true } },
              servicio: { select: { nombre: true } },
              groomer: { include: { usuario: { select: { nombre: true, apellido: true } } } },
            },
          },
          cliente: { include: { usuario: { select: { nombre: true, apellido: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      // Calcular NPS y promedios
      const total = encuestas.length;
      const promedio = total > 0 ? encuestas.reduce((s, e) => s + e.puntuacion, 0) / total : 0;
      const promotores = encuestas.filter(e => e.puntuacion >= 4).length;
      const detractores = encuestas.filter(e => e.puntuacion <= 2).length;
      const nps = total > 0 ? Math.round(((promotores - detractores) / total) * 100) : 0;

      // Distribución por puntuación
      const distribucion = [1, 2, 3, 4, 5].map(p => ({
        puntuacion: p,
        cantidad: encuestas.filter(e => e.puntuacion === p).length,
      }));

      res.status(200).json({
        status: 'success',
        data: {
          encuestas,
          resumen: {
            total,
            promedio: Math.round(promedio * 10) / 10,
            nps,
            promotores,
            detractores,
            distribucion,
          },
        },
      });
    } catch (error) { next(error); }
  }

    /**
   * GET /api/reports/cronograma-diario
   * Cronograma de citas del día
   */
  static async getCronogramaDiario(req: Request, res: Response, next: NextFunction) {
    try {
      const fecha = (req.query.fecha as string) || new Date().toISOString().split('T')[0];
      const inicio = new Date(fecha + 'T00:00:00');
      const fin = new Date(fecha + 'T23:59:59');

      const citas = await prisma.cita.findMany({
        where: {
          fechaHoraInicio: { gte: inicio, lte: fin },
          estado: { notIn: ['Cancelada', 'NoAsistio'] },
        },
        include: {
          mascota: {
            select: { nombre: true, raza: true, imagen: true },
          },
          servicio: { select: { nombre: true, precioBase: true } },
          groomer: { include: { usuario: { select: { nombre: true, apellido: true } } } },
          factura: { select: { estado: true, total: true, metodoPago: true } },
          cliente: {
            select: { usuario: { select: { nombre: true, apellido: true, telefono: true } } },
          },
        },
        orderBy: { fechaHoraInicio: 'asc' },
      });

      const resumen = {
        total: citas.length,
        pendientesPago: citas.filter(c => !c.factura || c.factura.estado === 'Pendiente').length,
        pagadas: citas.filter(c => c.factura?.estado === 'Pagada').length,
        enProgreso: citas.filter(c => c.estado === 'EnProgreso').length,
        confirmadas: citas.filter(c => c.estado === 'Confirmada').length,
        completadas: citas.filter(c => c.estado === 'Completada').length,
      };

      res.status(200).json({ status: 'success', data: { citas, resumen, fecha } });
    } catch (error) { next(error); }
  }

  /**
   * GET /api/reports/citas-canceladas
   * Registro de cancelaciones y no-show
   */
  static async getCitasCanceladas(req: Request, res: Response, next: NextFunction) {
    try {
      const desde = req.query.desde as string || new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
      const hasta = req.query.hasta as string || new Date().toISOString().split('T')[0];

      const citas = await prisma.cita.findMany({
        where: {
          estado: { in: ['Cancelada', 'NoAsistio'] },
          fechaHoraInicio: {
            gte: new Date(desde + 'T00:00:00'),
            lte: new Date(hasta + 'T23:59:59'),
          },
        },
        include: {
          mascota: { select: { nombre: true } },
          servicio: { select: { nombre: true } },
          creadoPor: { select: { nombre: true, apellido: true } },
        },
        orderBy: { fechaHoraInicio: 'desc' },
      });

      const resumen = {
        total: citas.length,
        canceladas: citas.filter(c => c.estado === 'Cancelada').length,
        noShow: citas.filter(c => c.estado === 'NoAsistio').length,
        porServicio: {} as Record<string, number>,
      };

      citas.forEach(c => {
        const nombre = c.servicio?.nombre || 'Desconocido';
        resumen.porServicio[nombre] = (resumen.porServicio[nombre] || 0) + 1;
      });

      res.status(200).json({ status: 'success', data: { citas, resumen } });
    } catch (error) { next(error); }
  }

  /**
   * GET /api/reports/cliente/puntos
   * Obtiene los puntos de fidelidad del cliente
   */
  static async getPuntosCliente(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const cliente = await prisma.cliente.findUnique({
        where: { usuarioId: userId },
        select: {
          puntosFidelidad: true,
          totalServicios: true,
          totalCompras: true,
        },
      });

      if (!cliente) {
        return res.status(200).json({ status: 'success', data: { puntosFidelidad: 0, totalServicios: 0, totalCompras: 0 } });
      }

      // Calcular beneficios
      const puntosParaProximo = 100 - (cliente.puntosFidelidad % 100);
      const serviciosGratisDisponibles = Math.floor(cliente.puntosFidelidad / 100);
      const progreso = (cliente.puntosFidelidad % 100);

      res.status(200).json({
        status: 'success',
        data: {
          ...cliente,
          puntosParaProximo,
          serviciosGratisDisponibles,
          progreso,
          proximoBeneficio: `${puntosParaProximo} puntos para tu próximo servicio gratis`,
        },
      });
    } catch (error) { next(error); }
  }
}