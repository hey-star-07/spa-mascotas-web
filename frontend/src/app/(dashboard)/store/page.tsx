"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { getImageUrl } from "@/lib/images";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  precioPromocional?: number | null;  
  enPromocion?: boolean;              
  imagenUrl: string | null;
  descripcion: string | null;
  categoria: { nombre: string } | null;
  variantes: Array<{ 
    id: number; 
    atributo: string; 
    valor: string; 
    stockAdicional: number; 
    precioExtra: number;
  }>;
}

export default function StorePage() {
  const router = useRouter();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [cantidad, setCantidad] = useState(1);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [categoriaFilter, setCategoriaFilter] = useState("");
  const [selectedVariante, setSelectedVariante] = useState<Record<number, number>>({});

  useEffect(() => {
    loadProductos();
    loadCartCount();
  }, [search, categoriaFilter]);

  // Cargar categorías al montar
  useEffect(() => {
    api.get("/inventory/categorias")
      .then(({ data }) => setCategorias(data.data || []))
      .catch(() => {});
  }, []);

  const loadProductos = async () => {
    try {
      const { data } = await api.get("/store/catalogo", { 
        params: { 
          search: search || undefined,
          categoriaId: categoriaFilter || undefined, 
        } 
      });
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

  const addToCart = async (productoId: number, varianteId?: number, cant: number = 1) => {
    try {
      await api.post("/store/cart", { productoId, varianteId, cantidad: cant });
      toast.success("Agregado al carrito");
      setCantidad(1); // Resetear
      loadCartCount();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error");
    }
  };

  // 👇 Función helper para calcular stock total
  const getStockTotal = (producto: Producto): number => {
    return producto.variantes?.reduce((sum, v) => sum + v.stockAdicional, 0) || 0;
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
          
          {/* 👇 FILTRO POR CATEGORÍA */}
          <select
            value={categoriaFilter}
            onChange={e => setCategoriaFilter(e.target.value)}
            className="h-12 rounded-xl border-3 border-foreground bg-white px-4 font-bold text-sm"
          >
            <option value="">Todas las categorías</option>
            {categorias.map((c: any) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>

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
          {productos.map((p) => {
            const stockTotal = getStockTotal(p); // 👈 Calcular stock por producto
            return (
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
                  {stockTotal === 0 && (
                    <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center">
                      <Badge variant="destructive" className="text-sm px-3 py-1">AGOTADO</Badge>
                    </div>
                  )}
                  {stockTotal > 0 && stockTotal <= 5 && (
                    <Badge variant="destructive" className="absolute top-2 right-2 text-[10px]">
                      Solo {stockTotal}
                    </Badge>
                  )}
                </div>
                <CardContent className="pt-4 space-y-3">
                  <div>
                    <h3 className="font-extrabold text-lg truncate">{p.nombre}</h3>
                    <p className="text-xs text-foreground/50">{p.sku}</p>
                  </div>
                  {p.descripcion && (
                    <p className="text-xs text-foreground/70 line-clamp-2">{p.descripcion}</p>
                  )}
                  
                  {/* Precio */}
                  <div className="flex items-center gap-2">
                    {p.enPromocion && p.precioPromocional ? (
                      <>
                        <p className="text-xl font-extrabold text-rose">Bs. {Number(p.precioPromocional).toFixed(2)}</p>
                        <p className="text-sm text-foreground/50 line-through">Bs. {Number(p.precioBase).toFixed(2)}</p>
                        <Badge variant="destructive" className="text-[10px]">
                          -{Math.round((1 - Number(p.precioPromocional) / Number(p.precioBase)) * 100)}%
                        </Badge>
                      </>
                    ) : (
                      <p className="text-xl font-extrabold">Bs. {Number(p.precioBase).toFixed(2)}</p>
                    )}
                  </div>

                  {/* Selector de cantidad y botón agregar */}
                  <div className="flex items-center gap-2 pt-1">
                    <div className="flex items-center border-2 border-foreground rounded-lg">
                      <button
                        onClick={(e) => { e.stopPropagation(); setCantidad(Math.max(1, cantidad - 1)); }}
                        className="px-2 py-1 text-sm font-bold hover:bg-primary/20 transition-colors"
                        disabled={stockTotal === 0}
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="px-2 py-1 text-sm font-bold min-w-[30px] text-center">{cantidad}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setCantidad(Math.min(stockTotal, cantidad + 1)); }}
                        className="px-2 py-1 text-sm font-bold hover:bg-primary/20 transition-colors"
                        disabled={stockTotal === 0 || cantidad >= stockTotal}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <Button
                      size="sm"
                      variant="accent"
                      onClick={() => addToCart(
                        p.id, 
                        selectedVariante[p.id] || p.variantes[0]?.id, 
                        cantidad
                      )}
                      disabled={stockTotal === 0}
                      className="flex-shrink-0"
                    >
                      <ShoppingCart className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Variantes */}
                  {p.variantes.length > 1 && (
                    <p className="text-[10px] text-foreground/50">{p.variantes.length} variantes disponibles</p>
                  )}
                  {/* Selector de variante */}
                  {p.variantes.length > 1 && (
                    <div className="space-y-1">
                      <Label className="text-[10px]">Variante:</Label>
                      <select
                        value={selectedVariante?.[p.id] || p.variantes[0]?.id || ""}
                        onChange={(e) => {
                          setSelectedVariante({ ...selectedVariante, [p.id]: parseInt(e.target.value) });
                        }}
                        className="w-full h-9 rounded-lg border-2 border-foreground bg-white px-2 text-xs font-bold"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {p.variantes.map((v: any) => (
                          <option key={v.id} value={v.id}>
                            {v.valor} {v.precioExtra > 0 ? `(+Bs. ${v.precioExtra})` : ''} - {v.stockAdicional}u
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}