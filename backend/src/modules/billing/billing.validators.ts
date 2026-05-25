import { z } from 'zod';

export const createFacturaSchema = z.object({
  body: z.object({
    citaId: z.number().int().positive().optional(),
    pedidoId: z.number().int().positive().optional(),
    clienteId: z.number().int().positive('Cliente requerido'),
    subtotal: z.number().min(0),
    impuesto: z.number().min(0).optional().default(0),
    total: z.number().min(0),
    metodoPago: z.enum(['Efectivo', 'QR', 'Transferencia']).optional(),
  }),
});

export const createPagoSchema = z.object({
  body: z.object({
    facturaId: z.number().int().positive(),
    monto: z.number().positive('Monto requerido'),
    metodoPago: z.enum(['Efectivo', 'QR', 'Transferencia']),
    referenciaTransaccion: z.string().max(100).optional(),
  }),
});

export const createDetalleSchema = z.object({
  body: z.object({
    facturaId: z.number().int().positive(),
    concepto: z.string().min(1, 'Concepto requerido'),
    cantidad: z.number().int().positive(),
    precioUnitario: z.number().min(0),
    total: z.number().min(0),
  }),
});