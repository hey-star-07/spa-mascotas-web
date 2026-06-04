"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/auth-store";
import { getImageUrl } from "@/lib/images";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { ImageUpload } from "@/components/shared/image-upload";
import { Package, AlertTriangle, Search, Plus, Box, PowerOff, Power } from "lucide-react";
import { toast } from "sonner";

interface Producto {
  id: number;
  sku: string;
  nombre: string;
  precioBase: number;
  stockMinimo: number;
  imagenUrl: string | null;
  activo?: boolean;
  categoria: { nombre: string } | null;
  variantes: Array<{ id: number; atributo: string; valor: string; stockAdicional: number }>;
}

interface Alerta {
  id: number;
  nombre: string;
  sku: string;
  stockActual: number;
  stockMinimo: number;
}

export default function InventoryPage() {
  const { user } = useAuthStore();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showBajoStock, setShowBajoStock] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, alertRes] = await Promise.all([
        api.get("/inventory/productos", { params: { search: search || undefined, bajoStock: showBajoStock } }),
        api.get("/inventory/alertas"),
      ]);
      setProductos(prodRes.data.data || []);
      setAlertas(alertRes.data.data || []);
    } catch { toast.error("Error al cargar inventario"); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [search, showBajoStock]);

  const getStockTotal = (producto: Producto) => {
    return producto.variantes.reduce((sum, v) => sum + v.stockAdicional, 0);
  };

  const toggleActive = async (producto: Producto) => {
    try {
      await api.put(`/inventory/productos/${producto.id}`, { activo: !producto.activo });
      toast.success(producto.activo ? "Producto desactivado" : "Producto activado");
      loadData();
    } catch { toast.error("Error"); }
  };

  if (loading) return <LoadingSpinner text="Cargando inventario..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Box className="h-8 w-8" strokeWidth={3} />
          <div>
            <h1 className="text-3xl font-extrabold">Inventario</h1>
            <p className="text-sm font-semibold text-foreground/70">
              {productos.length} producto{productos.length !== 1 && "s"}
              {alertas.length > 0 && <Badge variant="destructive" className="ml-2">{alertas.length} alertas</Badge>}
            </p>
          </div>
        </div>
        {user?.rol === "Admin" && (
          <Button onClick={() => setDialogOpen(true)}><Plus className="mr-2 h-4 w-4" /> Nuevo Producto</Button>
        )}
      </div>

      {alertas.length > 0 && (
        <Card className="border-rose bg-rose/5">
          <CardHeader><CardTitle className="flex items-center gap-2 text-rose"><AlertTriangle className="h-5 w-5" /> Alertas de Bajo Stock ({alertas.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {alertas.map((a) => (
                <div key={a.id} className="p-3 border-2 border-rose rounded-xl bg-white">
                  <p className="font-extrabold text-sm">{a.nombre}</p>
                  <p className="text-xs">SKU: {a.sku}</p>
                  <p className="text-xs text-rose font-bold mt-1">Stock: {a.stockActual} / Mín: {a.stockMinimo}{a.stockActual === 0 && " - ¡AGOTADO!"}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/50" />
          <Input placeholder="Buscar producto..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Button variant={showBajoStock ? "default" : "outline"} onClick={() => setShowBajoStock(!showBajoStock)}>
          <AlertTriangle className="mr-2 h-4 w-4" /> Bajo Stock
        </Button>
      </div>
      <Button variant="outline" className="relative" onClick={() => window.location.href = '/inventory/alerts'}>
        <AlertTriangle className="mr-2 h-4 w-4" />
        Ver Alertas
        {alertas.length > 0 && (
          <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-[10px]">
            {alertas.length}
          </Badge>
        )}
      </Button>

      {productos.length === 0 ? (
        <EmptyState icon={<Package className="h-12 w-12" />} title="Sin productos" description="No se encontraron productos" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {productos.map((p) => {
            const stock = getStockTotal(p);
            const bajo = stock <= p.stockMinimo;
            return (
              <Card key={p.id} className={`hover:shadow-cartoon-hover transition-all overflow-hidden ${bajo ? "border-rose bg-rose/5" : ""} ${p.activo === false ? "opacity-50" : ""}`}>
                <div className="h-40 bg-secondary flex items-center justify-center border-b-3 border-foreground relative">
                  {p.imagenUrl ? (
                    <img src={getImageUrl(p.imagenUrl) || ''} alt={p.nombre} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-foreground/40">
                      <Package className="h-12 w-12" strokeWidth={2} />
                      <span className="text-xs font-semibold">Sin imagen</span>
                    </div>
                  )}
                  {bajo && <Badge variant="destructive" className="absolute top-2 right-2">{stock === 0 ? "¡AGOTADO!" : "Bajo"}</Badge>}
                </div>
                <CardContent className="pt-4 space-y-3">
                  <div>
                    <h3 className="text-lg font-extrabold truncate">{p.nombre}</h3>
                    <p className="text-xs font-mono text-foreground/50">{p.sku}</p>
                  </div>
                  {p.categoria && <Badge variant="outline" className="text-xs">{p.categoria.nombre}</Badge>}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm"><span className="text-foreground/70">Stock:</span><span className={`font-extrabold ${bajo ? "text-rose" : "text-primary"}`}>{stock} uds</span></div>
                    <div className="flex justify-between text-sm"><span className="text-foreground/70">Mínimo:</span><span className="font-semibold">{p.stockMinimo} uds</span></div>
                    <div className="flex justify-between text-sm"><span className="text-foreground/70">Precio:</span><span className="font-bold text-lg">Bs. {Number(p.precioBase).toFixed(2)}</span></div>
                  </div>
                  {p.variantes.length > 0 && (
                    <div className="border-t-2 border-foreground/20 pt-2">
                      <p className="text-xs font-bold mb-1">Variantes:</p>
                      {p.variantes.map(v => (
                        <div key={v.id} className="flex justify-between text-xs bg-secondary/50 rounded-lg px-2 py-1">
                          <span className="font-semibold">{v.atributo}: {v.valor}</span>
                          <span className="font-bold">{v.stockAdicional} uds</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {user?.rol === "Admin" && (
                    <div className="pt-2">
                      <Button size="sm" variant={p.activo === false ? "default" : "destructive"} onClick={() => toggleActive(p)} className="w-full">
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo Producto</DialogTitle></DialogHeader>
          <NuevoProductoForm onSuccess={() => { setDialogOpen(false); loadData(); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NuevoProductoForm({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState({ sku: "", nombre: "", descripcion: "", precioBase: 0, stockMinimo: 5, imagenUrl: "", esInsumo: false, esTienda: true, unidadMedida: "unidad", categoriaId: "", });
  const [loading, setLoading] = useState(false);
  const [categorias, setCategorias] = useState<any[]>([]);

  useEffect(() => {
    api.get("/inventory/categorias").then(({ data }) => setCategorias(data.data || [])).catch(() => {});
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.post("/inventory/productos", {
        ...form,
        categoriaId: form.categoriaId ? parseInt(form.categoriaId) : undefined,
      });
      toast.success("Producto creado exitosamente");
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al crear producto");
    } finally { setLoading(false); }
  };

 return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      {/* Tipo de producto */}
      <div className="bg-secondary/30 rounded-xl p-3">
        <Label className="text-sm font-extrabold mb-2 block">Tipo de Producto</Label>
        <div className="grid grid-cols-2 gap-3">
          <label className={`flex items-center gap-2 p-3 rounded-xl border-3 cursor-pointer transition-all ${
            form.esTienda ? "border-primary bg-primary/10" : "border-foreground/30"
          }`}>
            <input
              type="checkbox"
              checked={form.esTienda}
              onChange={e => setForm({...form, esTienda: e.target.checked})}
              className="h-5 w-5 rounded accent-primary"
            />
            <div>
              <p className="text-sm font-bold">Tienda</p>
              <p className="text-[10px] text-foreground/50">Visible para clientes</p>
            </div>
          </label>
          <label className={`flex items-center gap-2 p-3 rounded-xl border-3 cursor-pointer transition-all ${
            form.esInsumo ? "border-accent bg-accent/10" : "border-foreground/30"
          }`}>
            <input
              type="checkbox"
              checked={form.esInsumo}
              onChange={e => setForm({...form, esInsumo: e.target.checked})}
              className="h-5 w-5 rounded accent-accent"
            />
            <div>
              <p className="text-sm font-bold">Insumo Técnico</p>
              <p className="text-[10px] text-foreground/50">Uso interno grooming</p>
            </div>
          </label>
        </div>
      </div>

      {/* Datos básicos */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>SKU *</Label>
          <Input value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} placeholder="SHAMP-001" />
        </div>
        <div>
          <Label>Nombre *</Label>
          <Input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} placeholder="Shampoo Premium" />
        </div>
      </div>

      {/* Categoría */}
      <div>
        <Label>Categoría</Label>
        <select
          value={form.categoriaId}
          onChange={e => setForm({...form, categoriaId: e.target.value})}
          className="w-full h-12 rounded-xl border-3 border-foreground bg-white px-4 font-bold"
        >
          <option value="">Sin categoría</option>
          <option value="1">Alimentos</option>
          <option value="2">Accesorios</option>
          <option value="3">Higiene</option>
          <option value="4">Juguetes</option>
          <option value="5">Salud</option>
        </select>
      </div>

      {/* Unidad de medida (solo para insumos) */}
      {form.esInsumo && (
        <div>
          <Label>Unidad de Medida</Label>
          <select
            value={form.unidadMedida}
            onChange={e => setForm({...form, unidadMedida: e.target.value})}
            className="w-full h-12 rounded-xl border-3 border-foreground bg-white px-4 font-bold"
          >
            <option value="unidad">Unidad</option>
            <option value="ml">Mililitros (ml)</option>
            <option value="gr">Gramos (gr)</option>
            <option value="par">Par</option>
            <option value="dosis">Dosis</option>
            <option value="sobre">Sobre</option>
          </select>
        </div>
      )}

      {/* Imagen */}
      <div>
        <Label>Imagen del producto</Label>
        <ImageUpload
          label="Subir imagen"
          onUpload={(url) => setForm({...form, imagenUrl: url})}
        />
        {form.imagenUrl && (
          <p className="text-xs text-primary mt-1 font-semibold">Imagen cargada</p>
        )}
      </div>

      {/* Descripción */}
      <div>
        <Label>Descripción</Label>
        <textarea
          className="w-full min-h-[60px] rounded-xl border-3 border-foreground bg-white p-3 text-sm"
          value={form.descripcion}
          onChange={e => setForm({...form, descripcion: e.target.value})}
          placeholder="Descripción del producto..."
        />
      </div>

      {/* Precio y stock */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Precio Base (Bs.)</Label>
          <Input type="number" value={form.precioBase} onChange={e => setForm({...form, precioBase: parseFloat(e.target.value) || 0})} />
        </div>
        <div>
          <Label>Stock Mínimo</Label>
          <Input type="number" value={form.stockMinimo} onChange={e => setForm({...form, stockMinimo: parseInt(e.target.value) || 0})} />
        </div>
      </div>

      {/* Resumen de lo que se creará */}
      <div className="bg-secondary/30 rounded-xl p-3 text-xs">
        <p className="font-bold mb-1">Se creará:</p>
        <ul className="space-y-0.5">
          {form.esTienda && <li>Producto de tienda - Visible en catálogo</li>}
          {form.esInsumo && <li>Insumo técnico - Asignable a groomers</li>}
          {form.esTienda && form.esInsumo && <li className="text-primary font-bold">Stock compartido entre tienda e insumos</li>}
        </ul>
      </div>

      <DialogFooter>
        <Button onClick={handleSubmit} disabled={loading} className="w-full">
          {loading ? "Creando..." : "Crear Producto"}
        </Button>
      </DialogFooter>
    </div>
  );
}
 
