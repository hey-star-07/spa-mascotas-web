import { z } from 'zod';

export const createFichaSchema = z.object({
  body: z.object({
    citaId: z.number().int().positive('Cita requerida'),
    razaTamanoMomento: z.string().optional(),
    temperaturaAnimal: z.number().optional(),
    notasInternas: z.string().optional(),
  }),
});

export const updateFichaSchema = z.object({
  body: z.object({
    razaTamanoMomento: z.string().optional(),
    temperaturaAnimal: z.number().optional(),
    notasInternas: z.string().optional(),
    fechaCierre: z.string().optional(),
  }),
  params: z.object({
    id: z.string().regex(/^\d+$/).transform(Number),
  }),
});

export const createChecklistSchema = z.object({
  body: z.object({
    fichaGroomingId: z.number().int().positive(),
    plantillaChecklistId: z.number().int().positive(),
    completado: z.boolean(),
    observacion: z.string().optional(),
  }),
});

export const createFotoSchema = z.object({
  body: z.object({
    fichaGroomingId: z.number().int().positive(),
    tipo: z.enum(['antes', 'despues']),
    urlFoto: z.string().min(1, 'URL requerida'),
  }),
});

export const createConsumoInsumoSchema = z.object({
  body: z.object({
    fichaGroomingId: z.number().int().positive(),
    productoId: z.number().int().positive(),
    varianteId: z.number().int().positive().optional(),
    cantidad: z.number().positive('Cantidad requerida'),
  }),
});