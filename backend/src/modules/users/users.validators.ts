import { z } from 'zod';

export const updateUserSchema = z.object({
  body: z.object({
    nombre: z
      .string()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(100, 'Nombre demasiado largo')
      .trim()
      .optional(),
    apellido: z
      .string()
      .max(100, 'Apellido demasiado largo')
      .trim()
      .optional(),
    telefono: z
      .string()
      .max(20, 'Teléfono demasiado largo')
      .optional(),
  }),
});

export const updateUserAsAdminSchema = z.object({
  body: z.object({
    nombre: z.string().min(2).max(100).trim().optional(),
    apellido: z.string().max(100).trim().optional(),
    telefono: z.string().max(20).optional(),
    rol: z.enum(['Admin', 'Recepcion', 'Groomer', 'Cliente']).optional(),
    activo: z.boolean().optional(),
  }),
});

export const userIdParamsSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID debe ser un número').transform(Number),
  }),
});

export const userListQuerySchema = z.object({
  query: z.object({
    page: z
      .string()
      .regex(/^\d+$/, 'Page debe ser un número')
      .transform(Number)
      .optional()
      .default('1'),
    limit: z
      .string()
      .regex(/^\d+$/, 'Limit debe ser un número')
      .transform(Number)
      .optional()
      .default('10'),
    rol: z.enum(['Admin', 'Recepcion', 'Groomer', 'Cliente']).optional(),
    activo: z
      .string()
      .transform((val) => val === 'true')
      .optional(),
    search: z.string().optional(),
  }),
});