import { z } from 'zod';

export const createServiceSchema = z.object({
  body: z.object({
    nombre: z.string().min(2, 'Nombre requerido').max(200),
    descripcion: z.string().max(500).optional(),
    duracionBaseMinutos: z.number().int().min(15, 'Mínimo 15 minutos').max(480, 'Máximo 8 horas'),
    precioBase: z.number().min(0, 'Precio no puede ser negativo'),
    permiteDobleBooking: z.boolean().optional(),
    factorTamanoRaza: z.number().min(0).max(1).optional(),
    requiereBloqueConsecutivo: z.boolean().optional(),
  }),
});

export const updateServiceSchema = z.object({
  body: z.object({
    nombre: z.string().min(2).max(200).optional(),
    descripcion: z.string().max(500).optional(),
    duracionBaseMinutos: z.number().int().min(15).max(480).optional(),
    precioBase: z.number().min(0).optional(),
    permiteDobleBooking: z.boolean().optional(),
    factorTamanoRaza: z.number().min(0).max(1).optional(),
    requiereBloqueConsecutivo: z.boolean().optional(),
    activo: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().regex(/^\d+$/).transform(Number),
  }),
});