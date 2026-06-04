import { Request, Response, NextFunction } from 'express';
import { ReportsService } from './reports.service';
import prisma from '../../config/database';

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
}