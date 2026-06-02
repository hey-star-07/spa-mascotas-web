import { z } from 'zod';

export const addToCartSchema = z.object({
  body: z.object({
    productoId: z.number().int().positive('Producto requerido'),
    varianteId: z.number().int().positive().optional(),
    cantidad: z.number().int().positive('Cantidad debe ser mayor a 0').max(99, 'Máximo 99 unidades'),
  }),
});

export const generarPedidoSchema = z.object({
  body: z.object({
    metodoContacto: z.enum(['WhatsApp', 'Telegram']),
    contactoDestino: z.string().min(5, 'Número de contacto requerido').max(50),
  }),
});