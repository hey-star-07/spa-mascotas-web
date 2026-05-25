import { Request, Response, NextFunction } from 'express';
import { PetsService } from './pets.service';
import prisma from '../../config/database';

export class PetsController {
  // GET /api/pets - Obtener mascotas del cliente autenticado
  static async getMyPets(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const cliente = await prisma.cliente.findUnique({ where: { usuarioId: userId } });
      if (!cliente) return res.status(200).json({ status: 'success', data: [] });
      const pets = await PetsService.getByCliente(cliente.id);
      res.status(200).json({ status: 'success', data: pets });
    } catch (error) { next(error); }
  }

  // GET /api/pets/:id
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const pet = await PetsService.getById(parseInt(req.params.id));
      res.status(200).json({ status: 'success', data: pet });
    } catch (error) { next(error); }
  }
    /**
   * GET /api/pets/all - Todas las mascotas (Admin/Recepcion)
   */
  static async getAllPets(req: Request, res: Response, next: NextFunction) {
    try {
      const pets = await prisma.mascota.findMany({
        include: {
          cliente: {
            include: {
              usuario: { select: { nombre: true, apellido: true, email: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      res.status(200).json({ status: 'success', data: pets });
    } catch (error) { next(error); }
}

  // POST /api/pets
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const cliente = await prisma.cliente.findUnique({ where: { usuarioId: userId } });
      if (!cliente) throw new Error('Cliente no encontrado');
      const pet = await PetsService.create(cliente.id, req.body);
      res.status(201).json({ status: 'success', data: pet });
    } catch (error) { next(error); }
  }

  // PUT /api/pets/:id
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const pet = await PetsService.update(parseInt(req.params.id), req.body);
      res.status(200).json({ status: 'success', data: pet });
    } catch (error) { next(error); }
  }

  // DELETE /api/pets/:id
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await PetsService.delete(parseInt(req.params.id));
      res.status(200).json({ status: 'success', message: 'Mascota eliminada' });
    } catch (error) { next(error); }
  }
}