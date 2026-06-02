import { Request, Response, NextFunction } from 'express';
import { ServicesService } from './services.service';
import prisma from '../../config/database';

export class ServicesController {
  /**
   * GET /api/services
   */
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const onlyActive = req.query.active === 'true';
      const services = await ServicesService.getAll(onlyActive);
      res.status(200).json({ status: 'success', data: services });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/services/:id
   */
  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const service = await ServicesService.getById(parseInt(req.params.id));
      res.status(200).json({ status: 'success', data: service });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/services
   */
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const service = await ServicesService.create(req.body);
      res.status(201).json({ status: 'success', data: service });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/services/:id
   */
  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const service = await ServicesService.update(parseInt(req.params.id), req.body);
      res.status(200).json({ status: 'success', data: service });
    } catch (error) {
      next(error);
    }
  }
    /**
   * GET /api/services/:id/checklist
   */
  static async getChecklist(req: Request, res: Response, next: NextFunction) {
    try {
      const items = await prisma.plantillaChecklist.findMany({
        where: { servicioId: parseInt(req.params.id) },
        orderBy: { orden: 'asc' },
      });
      res.status(200).json({ status: 'success', data: items });
    } catch (error) { next(error); }
  }

  /**
   * POST /api/services/:id/checklist
   */
  static async addChecklistItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { item, orden, requiereObservacion } = req.body;
      const newItem = await prisma.plantillaChecklist.create({
        data: {
          servicioId: parseInt(req.params.id),
          item,
          orden: orden || 1,
          requiereObservacion: requiereObservacion || false,
        },
      });
      res.status(201).json({ status: 'success', data: newItem });
    } catch (error) { next(error); }
  }

  /**
   * DELETE /api/services/:id/checklist/:itemId
   */
  static async deleteChecklistItem(req: Request, res: Response, next: NextFunction) {
    try {
      await prisma.plantillaChecklist.delete({
        where: { id: parseInt(req.params.itemId) },
      });
      res.status(200).json({ status: 'success', message: 'Item eliminado' });
    } catch (error) { next(error); }
  }

  /**
   * GET /api/services/calculate-duration
   * Calcular duración ajustada
   */
  static async calculateDuration(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { servicioId, tamanioMascota, temperamento } = req.query;
      const servicio = await ServicesService.getById(parseInt(servicioId as string));
      
      const duracion = ServicesService.calcularDuracionAjustada(
        servicio.duracionBaseMinutos,
        servicio.factorTamanoRaza,
        tamanioMascota as string,
        temperamento as string
      );

      res.status(200).json({
        status: 'success',
        data: {
          duracionBase: servicio.duracionBaseMinutos,
          duracionAjustada: duracion,
          incremento: duracion - servicio.duracionBaseMinutos,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}