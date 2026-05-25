import { z } from 'zod';

export const createAvailabilitySchema = z.object({
  body: z.object({
    groomerId: z.number().int().positive(),
    diaSemana: z.number().int().min(0).max(6),
    horaInicio: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM requerido'),
    horaFin: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM requerido'),
    intervaloDescanso: z.object({
      inicio: z.string(),
      fin: z.string(),
    }).optional(),
  }),
});

export const createBloqueoSchema = z.object({
  body: z.object({
    groomerId: z.number().int().positive().nullable().optional(),
    tipo: z.enum(['FERIADO', 'VACACIONES', 'MANTENIMIENTO', 'AUSENCIA']),
    fechaInicio: z.string().datetime(),
    fechaFin: z.string().datetime(),
    descripcion: z.string().max(255).optional(),
  }),
});