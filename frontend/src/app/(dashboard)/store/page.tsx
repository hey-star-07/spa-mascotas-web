"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { getImageUrl } from "@/lib/images";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { ShoppingBag, Search, Plus, Minus, ShoppingCart, Package } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Producto {
  id: number;
  nombre: string;
  sku: string;
  precioBase: number;
  imagenUrl: string | null;
  descripcion: string | null;
  categoria: { nombre: string } | null;
  variantes: Array<{ id: number; atributo: string; valor: string; stockAdicional: number; precioExtra: number }>;
}

export default function StorePage() {
  const router = useRouter();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    loadProductos();
    loadCartCount();
  }, [search]);

  const loadProductos = async () => {
    try {
      const { data } = await api.get("/store/catalogo", { params: { search: search || undefined } });
      setProductos(data.data || []);
    } catch { toast.error("Error al cargar catálogo"); }
    finally { setLoading(false); }
  };

  const loadCartCount = async () => {
    try {
      const { data } = await api.get("/store/cart");
      setCartCount(data.data?.detalles?.length || 0);
    } catch {}
  };

  const addToCart = async (productoId: number, varianteId?: number) => {
    try {
      await api.post("/store/cart", { productoId, varianteId, cantidad: 1 });
      toast.success("Agregado al carrito");
      loadCartCount();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error");
    }
  };

  if (loading) return <LoadingSpinner text="Cargando tienda..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <ShoppingBag className="h-8 w-8" strokeWidth={3} />
          <div>
            <h1 className="text-3xl font-extrabold">Tienda</h1>
            <p className="text-sm font-semibold text-foreground/70">{productos.length} productos disponibles</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/50" />
            <Input placeholder="Buscar producto..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Button onClick={() => router.push("/store/cart")} className="relative">
            <ShoppingCart className="mr-2 h-5 w-5" /> Carrito
            {cartCount > 0 && (
              <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-[10px]">
                {cartCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Grid de productos */}
      {productos.length === 0 ? (
        <EmptyState icon={<Package className="h-12 w-12" />} title="Sin productos" description="No se encontraron productos" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {productos.map((p) => (
            <Card key={p.id} className="hover:shadow-cartoon-hover transition-all overflow-hidden">
              {/* Imagen */}
              <div className="h-48 bg-secondary flex items-center justify-center border-b-3 border-foreground relative">
                {p.imagenUrl ? (
                  <img src={getImageUrl(p.imagenUrl) || ''} alt={p.nombre} className="w-full h-full object-cover" />
                ) : (
                  <Package className="h-16 w-16 text-foreground/30" />
                )}
                {p.categoria && (
                  <Badge className="absolute top-2 left-2 text-[10px]">{p.categoria.nombre}</Badge>
                )}
              </div>
              <CardContent className="pt-4 space-y-3">
                <div>
                  <h3 className="font-extrabold text-lg truncate">{p.nombre}</h3>
                  <p className="text-xs text-foreground/50">{p.sku}</p>
                </div>
                {p.descripcion && <p className="text-xs line-clamp-2">{p.descripcion}</p>}
                <div className="flex items-center justify-between">
                  <p className="text-xl font-extrabold">Bs. {Number(p.precioBase).toFixed(2)}</p>
                  <Button size="sm" variant="accent" onClick={() => addToCart(p.id, p.variantes[0]?.id)}>
                    <Plus className="h-4 w-4 mr-1" /> Agregar
                  </Button>
                </div>
                {p.variantes.length > 1 && (
                  <p className="text-[10px] text-foreground/50">{p.variantes.length} variantes disponibles</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}