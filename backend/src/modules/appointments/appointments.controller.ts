import { Request, Response, NextFunction } from 'express';
import { AppointmentsService } from './appointments.service';
import prisma from '../../config/database';

export class AppointmentsController {
  /**
   * GET /api/appointments
   */
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const appointments = await AppointmentsService.getAll(req.query as any);
      res.status(200).json({ status: 'success', data: appointments, total: appointments.length });
    } catch (error) { next(error); }
  }

  /**
   * GET /api/appointments/my - Citas del cliente autenticado
   */
  static async getMyAppointments(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const cliente = await prisma.cliente.findUnique({ where: { usuarioId: userId } });
      if (!cliente) return res.status(200).json({ status: 'success', data: [] });
      const appointments = await AppointmentsService.getByCliente(cliente.id);
      res.status(200).json({ status: 'success', data: appointments });
    } catch (error) { next(error); }
  }

  /**
   * GET /api/appointments/groomer/:groomerId
   */
  static async getByGroomer(req: Request, res: Response, next: NextFunction) {
    try {
      const { fecha } = req.query;
      const appointments = await AppointmentsService.getByGroomer(parseInt(req.params.groomerId), fecha as string);
      res.status(200).json({ status: 'success', data: appointments });
    } catch (error) { next(error); }
  }

  /**
   * GET /api/appointments/my-day - Citas del groomer autenticado para hoy
   */
  static async getMyDay(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const groomer = await prisma.groomer.findUnique({ where: { usuarioId: userId } });
      if (!groomer) return res.status(200).json({ status: 'success', data: [] });
      const today = new Date().toISOString().split('T')[0];
      const appointments = await AppointmentsService.getByGroomer(groomer.id, today);
      res.status(200).json({ status: 'success', data: appointments });
    } catch (error) { next(error); }
  }

  /**
   * GET /api/appointments/:id
   */
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const appointment = await AppointmentsService.getById(parseInt(req.params.id));
      res.status(200).json({ status: 'success', data: appointment });
    } catch (error) { next(error); }
  }

  /**
   * POST /api/appointments
   */
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const esSolicitud = req.user?.rol === 'Cliente';
      const appointment = await AppointmentsService.create(req.body, req.user!.userId, esSolicitud);
      res.status(201).json({ status: 'success', data: appointment, message: esSolicitud ? 'Solicitud enviada' : 'Cita creada' });
    } catch (error) { next(error); }
  }

  /**
   * PUT /api/appointments/:id
   */
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const appointment = await AppointmentsService.update(parseInt(req.params.id), req.body, req.user!.userId);
      res.status(200).json({ status: 'success', data: appointment });
    } catch (error) { next(error); }
  }

  /**
   * PUT /api/appointments/:id/cancel
   */
  static async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const { motivo } = req.body;
      const appointment = await AppointmentsService.cancel(parseInt(req.params.id), motivo || 'Cancelado por usuario');
      res.status(200).json({ status: 'success', data: appointment, message: 'Cita cancelada' });
    } catch (error) { next(error); }
  }

  /**
   * PUT /api/appointments/:id/approve
   */
  static async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const appointment = await AppointmentsService.cambiarEstadoSolicitud(parseInt(req.params.id), 'Aprobada');
      res.status(200).json({ status: 'success', data: appointment, message: 'Cita aprobada' });
    } catch (error) { next(error); }
  }

  /**
   * PUT /api/appointments/:id/reject
   */
  static async reject(req: Request, res: Response, next: NextFunction) {
    try {
      const appointment = await AppointmentsService.cambiarEstadoSolicitud(parseInt(req.params.id), 'Rechazada');
      res.status(200).json({ status: 'success', data: appointment, message: 'Cita rechazada' });
    } catch (error) { next(error); }
  }
}