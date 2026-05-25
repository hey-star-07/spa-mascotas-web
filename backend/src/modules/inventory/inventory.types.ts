export interface CreateProductoDTO {
  sku: string;
  nombre: string;
  descripcion?: string;
  categoriaId?: number;
  precioBase: number;
  stockMinimo?: number;
  imagenUrl?: string;
}

export interface UpdateProductoDTO {
  nombre?: string;
  descripcion?: string;
  categoriaId?: number;
  precioBase?: number;
  stockMinimo?: number;
  imagenUrl?: string;
  activo?: boolean;
}

export interface CreateVarianteDTO {
  productoId: number;
  atributo: string;
  valor: string;
  skuVariante: string;
  precioExtra?: number;
  stockAdicional?: number;
}

export interface InventoryAlert {
  productoId: number;
  nombre: string;
  sku: string;
  stockActual: number;
  stockMinimo: number;
  variantes: Array<{
    id: number;
    atributo: string;
    valor: string;
    stockAdicional: number;
  }>;
}

export interface MovimientoInventario {
  productoId: number;
  varianteId?: number;
  tipo: 'entrada' | 'salida' | 'merma' | 'devolucion';
  cantidad: number;
  motivo: string;
  fichaGroomingId?: number;
  groomerId?: number;
}