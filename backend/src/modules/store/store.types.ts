export interface CreateCarritoDTO {
  productoId: number;
  varianteId?: number;
  cantidad: number;
}

export interface CreatePedidoDTO {
  clienteId: number;
  metodoContacto: 'WhatsApp' | 'Telegram';
  contactoDestino: string;
}