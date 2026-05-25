import { Request, Response, NextFunction } from 'express';
import { InventoryService } from './inventory.service';

export class InventoryController {
  // GET /api/inventory/productos
  static async getProductos(req: Request, res: Response, next: NextFunction) {
    try {
      const productos = await InventoryService.getProductos(req.query as any);
      res.status(200).json({ status: 'success', data: productos, total: productos.length });
    } catch (error) { next(error); }
  }

  // GET /api/inventory/productos/:id
  static async getProductoById(req: Request, res: Response, next: NextFunction) {
    try {
      const producto = await InventoryService.getProductoById(parseInt(req.params.id));
      res.status(200).json({ status: 'success', data: producto });
    } catch (error) { next(error); }
  }

  // POST /api/inventory/productos
  static async createProducto(req: Request, res: Response, next: NextFunction) {
    try {
      const producto = await InventoryService.createProducto(req.body);
      res.status(201).json({ status: 'success', data: producto });
    } catch (error) { next(error); }
  }

  // PUT /api/inventory/productos/:id
  static async updateProducto(req: Request, res: Response, next: NextFunction) {
    try {
      const producto = await InventoryService.updateProducto(parseInt(req.params.id), req.body);
      res.status(200).json({ status: 'success', data: producto });
    } catch (error) { next(error); }
  }

  // POST /api/inventory/variantes
  static async createVariante(req: Request, res: Response, next: NextFunction) {
    try {
      const variante = await InventoryService.createVariante(req.body);
      res.status(201).json({ status: 'success', data: variante });
    } catch (error) { next(error); }
  }

  // PUT /api/inventory/variantes/:id/stock
  static async updateStock(req: Request, res: Response, next: NextFunction) {
    try {
      const { cantidad } = req.body;
      const variante = await InventoryService.updateStockVariante(parseInt(req.params.id), cantidad);
      res.status(200).json({ status: 'success', data: variante });
    } catch (error) { next(error); }
  }

  // GET /api/inventory/alertas
  static async getAlertas(req: Request, res: Response, next: NextFunction) {
    try {
      const alertas = await InventoryService.getAlertasBajoStock();
      res.status(200).json({ status: 'success', data: alertas, total: alertas.length });
    } catch (error) { next(error); }
  }

  // GET /api/inventory/resumen
  static async getResumen(req: Request, res: Response, next: NextFunction) {
    try {
      const resumen = await InventoryService.getResumenInventario();
      res.status(200).json({ status: 'success', data: resumen });
    } catch (error) { next(error); }
  }

  // POST /api/inventory/movimientos
  static async registrarMovimiento(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await InventoryService.registrarMovimiento(req.body);
      res.status(201).json({ status: 'success', ...result });
    } catch (error) { next(error); }
  }

  // GET /api/inventory/consumo
  static async getConsumo(req: Request, res: Response, next: NextFunction) {
    try {
      const { groomerId, desde, hasta } = req.query;
      const consumo = await InventoryService.getConsumoPorGroomer(
        groomerId ? parseInt(groomerId as string) : undefined,
        desde as string,
        hasta as string
      );
      res.status(200).json({ status: 'success', data: consumo });
    } catch (error) { next(error); }
  }
}