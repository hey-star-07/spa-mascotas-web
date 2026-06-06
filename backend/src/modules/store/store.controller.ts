import { Request, Response, NextFunction } from 'express';
import { StoreService } from './store.service';
import prisma from '../../config/database';

export class StoreController {
  // GET /api/store/catalogo
  static async getCatalogo(req: Request, res: Response, next: NextFunction) {
    try {
      const productos = await StoreService.getCatalogo(req.query as any);
      res.status(200).json({ status: 'success', data: productos });
    } catch (error) { next(error); }
  }

  // GET /api/store/cart
  static async getCart(req: Request, res: Response, next: NextFunction) {
    try {
      const cart = await StoreService.getCart(req.user!.userId);
      res.status(200).json({ status: 'success', data: cart });
    } catch (error) { next(error); }
  }

  // POST /api/store/cart
  static async addToCart(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await StoreService.addToCart(req.user!.userId, req.body);
      res.status(201).json({ status: 'success', data: item, message: 'Agregado al carrito' });
    } catch (error) { next(error); }
  }

  // DELETE /api/store/cart/:id
  static async removeFromCart(req: Request, res: Response, next: NextFunction) {
    try {
      await StoreService.removeFromCart(parseInt(req.params.id));
      res.status(200).json({ status: 'success', message: 'Eliminado del carrito' });
    } catch (error) { next(error); }
  }

  // POST /api/store/pedido
  static async generarPedido(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const cliente = await prisma.cliente.findUnique({ where: { usuarioId: userId } });
      if (!cliente) throw new Error('Cliente no encontrado');

      const result = await StoreService.generarPedido(userId, {
        clienteId: cliente.id,
        ...req.body,
      });
      res.status(201).json({ status: 'success', data: result });
    } catch (error) { next(error); }
  }

  /**
   * POST /api/store/aplicar-cupon
   * Aplica un cupón de descuento al carrito
   */
  static async aplicarCupon(req: Request, res: Response, next: NextFunction) {
    try {
      const { codigoCupon } = req.body;
      const userId = req.user!.userId;

      if (!codigoCupon) {
        return res.status(400).json({ status: 'error', message: 'Código de cupón requerido' });
      }

      const result = await StoreService.aplicarCuponAlCarrito(userId, codigoCupon);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) { next(error); }
  }

  /**
   * DELETE /api/store/cupon
   * Quita el cupón aplicado del carrito
   */
  static async quitarCupon(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const result = await StoreService.quitarCuponDelCarrito(userId);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) { next(error); }
  }
}