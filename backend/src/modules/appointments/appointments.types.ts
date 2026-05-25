export interface CreateAppointmentDTO {
  mascotaId: number;
  groomerId: number;
  servicioId: number;
  fechaHoraInicio: string;
  duracionEstimadaMinutos: number;
  notas?: string;
}

export interface UpdateAppointmentDTO {
  groomerId?: number;
  servicioId?: number;
  fechaHoraInicio?: string;
  fechaHoraFin?: string;
  duracionEstimadaMinutos?: number;
  estado?: 'Agendada' | 'Confirmada' | 'EnProgreso' | 'Completada' | 'Cancelada' | 'NoAsistio';
  estadoSolicitud?: 'Solicitada' | 'EnRevision' | 'Aprobada' | 'Rechazada';
  notas?: string;
}

export interface AppointmentFilters {
  fecha?: string;
  groomerId?: number;
  clienteId?: number;
  estado?: string;
  mascotaId?: number;
}