import { Request, Response, NextFunction } from 'express';
import { AvailabilityService } from './availability.service';

export class AvailabilityController {
  /**
   * GET /api/availability
   */
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await AvailabilityService.getAll();
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/availability/groomer/:groomerId
   */
  static async getByGroomer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await AvailabilityService.getByGroomer(parseInt(req.params.groomerId));
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/availability
   */
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await AvailabilityService.createAvailability(req.body);
      res.status(201).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/availability/:id
   */
  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await AvailabilityService.deleteAvailability(parseInt(req.params.id));
      res.status(200).json({ status: 'success', message: 'Disponibilidad eliminada' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/availability/check
   * Verificar disponibilidad de un groomer
   */
  static async checkAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { groomerId, fechaHoraInicio, fechaHoraFin } = req.query;
      const result = await AvailabilityService.isGroomerAvailable(
        parseInt(groomerId as string),
        new Date(fechaHoraInicio as string),
        new Date(fechaHoraFin as string)
      );
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/availability/slots
   * Obtener slots disponibles
   */
  static async getSlots(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { groomerId, fecha, duracion } = req.query;
      const slots = await AvailabilityService.getAvailableSlots(
        parseInt(groomerId as string),
        fecha as string,
        parseInt(duracion as string) || 30
      );
      res.status(200).json({ status: 'success', data: slots });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/availability/bloqueos
   */
  static async getBloqueos(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const groomerId = req.query.groomerId ? parseInt(req.query.groomerId as string) : undefined;
      const data = await AvailabilityService.getBloqueos(groomerId);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/availability/bloqueos
   */
  static async createBloqueo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await AvailabilityService.createBloqueo(req.body);
      res.status(201).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/availability/bloqueos/:id
   */
  static async deleteBloqueo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await AvailabilityService.deleteBloqueo(parseInt(req.params.id));
      res.status(200).json({ status: 'success', message: 'Bloqueo eliminado' });
    } catch (error) {
      next(error);
    }
  }
}