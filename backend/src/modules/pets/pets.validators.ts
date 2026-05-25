import { z } from 'zod';

export const createPetSchema = z.object({
  body: z.object({
    nombre: z.string().min(1, 'Nombre requerido').max(100),
    especie: z.string().max(50).optional().default('Canino'),
    raza: z.string().max(100).optional(),
    tamanio: z.enum(['Pequeño', 'Mediano', 'Grande', 'Gigante']).optional(),
    fechaNacimiento: z.string().optional(),
    pesoKg: z.number().positive().optional(),
    temperamento: z.enum(['Tranquilo', 'Jugueton', 'Agresivo', 'Timido', 'Indiferente', 'Nervioso']).optional(),
    alergiasConocidas: z.string().optional(),
    restriccionesMedicas: z.string().optional(),
  }),
});

export const updatePetSchema = z.object({
  body: z.object({
    nombre: z.string().min(1).max(100).optional(),
    especie: z.string().max(50).optional(),
    raza: z.string().max(100).optional(),
    tamanio: z.enum(['Pequeño', 'Mediano', 'Grande', 'Gigante']).optional(),
    fechaNacimiento: z.string().optional(),
    pesoKg: z.number().positive().optional(),
    temperamento: z.enum(['Tranquilo', 'Jugueton', 'Agresivo', 'Timido', 'Indiferente', 'Nervioso']).optional(),
    alergiasConocidas: z.string().optional(),
    restriccionesMedicas: z.string().optional(),
  }),
  params: z.object({
    id: z.string().regex(/^\d+$/).transform(Number),
  }),
});