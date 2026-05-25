import { z } from 'zod';

export const createAppointmentSchema = z.object({
  body: z.object({
    mascotaId: z.number().int().positive('Mascota requerida'),
    groomerId: z.number().int().positive('Groomer requerido').optional(),
    servicioId: z.number().int().positive('Servicio requerido'),
    fechaHoraInicio: z.string().datetime('Fecha inválida'),
    duracionEstimadaMinutos: z.number().int().min(15).max(480),
    notas: z.string().max(500).optional(),
  }),
});

export const updateAppointmentSchema = z.object({
  body: z.object({
    groomerId: z.number().int().positive().optional(),
    servicioId: z.number().int().positive().optional(),
    fechaHoraInicio: z.string().datetime().optional(),
    fechaHoraFin: z.string().datetime().optional(),
    estado: z.enum(['Agendada', 'Confirmada', 'EnProgreso', 'Completada', 'Cancelada', 'NoAsistio']).optional(),
    estadoSolicitud: z.enum(['Solicitada', 'EnRevision', 'Aprobada', 'Rechazada']).optional(),
    notas: z.string().max(500).optional(),
  }),
  params: z.object({
    id: z.string().regex(/^\d+$/).transform(Number),
  }),
});

export const appointmentFiltersSchema = z.object({
  query: z.object({
    fecha: z.string().optional(),
    groomerId: z.string().optional(),
    clienteId: z.string().optional(),
    estado: z.string().optional(),
    mascotaId: z.string().optional(),
  }),
});