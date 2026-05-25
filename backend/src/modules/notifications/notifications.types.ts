export interface CreateNotificationDTO {
  usuarioId: number;
  tipoEvento: 'CONFIRMACION' | 'RECORDATORIO_24H' | 'RECORDATORIO_2H' | 'LISTO_RECOGER' | 'ENCUESTA' | 'PROMOCION';
  canal: 'Email' | 'WhatsApp' | 'SMS';
  destino: string;
  contenido?: string;
  fechaProgramacion: string;
}