export interface CreateFichaDTO {
  citaId: number;
  razaTamanoMomento?: string;
  temperaturaAnimal?: number;
  notasInternas?: string;
  estadoIngreso?: string;
  comportamiento?: string;
  recomendaciones?: string;
}

export interface UpdateFichaDTO {
  razaTamanoMomento?: string;
  temperaturaAnimal?: number;
  notasInternas?: string;
  estadoIngreso?: string;       
  comportamiento?: string;     
  recomendaciones?: string; 
  fechaCierre?: string;
}

export interface CreateChecklistDTO {
  fichaGroomingId: number;
  plantillaChecklistId: number;
  completado: boolean;
  observacion?: string;
}

export interface CreateFotoDTO {
  fichaGroomingId: number;
  tipo: 'antes' | 'despues';
  urlFoto: string;
}

export interface CreateConsumoInsumoDTO {
  fichaGroomingId: number;
  productoId: number;
  varianteId?: number;
  cantidad: number;
}

export interface UpdateConsumoInsumoDTO {
  merma?: boolean;
  devuelto?: boolean;
  cantidadDevuelta?: number;
}