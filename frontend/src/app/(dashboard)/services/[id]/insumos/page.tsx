"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { ArrowLeft, Plus, Trash2, Save, Package, Search } from "lucide-react";
import { toast } from "sonner";

interface InsumoConfig {
  id: number;
  cantidadSugerida: number;
  orden: number;
  producto: { id: number; nombre: string; sku: string; unidadMedida: string };
  variante: { id: number; atributo: string; valor: string } | null;
}

export default function InsumosServicioPage() {
  const params = useParams();
  const router = useRouter();
  const [insumos, setInsumos] = useState<InsumoConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [productos, setProductos] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProducto, setSelectedProducto] = useState<any>(null);
  const [selectedVarianteId, setSelectedVarianteId] = useState<number | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [saving, setSaving] = useState(false);
  const [servicioNombre, setServicioNombre] = useState("");

  const loadData = async () => {
    try {
      const [servicioRes, insumosRes, prodRes] = await Promise.all([
        api.get(`/services/${params.id}`),
        api.get(`/inventory/insumos-servicio/${params.id}`),
        api.get("/inventory/insumos-tecnicos"),
      ]);
      setServicioNombre(servicioRes.data.data?.nombre || "Servicio");
      setInsumos(insumosRes.data.data || []);
      setProductos(prodRes.data.data || []);
    } catch { toast.error("Error al cargar"); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [params.id]);

  const addInsumo = () => {
    if (!selectedProducto) return;

    // Si el producto tiene variantes y no se seleccionó una, usar la primera
    const varianteId = selectedVarianteId || selectedProducto.variantes?.[0]?.id || null;
    const variante = selectedProducto.variantes?.find((v: any) => v.id === varianteId);

    const nuevo: InsumoConfig = {
      id: -Date.now(),
      cantidadSugerida: cantidad,
      orden: insumos.length + 1,
      producto: {
        id: selectedProducto.id,
        nombre: selectedProducto.nombre,
        sku: selectedProducto.sku,
        unidadMedida: selectedProducto.unidadMedida || 'unidad',
      },
      variante: variante ? {
        id: variante.id,
        atributo: variante.atributo,
        valor: variante.valor,
      } : null,
    };

    setInsumos([...insumos, nuevo]);
    setSelectedProducto(null);
    setSelectedVarianteId(null);
    setCantidad(1);
    setSearchTerm("");
  };

  const removeInsumo = (index: number) => {
    setInsumos(insumos.filter((_, i) => i !== index));
  };

  const updateCantidad = (index: number, value: number) => {
    const nuevos = [...insumos];
    nuevos[index].cantidadSugerida = Math.max(1, value);
    setInsumos(nuevos);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post(`/inventory/insumos-servicio/${params.id}`, {
        insumos: insumos.map(i => ({
          productoId: i.producto.id,
          varianteId: i.variante?.id || null,
          cantidadSugerida: i.cantidadSugerida,
          orden: i.orden,
        })),
      });
      toast.success("Insumos configurados exitosamente");
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al guardar");
    } finally { setSaving(false); }
  };

  const filteredProductos = productos.filter(p =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 5);

  if (loading) return <LoadingSpinner text="Cargando..." />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => router.push("/services")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Servicios
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8" strokeWidth={3} />
            <div>
              <CardTitle>Insumos: {servicioNombre}</CardTitle>
              <CardDescription>
                Configura los insumos que se asignarán automáticamente al crear una cita.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Lista de insumos configurados */}
          {insumos.length === 0 ? (
            <EmptyState
              icon={<Package className="h-12 w-12" />}
              title="Sin insumos configurados"
              description="Agrega los insumos necesarios para este servicio"
            />
          ) : (
            <div className="space-y-2">
              {insumos.map((insumo, index) => (
                <div key={insumo.id} className="flex items-center justify-between p-3 border-2 border-foreground rounded-xl">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-xs font-bold text-foreground/40 w-5">{index + 1}.</span>
                    <div>
                      <p className="font-bold text-sm">{insumo.producto.nombre}</p>
                      {insumo.variante ? (
                        <Badge variant="outline" className="text-[10px]">
                          {insumo.variante.atributo}: {insumo.variante.valor}
                        </Badge>
                      ) : (
                        <span className="text-[10px] text-foreground/50">Sin variante específica</span>
                      )}
                      <p className="text-xs text-foreground/50">SKU: {insumo.producto.sku}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => updateCantidad(index, insumo.cantidadSugerida - 1)}>−</Button>
                      <Input
                        type="number"
                        value={insumo.cantidadSugerida}
                        onChange={e => updateCantidad(index, parseInt(e.target.value) || 1)}
                        className="w-16 h-8 text-center text-sm"
                        min="1"
                      />
                      <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => updateCantidad(index, insumo.cantidadSugerida + 1)}>+</Button>
                    </div>
                    <span className="text-xs text-foreground/50">{insumo.producto.unidadMedida}</span>
                    <Button variant="destructive" size="sm" onClick={() => removeInsumo(index)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Buscar y agregar insumo */}
          <div className="border-t-3 border-foreground pt-4 space-y-3">
            <p className="font-extrabold text-sm">Agregar insumo</p>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50" />
              <Input
                placeholder="Buscar producto del inventario..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Resultados de búsqueda */}
            {searchTerm && filteredProductos.length > 0 && (
              <div className="border-2 border-foreground rounded-xl overflow-hidden">
                {filteredProductos.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { 
                      setSelectedProducto(p); 
                      setSelectedVarianteId(p.variantes?.[0]?.id || null);
                      setSearchTerm(""); 
                    }}
                    className={`w-full text-left p-3 hover:bg-primary/10 transition-colors border-b border-foreground/10 last:border-b-0 ${
                      selectedProducto?.id === p.id ? 'bg-primary/20' : ''
                    }`}
                  >
                    <p className="font-bold text-sm">{p.nombre}</p>
                    <p className="text-xs text-foreground/50">SKU: {p.sku} • {p.unidadMedida || 'unidad'}</p>
                    {p.variantes?.length > 0 && (
                      <p className="text-[10px] text-foreground/40 mt-0.5">
                        {p.variantes.length} variante(s): {p.variantes.map((v: any) => `${v.valor}(${v.stockAdicional}u)`).join(', ')}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Producto seleccionado */}
            {selectedProducto && (
              <div className="bg-primary/10 border-2 border-primary rounded-xl p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm">{selectedProducto.nombre}</p>
                    <p className="text-xs">SKU: {selectedProducto.sku}</p>
                  </div>
                </div>

                {/* 👇 SELECTOR DE VARIANTE */}
                {selectedProducto.variantes?.length > 0 && (
                  <div>
                    <Label className="text-xs">Variante:</Label>
                    <select
                      value={selectedVarianteId || ""}
                      onChange={e => setSelectedVarianteId(e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full h-10 rounded-lg border-2 border-foreground bg-white px-3 text-xs font-bold"
                    >
                      <option value="">Sin variante (genérico)</option>
                      {selectedProducto.variantes.map((v: any) => (
                        <option key={v.id} value={v.id}>
                          {v.atributo}: {v.valor} — Stock: {v.stockAdicional}u
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Cantidad */}
                <div className="flex items-center gap-3">
                  <Label className="text-xs">Cantidad:</Label>
                  <Input
                    type="number"
                    value={cantidad}
                    onChange={e => setCantidad(parseInt(e.target.value) || 1)}
                    className="w-20 h-9 text-center text-sm"
                    min="1"
                  />
                  <span className="text-xs text-foreground/50">{selectedProducto.unidadMedida || 'uds'}</span>
                </div>

                {/* Resumen de lo que se agregará */}
                <div className="bg-white/50 rounded-lg p-2 text-xs">
                  <p>
                    Se agregará: <strong>{selectedProducto.nombre}</strong>
                    {selectedVarianteId && selectedProducto.variantes && (
                      <> — <Badge variant="outline" className="text-[10px]">
                        {selectedProducto.variantes.find((v: any) => v.id === selectedVarianteId)?.valor}
                      </Badge></>
                    )}
                    {' '}× {cantidad} {selectedProducto.unidadMedida || 'uds'}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="accent" onClick={addInsumo} className="flex-1">
                    <Plus className="mr-1 h-3 w-3" /> Agregar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setSelectedProducto(null); setSelectedVarianteId(null); }}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSave} className="w-full" disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Guardando..." : `Guardar Configuración (${insumos.length} insumos)`}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}