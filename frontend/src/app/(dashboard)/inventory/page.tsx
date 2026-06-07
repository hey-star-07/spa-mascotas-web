"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/auth-store";
import { getImageUrl } from "@/lib/images";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { ImageUpload } from "@/components/shared/image-upload";
import {
  Package, AlertTriangle, Search, Plus, Box, PowerOff, Power,
  ShoppingBag, Scissors, Pencil, PackagePlus
} from "lucide-react";
import { toast } from "sonner";

interface Producto {
  id: number;
  sku: string;
  nombre: string;
  descripcion?: string;
  precioBase: number;
  precioPromocional?: number | null;  
  enPromocion?: boolean; 
  stockMinimo: number;
  imagenUrl: string | null;
  activo?: boolean;
  esInsumo?: boolean;
  esTienda?: boolean;
  unidadMedida?: string;
  categoria: { id: number; nombre: string } | null;
  variantes: Array<{ 
    id: number; 
    atributo: string; 
    valor: string; 
    stockAdicional: number;
    precioExtra?: number;  // 👈 Agregado (para variantes con precio extra)
  }>;
}

interface Alerta { id: number; nombre: string; sku: string; stockActual: number; stockMinimo: number; }

export default function InventoryPage() {
  const { user } = useAuthStore();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showBajoStock, setShowBajoStock] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [restockOpen, setRestockOpen] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null);
  const [alertasTiendaCount, setAlertasTiendaCount] = useState(0);
  const [alertasInsumosCount, setAlertasInsumosCount] = useState(0);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [categoriaFilter, setCategoriaFilter] = useState("");
  const [tipoFilter, setTipoFilter] = useState("todos");

  useEffect(() => {
    Promise.all([api.get("/inventory/alertas/tienda"), api.get("/inventory/alertas/insumos")])
      .then(([t, i]) => { setAlertasTiendaCount(t.data.total || 0); setAlertasInsumosCount(i.data.total || 0); })
      .catch(() => {});
  }, []);

  // Cargar categorías al montar
  useEffect(() => {
    api.get("/inventory/categorias")
      .then(({ data }) => setCategorias(data.data || []))
      .catch(() => {});
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, alertRes] = await Promise.all([
        api.get("/inventory/productos", { 
          params: { 
            search: search || undefined, 
            bajoStock: showBajoStock,
            categoriaId: categoriaFilter || undefined,
            tipo: tipoFilter !== "todos" ? tipoFilter : undefined,
          } 
        }),
        api.get("/inventory/alertas"),
      ]);
      setProductos(prodRes.data.data || []);
      setAlertas(alertRes.data.data || []);
    } catch { toast.error("Error al cargar inventario"); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [search, showBajoStock, categoriaFilter]);

  const getStockTotal = (p: Producto) => p.variantes.reduce((s, v) => s + v.stockAdicional, 0);

  const toggleActive = async (p: Producto) => {
    try {
      await api.put(`/inventory/productos/${p.id}`, { activo: !p.activo });
      toast.success(p.activo ? "Desactivado" : "Activado");
      loadData();
    } catch { toast.error("Error"); }
  };

  if (loading) return <LoadingSpinner text="Cargando inventario..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Box className="h-8 w-8" strokeWidth={3} />
          <div>
            <h1 className="text-3xl font-extrabold">Inventario</h1>
            <p className="text-sm font-semibold text-foreground/70">
              {productos.length} productos
              {alertas.length > 0 && <Badge variant="destructive" className="ml-2">{alertas.length} alertas</Badge>}
            </p>
          </div>
        </div>
        {user?.rol === "Admin" && (
          <Button onClick={() => setDialogOpen(true)}><Plus className="mr-2 h-4 w-4" /> Nuevo Producto</Button>
        )}
      </div>

      {/* Links alertas */}
      <div className="flex items-center gap-2">
        <Link href="/inventory/alerts?tab=tienda">
          <Button variant="outline" size="sm" className="relative">
            <ShoppingBag className="mr-1 h-4 w-4" /> Tienda
            {alertasTiendaCount > 0 && <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-[10px]">{alertasTiendaCount}</Badge>}
          </Button>
        </Link>
        <Link href="/inventory/alerts?tab=insumos">
          <Button variant="outline" size="sm" className="relative">
            <Scissors className="mr-1 h-4 w-4" /> Insumos
            {alertasInsumosCount > 0 && <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-[10px]">{alertasInsumosCount}</Badge>}
          </Button>
        </Link>
      </div>

      {/* Banner alertas rápido */}
      {alertas.length > 0 && (
        <div className="bg-rose/5 border-2 border-rose rounded-2xl px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-rose" />
            <span className="font-extrabold text-rose text-sm">{alertas.length} producto{alertas.length > 1 ? "s" : ""} con stock bajo</span>
            <div className="flex flex-wrap gap-1">
              {alertas.slice(0,3).map(a => (
                <span key={a.id} className="text-xs bg-rose/10 px-2 py-0.5 rounded-full font-semibold border border-rose/30">
                  {a.nombre} ({a.stockActual}/{a.stockMinimo})
                </span>
              ))}
              {alertas.length > 3 && <span className="text-xs text-rose font-bold">+{alertas.length - 3} más</span>}
            </div>
          </div>
          <Link href="/inventory/alerts"><Button size="sm" variant="destructive">Ver todas</Button></Link>
        </div>
      )}

      {/* Barra de filtros */}
      <div className="flex gap-3 flex-wrap items-end">
        {/* Buscador */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/50" />
          <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-12 text-sm" />
        </div>

        {/* Categoría (select nativo) */}
        <select
          value={categoriaFilter}
          onChange={e => setCategoriaFilter(e.target.value)}
          className="h-12 rounded-xl border-3 border-foreground bg-white px-4 font-bold text-sm min-w-[160px]"
        >
          <option value="">Todas las categorías</option>
          {categorias.map((c: any) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>

        {/* Tipo (botones con iconos) */}
        <div className="flex gap-1">
          {[
            { value: "todos", label: "Todos", icon: <Package className="h-4 w-4" /> },
            { value: "tienda", label: "Tienda", icon: <ShoppingBag className="h-4 w-4" /> },
            { value: "insumo", label: "Insumos", icon: <Scissors className="h-4 w-4" /> },
          ].map(btn => (
            <button
              key={btn.value}
              onClick={() => setTipoFilter(btn.value)}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border-3 border-foreground text-sm font-bold transition-all ${
                tipoFilter === btn.value
                  ? "bg-foreground text-background shadow-cartoon-sm"
                  : "bg-white hover:bg-primary/20"
              }`}
            >
              {btn.icon}
              <span className="hidden sm:inline">{btn.label}</span>
            </button>
          ))}
        </div>

        {/* Bajo Stock */}
        <Button
          variant={showBajoStock ? "default" : "outline"}
          onClick={() => setShowBajoStock(!showBajoStock)}
          size="sm"
          className="h-12"
        >
          <AlertTriangle className="mr-2 h-4 w-4" />
          Bajo Stock
        </Button>
      </div>

      {/* Grid */}
      {productos.length === 0 ? (
        <EmptyState icon={<Package className="h-12 w-12" />} title="Sin productos" description="No se encontraron productos" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {productos.map((p) => {
            const stock = getStockTotal(p);
            const bajo = stock < p.stockMinimo;
            const enMinimo = stock === p.stockMinimo;
            return (
              <Card key={p.id} className={`hover:shadow-cartoon-hover transition-all overflow-hidden flex flex-col
                ${bajo ? "border-rose bg-rose/5" : enMinimo ? "border-amber-400 bg-amber-50" : ""}
                ${p.activo === false ? "opacity-50" : ""}`}>

                {/* Imagen */}
                <div className="h-36 bg-secondary flex items-center justify-center border-b-3 border-foreground relative">
                  {p.imagenUrl ? (
                    <img src={getImageUrl(p.imagenUrl) || ''} alt={p.nombre} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-foreground/40">
                      <Package className="h-10 w-10" strokeWidth={2} />
                      <span className="text-[10px] font-semibold">Sin imagen</span>
                    </div>
                  )}
                  {bajo && <Badge variant="destructive" className="absolute top-2 right-2 text-[10px]">{stock === 0 ? "¡AGOTADO!" : "Bajo"}</Badge>}
                  {enMinimo && <Badge className="absolute top-2 right-2 bg-amber-500 text-white border-0 text-[10px]">En mínimo</Badge>}
                  {p.activo === false && <Badge className="absolute top-2 left-2 bg-gray-400 text-white border-0 text-[10px]">Inactivo</Badge>}
                </div>

                <CardContent className="pt-3 space-y-2 flex-1 flex flex-col">
                  <div>
                    <h3 className="text-base font-extrabold truncate">{p.nombre}</h3>
                    <p className="text-[10px] font-mono text-foreground/40">{p.sku}</p>
                  </div>
                  {p.categoria && <Badge variant="outline" className="text-[10px] self-start">{p.categoria.nombre}</Badge>}

                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-foreground/60">Stock:</span>
                      <span className={`font-extrabold ${bajo ? "text-rose" : enMinimo ? "text-amber-600" : "text-primary"}`}>{stock} uds</span>
                    </div>
                    <div className="flex justify-between"><span className="text-foreground/60">Mínimo:</span><span className="font-semibold">{p.stockMinimo} uds</span></div>
                    <div className="flex justify-between"><span className="text-foreground/60">Precio:</span><span className="font-bold text-sm">Bs. {Number(p.precioBase).toFixed(2)}</span></div>
                  </div>

                  {p.variantes.length > 0 && (
                    <div className="border-t border-foreground/20 pt-1.5 space-y-0.5">
                      {p.variantes.map(v => (
                        <div key={v.id} className="flex justify-between text-[10px] bg-secondary/50 rounded px-1.5 py-0.5">
                          <span className="font-semibold">{v.atributo}: {v.valor}</span>
                          <span className="font-bold">{v.stockAdicional} uds</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Botones acción */}
                  {user?.rol === "Admin" && (
                    <div className="pt-2 mt-auto grid grid-cols-2 gap-1.5">
                      {/* Editar */}
                      <Button size="sm" variant="outline" className="text-xs" onClick={() => { setSelectedProducto(p); setEditOpen(true); }}>
                        <Pencil className="h-3 w-3 mr-1" /> Editar
                      </Button>
                      {/* Reabastecer */}
                      <Button size="sm" variant="secondary" className="text-xs" onClick={() => { setSelectedProducto(p); setRestockOpen(true); }}>
                        <PackagePlus className="h-3 w-3 mr-1" /> Abastecer
                      </Button>
                      {/* Activar/Desactivar — full width */}
                      <Button size="sm" variant={p.activo === false ? "default" : "destructive"} onClick={() => toggleActive(p)} className="col-span-2 text-xs">
                        {p.activo === false ? <><Power className="h-3 w-3 mr-1" /> Activar</> : <><PowerOff className="h-3 w-3 mr-1" /> Desactivar</>}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Crear producto */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent><DialogHeader><DialogTitle>Nuevo Producto</DialogTitle></DialogHeader>
          <NuevoProductoForm onSuccess={() => { setDialogOpen(false); loadData(); }} />
        </DialogContent>
      </Dialog>

      {/* Editar producto */}
      {selectedProducto && (
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent><DialogHeader><DialogTitle>Editar — {selectedProducto.nombre}</DialogTitle></DialogHeader>
            <EditarProductoForm producto={selectedProducto} onSuccess={() => { setEditOpen(false); loadData(); }} />
          </DialogContent>
        </Dialog>
      )}

      {/* Reabastecer */}
      {selectedProducto && (
        <Dialog open={restockOpen} onOpenChange={setRestockOpen}>
          <DialogContent className="max-w-sm"><DialogHeader><DialogTitle className="flex items-center gap-2"><PackagePlus className="h-5 w-5" /> Reabastecer</DialogTitle></DialogHeader>
            <RestockForm producto={selectedProducto} onSuccess={() => { setRestockOpen(false); loadData(); }} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ══════════════════════════════════════
// FORMULARIO NUEVO PRODUCTO
// ══════════════════════════════════════
function NuevoProductoForm({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState({
    sku: "", nombre: "", descripcion: "", precioBase: 0, precioPromocional: 0,
    enPromocion: false, stockInicial: 10, stockMinimo: 5, imagenUrl: "",
    esInsumo: false, esTienda: true, unidadMedida: "unidad", categoriaId: "",
  });
  
  // 👇 VARIANTES
  const [variantes, setVariantes] = useState<Array<{
    atributo: string; valor: string; precioExtra: number; stockAdicional: number;
  }>>([]);
  const [nuevaVariante, setNuevaVariante] = useState({ atributo: "", valor: "", precioExtra: 0, stockAdicional: 10 });
  
  const [loading, setLoading] = useState(false);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [showVariantes, setShowVariantes] = useState(false);

  useEffect(() => {
    api.get("/inventory/categorias").then(({ data }) => setCategorias(data.data || [])).catch(() => {});
  }, []);

  const addVariante = () => {
    if (!nuevaVariante.atributo || !nuevaVariante.valor) {
      return toast.error("Ingresa atributo y valor de la variante");
    }
    setVariantes([...variantes, { ...nuevaVariante }]);
    setNuevaVariante({ atributo: "", valor: "", precioExtra: 0, stockAdicional: 10 });
  };

  const removeVariante = (index: number) => {
    setVariantes(variantes.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!form.sku.trim()) return toast.error("SKU obligatorio");
    if (!form.nombre.trim()) return toast.error("Nombre obligatorio");
    if (form.precioBase <= 0) return toast.error("Precio debe ser mayor a 0");
    
    setLoading(true);
    try {
      await api.post("/inventory/productos", {
        ...form,
        categoriaId: form.categoriaId ? parseInt(form.categoriaId) : undefined,
        variantes: variantes.length > 0 ? variantes.map(v => ({
          atributo: v.atributo,
          valor: v.valor,
          skuVariante: `${form.sku}-${v.valor.toUpperCase().replace(/\s/g, '-')}`,
          precioExtra: v.precioExtra,
          stockAdicional: v.stockAdicional,
        })) : undefined,
      });
      toast.success("Producto creado");
      onSuccess();
    } catch (e: any) { toast.error(e.response?.data?.message || "Error"); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
      {/* SKU + Nombre */}
      <div className="grid grid-cols-2 gap-3">
        <div><Label>SKU *</Label><Input value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} placeholder="SHAMP-001" /></div>
        <div><Label>Nombre *</Label><Input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} /></div>
      </div>

      {/* Categoría */}
      <div>
        <Label>Categoría</Label>
        <select value={form.categoriaId} onChange={e => setForm({...form, categoriaId: e.target.value})} className="w-full h-11 rounded-xl border-3 border-foreground bg-white px-4 font-bold text-sm">
          <option value="">Sin categoría</option>
          {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
      </div>

      {/* Tipo: Tienda / Insumo */}
      <div className="grid grid-cols-2 gap-2">
        <label className={`flex items-center gap-2 p-3 rounded-xl border-3 cursor-pointer ${form.esTienda ? "border-primary bg-primary/10" : "border-foreground/30"}`}>
          <input type="checkbox" checked={form.esTienda} onChange={e => setForm({...form, esTienda: e.target.checked})} className="accent-primary" />
          <div><p className="text-sm font-bold">Tienda</p></div>
        </label>
        <label className={`flex items-center gap-2 p-3 rounded-xl border-3 cursor-pointer ${form.esInsumo ? "border-accent bg-accent/10" : "border-foreground/30"}`}>
          <input type="checkbox" checked={form.esInsumo} onChange={e => setForm({...form, esInsumo: e.target.checked})} className="accent-accent" />
          <div><p className="text-sm font-bold">Insumo</p></div>
        </label>
      </div>

      {/* Imagen + Descripción */}
      <div><Label>Imagen</Label><ImageUpload label="Subir imagen" onUpload={url => setForm({...form, imagenUrl: url})} /></div>
      <div><Label>Descripción</Label><textarea className="w-full min-h-[56px] rounded-xl border-3 border-foreground bg-white p-3 text-sm" value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} /></div>

      {/* Precios */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Precio Base (Bs.) *</Label>
          <Input type="number" min={0} step={0.5} value={form.precioBase} onChange={e => setForm({...form, precioBase: parseFloat(e.target.value) || 0})} />
        </div>
        <div>
          <Label>Precio Promocional (Bs.)</Label>
          <Input type="number" min={0} step={0.5} value={form.precioPromocional} onChange={e => setForm({...form, precioPromocional: parseFloat(e.target.value) || 0, enPromocion: true})} />
        </div>
      </div>
      {form.enPromocion && form.precioPromocional > 0 && (
        <div className="bg-accent/10 border-2 border-accent rounded-xl p-2 text-xs text-center">
          Precio promocional: Bs. {form.precioPromocional} (-{Math.round((1 - form.precioPromocional / form.precioBase) * 100)}%)
        </div>
      )}

      {/* Stock */}
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Stock Inicial</Label><Input type="number" min={0} value={form.stockInicial} onChange={e => setForm({...form, stockInicial: parseInt(e.target.value) || 0})} /></div>
        <div><Label>Stock Mínimo</Label><Input type="number" min={0} value={form.stockMinimo} onChange={e => setForm({...form, stockMinimo: parseInt(e.target.value) || 0})} /></div>
      </div>

      {/* 👇 VARIANTES */}
      <div className="border-t-3 border-foreground pt-3">
        <button
          type="button"
          onClick={() => setShowVariantes(!showVariantes)}
          className="flex items-center gap-2 text-sm font-extrabold hover:text-primary transition-colors"
        >
          {showVariantes ? "▲" : "▼"} Variantes del producto ({variantes.length})
        </button>
        <p className="text-[10px] text-foreground/50 mt-0.5">Tamaños, colores, aromas, presentaciones...</p>

        {showVariantes && (
          <div className="mt-3 space-y-3">
            {/* Lista de variantes agregadas */}
            {variantes.length > 0 && (
              <div className="space-y-2">
                {variantes.map((v, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 border-2 border-foreground rounded-xl text-xs">
                    <span className="flex-1 font-bold">{v.atributo}: {v.valor}</span>
                    <span>+Bs. {v.precioExtra}</span>
                    <span>{v.stockAdicional}u</span>
                    <Button size="sm" variant="destructive" onClick={() => removeVariante(i)}>✕</Button>
                  </div>
                ))}
              </div>
            )}

            {/* Form para agregar variante */}
            <div className="bg-secondary/30 rounded-xl p-3 space-y-2">
              <p className="text-xs font-bold">Nueva variante:</p>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <Label className="text-[10px]">Atributo</Label>
                  <Input
                    placeholder="Tamaño"
                    value={nuevaVariante.atributo}
                    onChange={e => setNuevaVariante({...nuevaVariante, atributo: e.target.value})}
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[10px]">Valor</Label>
                  <Input
                    placeholder="1kg"
                    value={nuevaVariante.valor}
                    onChange={e => setNuevaVariante({...nuevaVariante, valor: e.target.value})}
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[10px]">+Precio</Label>
                  <Input
                    type="number"
                    value={nuevaVariante.precioExtra}
                    onChange={e => setNuevaVariante({...nuevaVariante, precioExtra: parseFloat(e.target.value) || 0})}
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[10px]">Stock</Label>
                  <Input
                    type="number"
                    value={nuevaVariante.stockAdicional}
                    onChange={e => setNuevaVariante({...nuevaVariante, stockAdicional: parseInt(e.target.value) || 0})}
                    className="h-9 text-xs"
                  />
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={addVariante} className="w-full mt-1">
                + Agregar variante
              </Button>
            </div>
          </div>
        )}
      </div>

      <DialogFooter>
        <Button onClick={handleSubmit} disabled={loading || (!form.esTienda && !form.esInsumo)} className="w-full">
          {loading ? "Creando..." : "Crear Producto"}
        </Button>
      </DialogFooter>
    </div>
  );
}

// ══════════════════════════════════════
// FORMULARIO EDITAR PRODUCTO
// ══════════════════════════════════════
function EditarProductoForm({ producto, onSuccess }: { producto: Producto; onSuccess: () => void }) {
  const [form, setForm] = useState({
    nombre: producto.nombre,
    descripcion: producto.descripcion || "",
    precioBase: Number(producto.precioBase),
    precioPromocional: Number(producto.precioPromocional) || 0,
    enPromocion: producto.enPromocion ?? false,
    stockMinimo: producto.stockMinimo,
    imagenUrl: producto.imagenUrl || "",
    categoriaId: producto.categoria?.id ? String(producto.categoria.id) : "",
    esInsumo: producto.esInsumo ?? false,
    esTienda: producto.esTienda ?? true,
  });

  const [loading, setLoading] = useState(false);
  const [categorias, setCategorias] = useState<any[]>([]);

  // 👇 VARIANTES EXISTENTES
  const [variantes, setVariantes] = useState<any[]>(producto.variantes || []);
  const [nuevaVariante, setNuevaVariante] = useState({ atributo: "", valor: "", precioExtra: 0, stockAdicional: 10 });
  const [showVariantes, setShowVariantes] = useState(false);

  useEffect(() => {
    api.get("/inventory/categorias").then(({ data }) => setCategorias(data.data || [])).catch(() => {});
  }, []);

  const addVariante = async () => {
    if (!nuevaVariante.atributo || !nuevaVariante.valor) {
      return toast.error("Ingresa atributo y valor");
    }
    try {
      const { data } = await api.post("/inventory/variantes", {
        productoId: producto.id,
        atributo: nuevaVariante.atributo,
        valor: nuevaVariante.valor,
        skuVariante: `${producto.sku}-${nuevaVariante.valor.toUpperCase().replace(/\s/g, '-')}`,
        precioExtra: nuevaVariante.precioExtra,
        stockAdicional: nuevaVariante.stockAdicional,
      });
      setVariantes([...variantes, data.data]);
      setNuevaVariante({ atributo: "", valor: "", precioExtra: 0, stockAdicional: 10 });
      toast.success("Variante agregada");
    } catch (e: any) { toast.error(e.response?.data?.message || "Error"); }
  };

  const removeVariante = async (varianteId: number) => {
    try {
      // Soft delete - poner stock en 0
      await api.put(`/inventory/variantes/${varianteId}/stock`, { cantidad: 0, tipo: "ajuste" });
      setVariantes(variantes.filter(v => v.id !== varianteId));
      toast.success("Variante eliminada");
    } catch { toast.error("Error al eliminar variante"); }
  };

  const handleSubmit = async () => {
    if (!form.nombre.trim()) return toast.error("Nombre obligatorio");
    setLoading(true);
    try {
      await api.put(`/inventory/productos/${producto.id}`, {
        ...form,
        categoriaId: form.categoriaId ? parseInt(form.categoriaId) : null,
      });
      toast.success("Producto actualizado");
      onSuccess();
    } catch (e: any) { toast.error(e.response?.data?.message || "Error"); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-2">
      <div className="bg-secondary/30 rounded-xl px-3 py-2 text-xs font-mono text-foreground/50">
        SKU: {producto.sku} (no editable)
      </div>

      {/* Nombre + Categoría */}
      <div><Label>Nombre *</Label><Input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} /></div>
      <div>
        <Label>Categoría</Label>
        <select value={form.categoriaId} onChange={e => setForm({...form, categoriaId: e.target.value})} className="w-full h-11 rounded-xl border-3 border-foreground bg-white px-4 font-bold text-sm">
          <option value="">Sin categoría</option>
          {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
      </div>

      {/* Descripción + Imagen */}
      <div><Label>Descripción</Label><textarea className="w-full min-h-[56px] rounded-xl border-3 border-foreground bg-white p-3 text-sm" value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} /></div>
      <div><Label>Imagen</Label><ImageUpload label="Cambiar imagen" currentImage={form.imagenUrl} onUpload={url => setForm({...form, imagenUrl: url})} /></div>

      {/* Precios */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Precio Base (Bs.) *</Label>
          <Input type="number" min={0} step={0.5} value={form.precioBase} onChange={e => setForm({...form, precioBase: parseFloat(e.target.value) || 0})} />
        </div>
        <div>
          <Label>Precio Promocional (Bs.)</Label>
          <Input type="number" min={0} step={0.5} value={form.precioPromocional} onChange={e => setForm({...form, precioPromocional: parseFloat(e.target.value) || 0, enPromocion: true})} />
        </div>
      </div>
      {form.enPromocion && form.precioPromocional > 0 && (
        <div className="bg-accent/10 border-2 border-accent rounded-xl p-2 text-xs text-center">
          En promoción: Bs. {form.precioPromocional} (-{Math.round((1 - form.precioPromocional / form.precioBase) * 100)}%)
        </div>
      )}

      {/* Stock */}
      <div><Label>Stock Mínimo</Label><Input type="number" min={0} value={form.stockMinimo} onChange={e => setForm({...form, stockMinimo: parseInt(e.target.value) || 0})} /></div>

      {/* Tipo */}
      <div className="grid grid-cols-2 gap-2">
        <label className={`flex items-center gap-2 p-3 rounded-xl border-3 cursor-pointer ${form.esTienda ? "border-primary bg-primary/10" : "border-foreground/30"}`}>
          <input type="checkbox" checked={form.esTienda} onChange={e => setForm({...form, esTienda: e.target.checked})} className="accent-primary" />
          <div><p className="text-sm font-bold">Tienda</p></div>
        </label>
        <label className={`flex items-center gap-2 p-3 rounded-xl border-3 cursor-pointer ${form.esInsumo ? "border-accent bg-accent/10" : "border-foreground/30"}`}>
          <input type="checkbox" checked={form.esInsumo} onChange={e => setForm({...form, esInsumo: e.target.checked})} className="accent-accent" />
          <div><p className="text-sm font-bold">Insumo</p></div>
        </label>
      </div>

      {/* 👇 VARIANTES */}
      <div className="border-t-3 border-foreground pt-3">
        <button
          type="button"
          onClick={() => setShowVariantes(!showVariantes)}
          className="flex items-center gap-2 text-sm font-extrabold hover:text-primary transition-colors"
        >
          {showVariantes ? "▲" : "▼"} Variantes ({variantes.length})
        </button>

        {showVariantes && (
          <div className="mt-3 space-y-3">
            {/* Variantes existentes */}
            {variantes.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold">Variantes actuales:</p>
                {variantes.map((v, i) => (
                  <div key={v.id || i} className="flex items-center gap-2 p-2 border-2 border-foreground rounded-xl text-xs">
                    <span className="flex-1 font-bold">{v.atributo}: {v.valor}</span>
                    <span>+Bs. {v.precioExtra || 0}</span>
                    <span>{v.stockAdicional}u</span>
                    <Button size="sm" variant="destructive" onClick={() => removeVariante(v.id)}>✕</Button>
                  </div>
                ))}
              </div>
            )}

            {/* Agregar nueva */}
            <div className="bg-secondary/30 rounded-xl p-3 space-y-2">
              <p className="text-xs font-bold">Agregar variante:</p>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <Label className="text-[10px]">Atributo</Label>
                  <Input placeholder="Tamaño" value={nuevaVariante.atributo} onChange={e => setNuevaVariante({...nuevaVariante, atributo: e.target.value})} className="h-9 text-xs" />
                </div>
                <div>
                  <Label className="text-[10px]">Valor</Label>
                  <Input placeholder="1kg" value={nuevaVariante.valor} onChange={e => setNuevaVariante({...nuevaVariante, valor: e.target.value})} className="h-9 text-xs" />
                </div>
                <div>
                  <Label className="text-[10px]">+Precio</Label>
                  <Input type="number" value={nuevaVariante.precioExtra} onChange={e => setNuevaVariante({...nuevaVariante, precioExtra: parseFloat(e.target.value) || 0})} className="h-9 text-xs" />
                </div>
                <div>
                  <Label className="text-[10px]">Stock</Label>
                  <Input type="number" value={nuevaVariante.stockAdicional} onChange={e => setNuevaVariante({...nuevaVariante, stockAdicional: parseInt(e.target.value) || 0})} className="h-9 text-xs" />
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={addVariante} className="w-full mt-1">
                + Agregar variante
              </Button>
            </div>
          </div>
        )}
      </div>

      <DialogFooter>
        <Button onClick={handleSubmit} disabled={loading} className="w-full">
          {loading ? "Guardando..." : "Guardar cambios"}
        </Button>
      </DialogFooter>
    </div>
  );
}

// ══════════════════════════════════════
// FORMULARIO REABASTECER
// ══════════════════════════════════════
function RestockForm({ producto, onSuccess }: { producto: Producto; onSuccess: () => void }) {
  const stockActual = producto.variantes.reduce((s, v) => s + v.stockAdicional, 0);
  const varianteDefault = producto.variantes[0];
  const [cantidad, setCantidad] = useState(10);
  const [varianteId, setVarianteId] = useState<number>(varianteDefault?.id || 0);
  const [motivo, setMotivo] = useState("Reabastecimiento");
  const [loading, setLoading] = useState(false);

  const varianteSeleccionada = producto.variantes.find(v => v.id === varianteId);
  const nuevoStock = (varianteSeleccionada?.stockAdicional || 0) + cantidad;
  const quedaEnAlerta = nuevoStock < producto.stockMinimo;

  const handleSubmit = async () => {
    if (cantidad <= 0) return toast.error("La cantidad debe ser mayor a 0");
    if (!varianteId) return toast.error("Selecciona una variante");
    setLoading(true);
    try {
      // En el handleSubmit:
      await api.put(`/inventory/variantes/${varianteId}/stock`, { 
        cantidad: cantidad,  // 👈 Positivo
        tipo: "entrada",     // 👈 Explícito
        motivo: motivo || "Reabastecimiento"
      });
      toast.success(`+${cantidad} unidades agregadas a ${producto.nombre}`);
      onSuccess();
    } catch (e: any) { toast.error(e.response?.data?.message || "Error al reabastecer"); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      {/* Info producto */}
      <div className="bg-secondary/30 rounded-xl p-3 space-y-1">
        <p className="font-extrabold">{producto.nombre}</p>
        <p className="text-xs font-mono text-foreground/50">{producto.sku}</p>
        <div className="flex gap-4 text-xs mt-2">
          <span>Stock actual: <strong className={stockActual < producto.stockMinimo ? "text-rose" : "text-primary"}>{stockActual} uds</strong></span>
          <span>Mínimo: <strong>{producto.stockMinimo} uds</strong></span>
        </div>
      </div>

      {/* Variante (si hay más de una) */}
      {producto.variantes.length > 1 && (
        <div>
          <Label>Variante</Label>
          <select value={varianteId} onChange={e => setVarianteId(parseInt(e.target.value))} className="w-full h-11 rounded-xl border-3 border-foreground bg-white px-4 font-bold text-sm">
            {producto.variantes.map(v => (
              <option key={v.id} value={v.id}>{v.atributo}: {v.valor} ({v.stockAdicional} uds)</option>
            ))}
          </select>
        </div>
      )}

      {/* Cantidad */}
      <div>
        <Label>Cantidad a agregar</Label>
        <div className="flex items-center gap-3">
          <button onClick={() => setCantidad(c => Math.max(1, c - 1))} className="h-11 w-11 rounded-xl border-3 border-foreground font-extrabold text-lg hover:bg-secondary/50">−</button>
          <Input type="number" min={1} value={cantidad} onChange={e => setCantidad(parseInt(e.target.value) || 1)} className="text-center text-xl font-extrabold" />
          <button onClick={() => setCantidad(c => c + 1)} className="h-11 w-11 rounded-xl border-3 border-foreground font-extrabold text-lg hover:bg-secondary/50">+</button>
        </div>
        {/* Accesos rápidos */}
        <div className="flex gap-2 mt-2">
          {[5, 10, 25, 50].map(n => (
            <button key={n} onClick={() => setCantidad(n)} className={`flex-1 py-1.5 rounded-lg border-2 text-xs font-bold transition-all ${cantidad === n ? "border-primary bg-primary/10" : "border-foreground/30 hover:bg-secondary/50"}`}>+{n}</button>
          ))}
        </div>
      </div>

      {/* Motivo */}
      <div>
        <Label>Motivo</Label>
        <select value={motivo} onChange={e => setMotivo(e.target.value)} className="w-full h-11 rounded-xl border-3 border-foreground bg-white px-4 font-bold text-sm">
          <option value="Reabastecimiento">Reabastecimiento regular</option>
          <option value="Compra">Compra a proveedor</option>
          <option value="Donación">Donación / Regalo</option>
          <option value="Devolución">Devolución de cliente</option>
          <option value="Ajuste">Ajuste de inventario</option>
        </select>
      </div>

      {/* Preview */}
      <div className={`rounded-xl p-3 border-2 text-sm ${quedaEnAlerta ? "bg-rose/10 border-rose" : "bg-primary/10 border-primary"}`}>
        <p className="font-bold mb-1">{quedaEnAlerta ? "⚠️ Seguirá en alerta" : "✓ Quedará en stock saludable"}</p>
        <div className="flex justify-between text-xs">
          <span>Stock actual: {varianteSeleccionada?.stockAdicional || 0} uds</span>
          <span>+ {cantidad} uds</span>
          <span className="font-extrabold">= {nuevoStock} uds</span>
        </div>
      </div>

      <DialogFooter>
        <Button onClick={handleSubmit} disabled={loading} className="w-full">
          {loading ? "Abasteciendo..." : `Agregar ${cantidad} unidades`}
        </Button>
      </DialogFooter>
    </div>
  );
} 