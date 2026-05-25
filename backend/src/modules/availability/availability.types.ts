export interface CreateAvailabilityDTO {
  groomerId: number;
  diaSemana: number; // 0=Domingo, 1=Lunes...6=Sábado
  horaInicio: string; // "09:00"
  horaFin: string; // "18:00"
  intervaloDescanso?: { inicio: string; fin: string };
}

export interface CreateBloqueoDTO {
  groomerId?: number | null; // null = global
  tipo: 'FERIADO' | 'VACACIONES' | 'MANTENIMIENTO' | 'AUSENCIA';
  fechaInicio: string;
  fechaFin: string;
  descripcion?: string;
}