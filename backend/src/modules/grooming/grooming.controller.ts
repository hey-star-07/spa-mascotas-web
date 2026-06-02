import { Request, Response, NextFunction } from 'express';
import { GroomingService } from './grooming.service';
import prisma from '../../config/database';
import { ErrorCodes } from '../../shared/errors/errorCodes';
import { AppError } from '../../shared/errors/AppError';

export class GroomingController {
  // GET /api/grooming/fichas/:id
  static async getFicha(req: Request, res: Response, next: NextFunction) {
    try {
      const ficha = await GroomingService.getFichaById(parseInt(req.params.id));
      res.status(200).json({ status: 'success', data: ficha });
    } catch (error) { next(error); }
  }

  // GET /api/grooming/my-fichas - Fichas activas del groomer autenticado
  static async getMyFichas(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const groomer = await prisma.groomer.findUnique({ where: { usuarioId: userId } });
      if (!groomer) return res.status(200).json({ status: 'success', data: [] });
      const fichas = await GroomingService.getFichasActivasGroomer(groomer.id);
      res.status(200).json({ status: 'success', data: fichas });
    } catch (error) { next(error); }
  }

      /**
     * POST /api/grooming/iniciar-servicio/:citaId
     * El groomer inicia el servicio → crea la ficha automáticamente
     */
  static async iniciarServicio(req: Request, res: Response, next: NextFunction) {
    try {
      const citaId = parseInt(req.params.citaId);
      
      if (!citaId || isNaN(citaId)) {
        return res.status(400).json({ status: 'error', message: 'ID de cita inválido' });
      }
      
      // Verificar que la cita existe y pertenece al groomer
      const cita = await prisma.cita.findUnique({
        where: { id: citaId },
        include: { mascota: true, servicio: true },
      });
      
      if (!cita) {
        return res.status(404).json({ status: 'error', message: 'Cita no encontrada' });
      }
      
      // Verificar que el groomer autenticado es el asignado
      const userId = req.user!.userId;
      const groomer = await prisma.groomer.findUnique({ where: { usuarioId: userId } });
      if (!groomer || cita.groomerId !== groomer.id) {
        return res.status(403).json({ status: 'error', message: 'No tienes esta cita asignada' });
      }

      // Verificar si ya existe una ficha
      let ficha = await prisma.fichaGrooming.findUnique({ where: { citaId } });
      
      if (!ficha) {
        // Crear ficha automáticamente
        ficha = await GroomingService.createFicha({
          citaId,
          razaTamanoMomento: cita.mascota?.raza || '',
        });
      }

      // 👇 ASEGURAR QUE DEVUELVA EL ID
      res.status(200).json({
        status: 'success',
        data: { id: ficha.id },
        message: 'Servicio iniciado. Ficha técnica creada.',
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/grooming/fichas
  static async createFicha(req: Request, res: Response, next: NextFunction) {
    try {
      const ficha = await GroomingService.createFicha(req.body);
      res.status(201).json({ status: 'success', data: ficha });
    } catch (error) { next(error); }
  }

  // PUT /api/grooming/fichas/:id
  static async updateFicha(req: Request, res: Response, next: NextFunction) {
    try {
      const ficha = await GroomingService.updateFicha(parseInt(req.params.id), req.body);
      res.status(200).json({ status: 'success', data: ficha });
    } catch (error) { next(error); }
  }

  // PUT /api/grooming/fichas/:id/cerrar
  static async cerrarFicha(req: Request, res: Response, next: NextFunction) {
    try {
      const ficha = await GroomingService.cerrarFicha(parseInt(req.params.id));
      res.status(200).json({ status: 'success', data: ficha, message: 'Ficha cerrada exitosamente' });
    } catch (error) { next(error); }
  }

  // PUT /api/grooming/checklist/:id
  static async updateChecklist(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await GroomingService.updateChecklistItem(parseInt(req.params.id), req.body);
      res.status(200).json({ status: 'success', data: item });
    } catch (error) { next(error); }
  }
    /**
   * POST /api/grooming/fichas/:id/regenerar-checklist
   * Regenera el checklist desde la plantilla del servicio
   */
  static async regenerarChecklist(req: Request, res: Response, next: NextFunction) {
    try {
      const fichaId = parseInt(req.params.id);
      
      const ficha = await prisma.fichaGrooming.findUnique({
        where: { id: fichaId },
        include: { cita: true },
      });
      
      if (!ficha) throw new AppError(ErrorCodes.USER_NOT_FOUND, 404, 'Ficha no encontrada');

      // Eliminar checklist existente
      await prisma.checklistFicha.deleteMany({ where: { fichaGroomingId: fichaId } });

      // Cargar plantillas del servicio
      const plantillas = await prisma.plantillaChecklist.findMany({
        where: { servicioId: ficha.cita.servicioId },
        orderBy: { orden: 'asc' },
      });

      if (plantillas.length === 0) {
        return res.status(200).json({
          status: 'success',
          message: 'No hay plantillas configuradas para este servicio. Configura el checklist primero.',
          data: { regenerados: 0 },
        });
      }

      // Crear nuevos items
      await prisma.checklistFicha.createMany({
        data: plantillas.map(p => ({
          fichaGroomingId: fichaId,
          plantillaChecklistId: p.id,
          completado: false,
        })),
      });

      res.status(200).json({
        status: 'success',
        message: `Checklist regenerado con ${plantillas.length} items`,
        data: { regenerados: plantillas.length },
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/grooming/fotos
  static async addFoto(req: Request, res: Response, next: NextFunction) {
    try {
      const foto = await GroomingService.addFoto(req.body);
      res.status(201).json({ status: 'success', data: foto });
    } catch (error) { next(error); }
  }

  // DELETE /api/grooming/fotos/:id
  static async deleteFoto(req: Request, res: Response, next: NextFunction) {
    try {
      await GroomingService.deleteFoto(parseInt(req.params.id));
      res.status(200).json({ status: 'success', message: 'Foto eliminada' });
    } catch (error) { next(error); }
  }

  // POST /api/grooming/insumos
  static async addConsumoInsumo(req: Request, res: Response, next: NextFunction) {
    try {
      const insumo = await GroomingService.addConsumoInsumo(req.body);
      res.status(201).json({ status: 'success', data: insumo });
    } catch (error) { next(error); }
  }

  // PUT /api/grooming/insumos/:id
  static async updateConsumoInsumo(req: Request, res: Response, next: NextFunction) {
    try {
      const insumo = await GroomingService.updateConsumoInsumo(parseInt(req.params.id), req.body);
      res.status(200).json({ status: 'success', data: insumo });
    } catch (error) { next(error); }
  }

  // DELETE /api/grooming/insumos/:id
  static async deleteConsumoInsumo(req: Request, res: Response, next: NextFunction) {
    try {
      await GroomingService.deleteConsumoInsumo(parseInt(req.params.id));
      res.status(200).json({ status: 'success', message: 'Insumo eliminado' });
    } catch (error) { next(error); }
  }
}