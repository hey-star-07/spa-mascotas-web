import prisma from '../../config/database';
import QRCode from 'qrcode';
import { AppError } from '../../shared/errors/AppError';
import { ErrorCodes } from '../../shared/errors/errorCodes';
import { CreateFacturaDTO, CreatePagoDTO, CreateDetalleFacturaDTO, FacturaResponse } from './billing.types';

export class BillingService {
  // ============================================
  // FACTURAS
  // ============================================

  // Generar número de factura secuencial
  static async generarNumeroFactura(): Promise<string> {
    const ultima = await prisma.factura.findFirst({
      orderBy: { id: 'desc' },
      select: { numeroFactura: true },
    });

    const ultimoNumero = ultima ? parseInt(ultima.numeroFactura.replace('FAC-', '')) : 0;
    const nuevoNumero = ultimoNumero + 1;
    return `FAC-${nuevoNumero.toString().padStart(6, '0')}`;
  }

  // Obtener todas las facturas
  static async getAll(params?: { clienteId?: number; estado?: string; fechaDesde?: string; fechaHasta?: string }) {
    const where: any = {};

    if (params?.clienteId) where.clienteId = parseInt(params.clienteId as any);
    if (params?.estado) where.estado = params.estado;
    if (params?.fechaDesde || params?.fechaHasta) {
      where.fechaEmision = {};
      if (params.fechaDesde) where.fechaEmision.gte = new Date(params.fechaDesde);
      if (params.fechaHasta) where.fechaEmision.lte = new Date(params.fechaHasta);
    }

    return prisma.factura.findMany({
      where,
      include: {
        cliente: {
          include: { usuario: { select: { nombre: true, apellido: true, email: true } } },
        },
        detalles: true,
        pagos: true,
        cita: { select: { id: true, mascota: { select: { nombre: true } } } },
      },
      orderBy: { fechaEmision: 'desc' },
    });
  }

  // Obtener factura por ID
  static async getById(id: number): Promise<FacturaResponse> {
    const factura = await prisma.factura.findUnique({
      where: { id },
      include: {
        cliente: { include: { usuario: { select: { nombre: true, apellido: true, email: true } } } },
        detalles: true,
        pagos: true,
        cita: { include: { mascota: { select: { nombre: true } }, servicio: { select: { nombre: true } } } },
      },
    });
    if (!factura) throw new AppError(ErrorCodes.USER_NOT_FOUND, 404, 'Factura no encontrada');
    return factura as any;
  }

  // Obtener facturas de un cliente
  static async getByCliente(clienteId: number) {
    return prisma.factura.findMany({
      where: { clienteId },
      include: {
        detalles: true,
        pagos: true,
        cita: { include: { servicio: { select: { nombre: true } } } },
      },
      orderBy: { fechaEmision: 'desc' },
    });
  }

  // Crear factura
  static async createFactura(data: CreateFacturaDTO) {
    const numeroFactura = await this.generarNumeroFactura();

    const factura = await prisma.factura.create({
      data: {
        numeroFactura,
        citaId: data.citaId,
        pedidoId: data.pedidoId,
        clienteId: data.clienteId,
        subtotal: data.subtotal,
        impuesto: data.impuesto || 0,
        total: data.total,
        metodoPago: data.metodoPago,
        estado: 'Pendiente',
      },
      include: {
        cliente: { include: { usuario: { select: { nombre: true } } } },
        detalles: true,
        pagos: true,
      },
    });

    return factura;
  }

  // Agregar detalle a factura
  static async addDetalle(data: CreateDetalleFacturaDTO) {
    return prisma.detalleFactura.create({ data });
  }

  // ============================================
  // PAGOS
  // ============================================

  // Registrar pago
  static async registrarPago(data: CreatePagoDTO) {
    // Verificar que el pago no exceda el total de la factura
    const factura = await prisma.factura.findUnique({
      where: { id: data.facturaId },
      include: { pagos: true },
    });
    if (!factura) throw new AppError(ErrorCodes.USER_NOT_FOUND, 404, 'Factura no encontrada');

    const pagosPrevios = factura.pagos
      .filter(p => p.estado === 'Completado')
      .reduce((sum, p) => sum + Number(p.monto), 0);

    const montoRestante = Number(factura.total) - pagosPrevios;

    if (data.monto > montoRestante) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        422,
        `El monto excede el saldo pendiente. Restante: Bs. ${montoRestante.toFixed(2)}`
      );
    }

    // Registrar pago
    const pago = await prisma.pago.create({
      data: {
        facturaId: data.facturaId,
        monto: data.monto,
        metodoPago: data.metodoPago,
        referenciaTransaccion: data.referenciaTransaccion,
        estado: 'Completado',
      },
    });

    // Actualizar estado de la factura
    const totalPagado = pagosPrevios + data.monto;
    if (totalPagado >= Number(factura.total)) {
      await prisma.factura.update({
        where: { id: data.facturaId },
        data: { estado: 'Pagada' },
      });
    }

    return pago;
  }

  // ============================================
  // QR DE PAGO (generado en el servidor - SIN API EXTERNA)
  // ============================================

  // Generar QR para pago
  static async generarQRPago(facturaId: number): Promise<string> {
    const factura = await prisma.factura.findUnique({
      where: { id: facturaId },
      include: { cliente: { include: { usuario: { select: { nombre: true } } } } },
    });
    if (!factura) throw new AppError(ErrorCodes.USER_NOT_FOUND, 404, 'Factura no encontrada');

    // Datos para el QR (formato simple para transferencias bolivianas)
    const qrData = JSON.stringify({
      factura: factura.numeroFactura,
      total: Number(factura.total),
      cliente: factura.cliente.usuario.nombre,
      fecha: factura.fechaEmision.toISOString(),
    });

    // Generar QR como imagen base64 usando la librería qrcode
    const qrImage = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: { dark: '#2D2D2D', light: '#FFFFFF' },
    });

    return qrImage;
  }

  // ============================================
  // CIERRE DE CAJA
  // ============================================

  // Resumen de caja diario
  static async getCierreCaja(fecha?: string) {
    const fechaConsulta = fecha ? new Date(fecha) : new Date();
    const inicio = new Date(fechaConsulta);
    inicio.setHours(0, 0, 0, 0);
    const fin = new Date(fechaConsulta);
    fin.setHours(23, 59, 59, 999);

    const pagos = await prisma.pago.findMany({
      where: {
        fechaPago: { gte: inicio, lte: fin },
        estado: 'Completado',
      },
      include: {
        factura: { select: { numeroFactura: true } },
      },
    });

    const resumen = {
      fecha: fechaConsulta.toISOString().split('T')[0],
      totalCobrado: pagos.reduce((sum, p) => sum + Number(p.monto), 0),
      totalPagos: pagos.length,
      porMetodo: {
        Efectivo: pagos.filter(p => p.metodoPago === 'Efectivo').reduce((sum, p) => sum + Number(p.monto), 0),
        QR: pagos.filter(p => p.metodoPago === 'QR').reduce((sum, p) => sum + Number(p.monto), 0),
        Transferencia: pagos.filter(p => p.metodoPago === 'Transferencia').reduce((sum, p) => sum + Number(p.monto), 0),
      },
    };

    return resumen;
  }
}