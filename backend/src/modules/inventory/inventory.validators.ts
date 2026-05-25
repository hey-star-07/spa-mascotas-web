import { z } from 'zod';

export const createProductoSchema = z.object({
  body: z.object({
    sku: z.string().min(1, 'SKU requerido').max(50),
    nombre: z.string().min(1, 'Nombre requerido').max(200),
    descripcion: z.string().max(500).optional(),
    categoriaId: z.number().int().positive().optional(),
    precioBase: z.number().min(0, 'Precio no puede ser negativo'),
    stockMinimo: z.number().int().min(0).optional().default(5),
    imagenUrl: z.string().optional(),
  }),
});

export const updateProductoSchema = z.object({
  body: z.object({
    nombre: z.string().min(1).max(200).optional(),
    descripcion: z.string().max(500).optional(),
    categoriaId: z.number().int().positive().optional(),
    precioBase: z.number().min(0).optional(),
    stockMinimo: z.number().int().min(0).optional(),
    imagenUrl: z.string().optional(),
    activo: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().regex(/^\d+$/).transform(Number),
  }),
});

export const createVarianteSchema = z.object({
  body: z.object({
    productoId: z.number().int().positive(),
    atributo: z.string().min(1, 'Atributo requerido'),
    valor: z.string().min(1, 'Valor requerido'),
    skuVariante: z.string().min(1, 'SKU requerido'),
    precioExtra: z.number().min(0).optional().default(0),
    stockAdicional: z.number().int().min(0).optional().default(0),
  }),
});

export const movimientoInventarioSchema = z.object({
  body: z.object({
    productoId: z.number().int().positive(),
    varianteId: z.number().int().positive().optional(),
    tipo: z.enum(['entrada', 'salida', 'merma', 'devolucion']),
    cantidad: z.number().positive('Cantidad requerida'),
    motivo: z.string().min(1, 'Motivo requerido'),
    fichaGroomingId: z.number().int().positive().optional(),
    groomerId: z.number().int().positive().optional(),
  }),
});