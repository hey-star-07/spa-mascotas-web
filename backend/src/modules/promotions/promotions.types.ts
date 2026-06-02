export interface CreatePromocionDTO {
  nombre: string;
  descripcion?: string;
  tipo: 'porcentaje' | 'monto_fijo';
  valor: number;
  fechaInicio: string;
  fechaFin: string;
  productoId?: number;
  servicioId?: number;
  clienteId?: number;
  codigoCupon?: string;
  activo?: boolean;
}

export interface AplicarPromocionDTO {
  codigoCupon: string;
  subtotal: number;
  clienteId?: number;
}