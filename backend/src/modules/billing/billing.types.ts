export interface CreateFacturaDTO {
  citaId?: number;
  pedidoId?: number;
  clienteId: number;
  subtotal: number;
  impuesto?: number;
  total: number;
  metodoPago?: 'Efectivo' | 'QR' | 'Transferencia';
}

export interface CreatePagoDTO {
  facturaId: number;
  monto: number;
  metodoPago: 'Efectivo' | 'QR' | 'Transferencia';
  referenciaTransaccion?: string;
}

export interface CreateDetalleFacturaDTO {
  facturaId: number;
  concepto: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
}

export interface FacturaResponse {
  id: number;
  numeroFactura: string;
  fechaEmision: Date;
  subtotal: number;
  impuesto: number;
  total: number;
  estado: string;
  metodoPago: string | null;
  cliente: {
    id: number;
    usuario: { nombre: string; apellido: string; email: string };
  };
  detalles: Array<{
    id: number;
    concepto: string;
    cantidad: number;
    precioUnitario: number;
    total: number;
  }>;
  pagos: Array<{
    id: number;
    monto: number;
    metodoPago: string;
    referenciaTransaccion: string | null;
    estado: string;
    fechaPago: Date;
  }>;
}