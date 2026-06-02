"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import { getImageUrl } from "@/lib/images";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { ArrowLeft, Package, Plus, Minus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [producto, setProducto] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cantidad, setCantidad] = useState(1);
  const [selectedVariante, setSelectedVariante] = useState<number | null>(null);

  useEffect(() => {
    api.get(`/inventory/productos/${params.id}`)
      .then(({ data }) => {
        setProducto(data.data);
        if (data.data.variantes?.length > 0) {
          setSelectedVariante(data.data.variantes[0].id);
        }
      })
      .catch(() => router.push("/store"))
      .finally(() => setLoading(false));
  }, [params.id]);

  const addToCart = async () => {
    try {
      await api.post("/store/cart", {
        productoId: producto.id,
        varianteId: selectedVariante,
        cantidad,
      });
      toast.success("Agregado al carrito");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error");
    }
  };

  if (loading) return <LoadingSpinner text="Cargando producto..." />;
  if (!producto) return null;

  const stockTotal = producto.variantes?.reduce((sum: number, v: any) => sum + v.stockAdicional, 0) || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => router.push("/store")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Volver a la tienda
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Imagen */}
        <Card>
          <div className="h-80 bg-secondary flex items-center justify-center rounded-t-xl border-b-3 border-foreground">
            {producto.imagenUrl ? (
              <img src={getImageUrl(producto.imagenUrl) || ''} alt={producto.nombre} className="w-full h-full object-cover rounded-t-xl" />
            ) : (
              <Package className="h-24 w-24 text-foreground/30" />
            )}
          </div>
        </Card>

        {/* Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">{producto.nombre}</CardTitle>
              {producto.categoria && <Badge>{producto.categoria.nombre}</Badge>}
            </div>
            <p className="text-xs font-mono text-foreground/50">SKU: {producto.sku}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {producto.descripcion && <p className="text-sm">{producto.descripcion}</p>}
            
            <p className="text-3xl font-extrabold">Bs. {Number(producto.precioBase).toFixed(2)}</p>

            {producto.variantes?.length > 0 && (
              <div>
                <p className="text-sm font-bold mb-2">Variante:</p>
                <div className="flex flex-wrap gap-2">
                  {producto.variantes.map((v: any) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariante(v.id)}
                      className={`px-3 py-2 rounded-xl border-2 border-foreground text-sm font-bold transition-all ${
                        selectedVariante === v.id ? "bg-primary shadow-cartoon-sm" : "bg-white hover:bg-primary/20"
                      }`}
                    >
                      {v.valor} ({v.stockAdicional} uds)
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" onClick={() => setCantidad(Math.max(1, cantidad - 1))}>
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-xl font-bold w-8 text-center">{cantidad}</span>
              <Button variant="outline" size="icon" onClick={() => setCantidad(Math.min(99, cantidad + 1))}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <Button onClick={addToCart} className="w-full" variant="accent" size="lg" disabled={stockTotal === 0}>
              <ShoppingCart className="mr-2 h-5 w-5" />
              {stockTotal === 0 ? "Agotado" : `Agregar al carrito - Bs. ${(Number(producto.precioBase) * cantidad).toFixed(2)}`}
            </Button>

            <p className="text-xs text-foreground/50 text-center">
              Stock disponible: {stockTotal} unidades
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}