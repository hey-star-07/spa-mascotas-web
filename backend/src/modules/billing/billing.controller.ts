import { Request, Response, NextFunction } from 'express';
import { BillingService } from './billing.service';
import prisma from '../../config/database';

export class BillingController {
  // GET /api/billing/facturas
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const facturas = await BillingService.getAll(req.query as any);
      res.status(200).json({ status: 'success', data: facturas, total: facturas.length });
    } catch (error) { next(error); }
  }

  // GET /api/billing/facturas/mis-facturas (Cliente)
  static async getMyFacturas(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const cliente = await prisma.cliente.findUnique({ where: { usuarioId: userId } });
      if (!cliente) return res.status(200).json({ status: 'success', data: [] });
      const facturas = await BillingService.getByCliente(cliente.id);
      res.status(200).json({ status: 'success', data: facturas });
    } catch (error) { next(error); }
  }

  // GET /api/billing/facturas/:id
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const factura = await BillingService.getById(parseInt(req.params.id));
      res.status(200).json({ status: 'success', data: factura });
    } catch (error) { next(error); }
  }

  // POST /api/billing/facturas
  static async createFactura(req: Request, res: Response, next: NextFunction) {
    try {
      const factura = await BillingService.createFactura(req.body);
      res.status(201).json({ status: 'success', data: factura });
    } catch (error) { next(error); }
  }

  // POST /api/billing/detalles
  static async addDetalle(req: Request, res: Response, next: NextFunction) {
    try {
      const detalle = await BillingService.addDetalle(req.body);
      res.status(201).json({ status: 'success', data: detalle });
    } catch (error) { next(error); }
  }

  // POST /api/billing/pagos
  static async registrarPago(req: Request, res: Response, next: NextFunction) {
    try {
      const pago = await BillingService.registrarPago(req.body);
      res.status(201).json({ status: 'success', data: pago, message: 'Pago registrado exitosamente' });
    } catch (error) { next(error); }
  }

  // GET /api/billing/facturas/:id/qr
  static async generarQR(req: Request, res: Response, next: NextFunction) {
    try {
      const qrImage = await BillingService.generarQRPago(parseInt(req.params.id));
      res.status(200).json({ status: 'success', data: { qrImage } });
    } catch (error) { next(error); }
  }

  // GET /api/billing/cierre-caja
  static async getCierreCaja(req: Request, res: Response, next: NextFunction) {
    try {
      const { fecha } = req.query;
      const resumen = await BillingService.getCierreCaja(fecha as string);
      res.status(200).json({ status: 'success', data: resumen });
    } catch (error) { next(error); }
  }
}