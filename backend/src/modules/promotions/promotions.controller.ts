import { Request, Response, NextFunction } from 'express';
import { PromotionsService } from './promotions.service';

export class PromotionsController {
  // GET /api/promotions
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const onlyActive = req.query.active === 'true';
      const promociones = await PromotionsService.getAll(onlyActive);
      res.status(200).json({ status: 'success', data: promociones });
    } catch (error) { next(error); }
  }

  // POST /api/promotions
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const promocion = await PromotionsService.create(req.body);
      res.status(201).json({ status: 'success', data: promocion });
    } catch (error) { next(error); }
  }

  // POST /api/promotions/aplicar-cupon
  static async aplicarCupon(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await PromotionsService.aplicarCupon(req.body);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) { next(error); }
  }

  // PUT /api/promotions/:id
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const promocion = await PromotionsService.update(parseInt(req.params.id), req.body);
      res.status(200).json({ status: 'success', data: promocion });
    } catch (error) { next(error); }
  }

  // DELETE /api/promotions/:id
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await PromotionsService.delete(parseInt(req.params.id));
      res.status(200).json({ status: 'success', message: 'Promoción eliminada' });
    } catch (error) { next(error); }
  }
}