"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getImageUrl } from "@/lib/images";
import { Package, Plus, ShoppingCart } from "lucide-react";

interface ProductCardProps {
  producto: {
    id: number;
    nombre: string;
    sku: string;
    precioBase: number;
    imagenUrl: string | null;
    descripcion: string | null;
    categoria: { nombre: string } | null;
    variantes: Array<{ id: number; atributo: string; valor: string; stockAdicional: number; precioExtra: number }>;
  };
  onAddToCart: (productoId: number, varianteId?: number) => void;
}

export function ProductCard({ producto, onAddToCart }: ProductCardProps) {
  const stockTotal = producto.variantes.reduce((sum, v) => sum + v.stockAdicional, 0);

  return (
    <Card className="hover:shadow-cartoon-hover transition-all overflow-hidden group">
      <div className="h-48 bg-secondary flex items-center justify-center border-b-3 border-foreground relative">
        {producto.imagenUrl ? (
          <img src={getImageUrl(producto.imagenUrl) || ''} alt={producto.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <Package className="h-16 w-16 text-foreground/30" />
        )}
        {producto.categoria && (
          <Badge className="absolute top-2 left-2 text-[10px]">{producto.categoria.nombre}</Badge>
        )}
        {stockTotal <= 5 && stockTotal > 0 && (
          <Badge variant="destructive" className="absolute top-2 right-2 text-[10px]">Quedan {stockTotal}</Badge>
        )}
        {stockTotal === 0 && (
          <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center">
            <Badge variant="destructive" className="text-lg px-4 py-2">AGOTADO</Badge>
          </div>
        )}
      </div>
      <CardContent className="pt-4 space-y-3">
        <div>
          <h3 className="font-extrabold text-lg truncate">{producto.nombre}</h3>
          <p className="text-xs text-foreground/50">{producto.sku}</p>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xl font-extrabold">Bs. {Number(producto.precioBase).toFixed(2)}</p>
          <Button
            size="sm"
            variant="accent"
            onClick={() => onAddToCart(producto.id, producto.variantes[0]?.id)}
            disabled={stockTotal === 0}
          >
            <ShoppingCart className="h-4 w-4 mr-1" /> Agregar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}