"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/axios";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle, ShoppingBag, Scissors, RefreshCw,
  Search, TrendingDown, Package, PackagePlus,
  TrendingUp, User
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

// ============================================
// TIPOS
// ============================================
interface AlertaProducto {
  id: number;
  nombre: string;
  sku: string;
  tipo: string;
  stockActual: number;
  stockMinimo: number;
  porcentaje: number;
  urgencia: string;
  unidadMedida?: string;
  recomendacion?: string;
  variantes: Array<{ id: number; atributo: string; valor: string; stockAdicional: number }>;
}

type TabType = "todos" | "tienda" | "insumos";

const PRIORIDAD_STYLE: Record<string, { dot: string; badge: string; bar: string }> = {
  Crítica: { dot: "bg-rose",   badge: "bg-rose text-white",   bar: "bg-rose" },
  Alta:    { dot: "bg-orange-500", badge: "bg-orange-100 text-orange-700 border border-orange-300", bar: "bg-orange-500" },
  Media:   { dot: "bg-amber-400",  badge: "bg-amber-100 text-amber-700 border border-amber-300",   bar: "bg-amber-400" },
  Normal:  { dot: "bg-primary",    badge: "bg-primary/20 text-foreground border border-primary/40", bar: "bg-primary" },
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function InventoryAlertsPage() {
  const searchParams = useSearchParams();
  const [alertasTienda, setAlertasTienda]   = useState<AlertaProducto[]>([]);
  const [alertasInsumos, setAlertasInsumos] = useState<AlertaProducto[]>([]);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>((searchParams.get("tab") as TabType) || "todos");
  const [search, setSearch]     = useState("");
  const [restockOpen, setRestockOpen] = useState(false);
  const [selectedAlerta, setSelectedAlerta] = useState<AlertaProducto | null>(null);

  // ============================================
  // CARGA DE DATOS
  // ============================================
  const loadData = async () => {
    setLoading(true);
    try {
      const [tiendaRes, insumosRes] = await Promise.all([
        api.get("/inventory/alertas/tienda"),
        api.get("/inventory/alertas/insumos"),
      ]);
      setAlertasTienda(tiendaRes.data.data || []);
      setAlertasInsumos(insumosRes.data.data || []);
    } catch { toast.error("Error al cargar alertas"); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  // ============================================
  // DATOS DERIVADOS
  // ============================================
  
  // Unificar sin duplicados
  const todas = useMemo(() => {
    const mapa = new Map<number, AlertaProducto>();
    for (const a of alertasInsumos) mapa.set(a.id, { ...a, tipo: a.tipo || 'insumo' });
    for (const a of alertasTienda) {
      if (mapa.has(a.id)) {
        const existente = mapa.get(a.id)!;
        mapa.set(a.id, { ...existente, tipo: 'ambos' });
      } else {
        mapa.set(a.id, { ...a, tipo: 'tienda' });
      }
    }
    return Array.from(mapa.values());
  }, [alertasTienda, alertasInsumos]);

  const listaBase: AlertaProducto[] = useMemo(() => {
    switch (activeTab) {
      case "tienda":  return alertasTienda;
      case "insumos": return alertasInsumos;
      default:        return todas;
    }
  }, [activeTab, todas, alertasTienda, alertasInsumos]);

  const lista = useMemo(() => {
    const q = search.toLowerCase();
    const filtered = q 
      ? listaBase.filter(a => a.nombre.toLowerCase().includes(q) || a.sku.toLowerCase().includes(q)) 
      : listaBase;
    
    // Ordenar por urgencia
    const orden: Record<string, number> = { Crítica: 0, Alta: 1, Media: 2, Normal: 3 };
    return [...filtered].sort((a, b) => (orden[a.urgencia] ?? 9) - (orden[b.urgencia] ?? 9));
  }, [listaBase, search]);

  const counts = useMemo(() => ({
    Crítica: lista.filter(a => a.urgencia === 'Crítica').length,
    Alta:    lista.filter(a => a.urgencia === 'Alta').length,
    Media:   lista.filter(a => a.urgencia === 'Media').length,
    Normal:  lista.filter(a => a.urgencia === 'Normal').length,
  }), [lista]);

  if (loading) return <LoadingSpinner text="Cargando alertas..." />;

  return (
    <div className="space-y-5">
      {/* ============================================ */}
      {/* HEADER                                         */}
      {/* ============================================ */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-7 w-7 text-rose" strokeWidth={3} />
          <div>
            <h1 className="text-2xl font-extrabold">Alertas de Inventario</h1>
            <p className="text-sm text-foreground/60">{todas.length} alertas en total</p>
          </div>
        </div>
        <div className="flex gap-8">
        <Link href="/inventory/alerts/alto-consumo">
          <Button 
            size="default"
            className="bg-rose text-foreground border-3 border-foreground shadow-cartoon-sm hover:shadow-cartoon-hover hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
          >
            <TrendingUp className="mr-1.5 h-3.5 w-3.5" /> Alto Consumo
          </Button>
        </Link>
        <Button 
          variant="outline" 
          size="default" 
          onClick={loadData}
          className="border-3 border-foreground shadow-cartoon-sm hover:shadow-cartoon-hover hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
        >
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Actualizar
        </Button>
        <Link href="/inventory">
          <Button 
            size="default" 
            className="bg-lavender text-foreground border-3 border-foreground shadow-cartoon-sm hover:shadow-cartoon-hover hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
          >
            <Package className="mr-1.5 h-3.5 w-3.5" /> Inventario
          </Button>
        </Link>
      </div>
      </div>

      {/* ============================================ */}
      {/* TABS                                           */}
      {/* ============================================ */}
      <div className="flex gap-1.5 flex-wrap">
        {([
          { key: "todos" as TabType,   label: "Todos",   icon: <AlertTriangle className="h-3.5 w-3.5" />, count: todas.length },
          { key: "tienda" as TabType,  label: "Tienda",  icon: <ShoppingBag className="h-3.5 w-3.5" />, count: alertasTienda.length },
          { key: "insumos" as TabType, label: "Insumos", icon: <Scissors className="h-3.5 w-3.5" />, count: alertasInsumos.length },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 text-sm font-bold transition-all ${
              activeTab === t.key
                ? "border-foreground bg-foreground text-background shadow-cartoon-sm"
                : "border-foreground/30 hover:border-foreground/60 bg-white"
            }`}>
            {t.icon} {t.label}
            {t.count > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === t.key ? "bg-rose text-white" : "bg-rose/20 text-rose"
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ============================================ */}
      {/* CHIPS DE PRIORIDAD                             */}
      {/* ============================================ */}
      {lista.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {(Object.entries(counts) as [string, number][]).filter(([, n]) => n > 0).map(([p, n]) => (
            <div key={p} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${PRIORIDAD_STYLE[p]?.badge || ''}`}>
              <span className={`inline-block w-2 h-2 rounded-full ${PRIORIDAD_STYLE[p]?.dot || ''}`} />
              {p}: {n}
            </div>
          ))}
          <span className="text-xs text-foreground/50 self-center">— {lista.length} alertas{search ? " filtradas" : ""}</span>
        </div>
      )}

      {/* ============================================ */}
      {/* BUSCADOR                                      */}
      {/* ============================================ */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
        <Input placeholder="Buscar por nombre o SKU..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10 text-sm" />
      </div>

      {/* ============================================ */}
      {/* LISTA DE ALERTAS (SIN EXPANSIÓN)              */}
      {/* ============================================ */}
      {lista.length === 0 ? (
        <EmptyState
          icon={<AlertTriangle className="h-12 w-12" />}
          title="Sin alertas"
          description={search ? "Ningún producto coincide con la búsqueda" : "¡Excelente! Todos los productos tienen stock suficiente."}
        />
      ) : (
        <div className="space-y-3">
          {lista.map((a) => {
            const style = PRIORIDAD_STYLE[a.urgencia] || PRIORIDAD_STYLE["Normal"];
            // Porcentaje respecto al doble del mínimo (para que 100% = stock saludable)
            const barPct = a.stockMinimo > 0 ? Math.min(Math.round((a.stockActual / (a.stockMinimo * 2)) * 100), 100) : 0;
            
            return (
              <div key={a.id} className={`bg-white rounded-xl border-2 p-4 transition-all ${
                a.urgencia === 'Crítica' ? 'border-rose shadow-rose/20 shadow-md' :
                a.urgencia === 'Alta' ? 'border-orange-400' : 'border-foreground/20'
              }`}>
                
                {/* Fila superior: icono + nombre + badge + botón */}
                <div className="flex items-start gap-3 mb-3">
                  {/* Icono de tipo */}
                  <div className={`rounded-lg border-2 border-foreground p-2.5 shrink-0 ${
                    a.urgencia === 'Crítica' ? 'bg-rose/20' : 
                    a.urgencia === 'Alta' ? 'bg-orange-100' : 'bg-secondary/30'
                  }`}>
                    {a.tipo === 'ambos' ? (
                      <div className="flex gap-0.5">
                        <ShoppingBag className="h-5 w-5" />
                        <Scissors className="h-4 w-4" />
                      </div>
                    ) : a.tipo === 'tienda' ? (
                      <ShoppingBag className="h-5 w-5" />
                    ) : (
                      <Scissors className="h-5 w-5" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-base">{a.nombre}</h3>
                      <Badge className={`${style.badge} text-[10px]`}>{a.urgencia}</Badge>
                      {a.tipo === 'ambos' && (
                        <Badge variant="outline" className="text-[10px]">Tienda + Insumo</Badge>
                      )}
                      {a.unidadMedida && (
                        <Badge variant="outline" className="text-[10px]">{a.unidadMedida}</Badge>
                      )}
                    </div>
                    <p className="text-[10px] font-mono text-foreground/40 mt-0.5">SKU: {a.sku}</p>
                  </div>

                  {/* Botón abastecer */}
                  <button
                    onClick={() => { setSelectedAlerta(a); setRestockOpen(true); }}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 border-2 border-primary/30 text-xs font-bold transition-all"
                  >
                    <PackagePlus className="h-4 w-4" />
                    <span className="hidden sm:inline">Abastecer</span>
                  </button>
                </div>

                {/* Barra de progreso GRANDE */}
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="flex items-center gap-1.5">
                      <TrendingDown className={`h-4 w-4 ${a.stockActual === 0 ? 'text-rose' : 'text-foreground/50'}`} />
                      Stock actual:
                    </span>
                    <span className={a.stockActual === 0 ? 'text-rose' : ''}>
                      <strong className="text-lg">{a.stockActual}</strong>
                      <span className="text-sm text-foreground/50"> / {a.stockMinimo} mínimo</span>
                    </span>
                  </div>
                  
                  {/* Barra visual */}
                  <div className="relative h-5 bg-gray-100 rounded-xl border-2 border-foreground overflow-hidden">
                    <div
                      className={`h-full rounded-xl transition-all duration-500 flex items-center justify-end pr-3 ${
                        barPct <= 25 ? 'bg-rose' : barPct <= 50 ? 'bg-orange-400' : 'bg-primary'
                      }`}
                      style={{ width: `${Math.max(barPct, 2)}%`, minWidth: barPct > 0 ? '30px' : '0' }}
                    >
                      {barPct > 10 && (
                        <span className="text-sm font-extrabold text-white drop-shadow-md">
                          {barPct}%
                        </span>
                      )}
                    </div>
                    {/* Línea de mínimo */}
                    <div 
                      className="absolute top-0 h-full w-0.5 bg-foreground/60 border-l-2 border-dashed border-foreground"
                      style={{ left: '50%' }}
                      title="Nivel mínimo recomendado"
                    />
                    {/* Etiquetas */}
                    <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none">
                      <span className="text-[10px] font-bold text-foreground/30">0</span>
                      <span className="text-[10px] font-bold text-foreground/30">Mín</span>
                      <span className="text-[10px] font-bold text-foreground/30">Óptimo</span>
                    </div>
                  </div>
                </div>

                {/* Variantes (solo si hay más de 1) */}
                {a.variantes.length > 1 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {a.variantes.map(v => (
                      <span key={v.id} className={`text-xs px-2 py-1 rounded-lg border font-semibold ${
                        v.stockAdicional === 0 ? "border-rose bg-rose/10 text-rose" : 
                        "border-foreground/20 bg-secondary/40"
                      }`}>
                        {v.valor}: <strong>{v.stockAdicional}</strong>u
                      </span>
                    ))}
                  </div>
                )}

                {/* 👇 RECOMENDACIÓN DE REABASTECIMIENTO */}
                {a.recomendacion && (
                  <div className={`p-3 rounded-xl border-2 flex items-start gap-2 ${
                    a.urgencia === 'Crítica' ? 'bg-rose/10 border-rose' :
                    a.urgencia === 'Alta' ? 'bg-orange-50 border-orange-300' : 
                    'bg-secondary/30 border-foreground/20'
                  }`}>
                    <ShoppingBag className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                      a.urgencia === 'Crítica' ? 'text-rose' : 
                      a.urgencia === 'Alta' ? 'text-orange-500' : 'text-foreground/50'
                    }`} />
                    <div>
                      <p className={`text-xs font-extrabold mb-0.5 ${
                        a.urgencia === 'Crítica' ? 'text-rose' : 
                        a.urgencia === 'Alta' ? 'text-orange-600' : ''
                      }`}>
                        Recomendación de reabastecimiento:
                      </p>
                      <p className="text-xs font-semibold">{a.recomendacion}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================ */}
      {/* MODAL REABASTECER                             */}
      {/* ============================================ */}
      {selectedAlerta && (
        <Dialog open={restockOpen} onOpenChange={setRestockOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <PackagePlus className="h-5 w-5" /> Reabastecer
              </DialogTitle>
            </DialogHeader>
            <AlertaRestockForm alerta={selectedAlerta} onSuccess={() => { setRestockOpen(false); loadData(); }} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ============================================
// FORMULARIO REABASTECER (SIN CAMBIOS)
// ============================================
function AlertaRestockForm({ alerta, onSuccess }: { alerta: AlertaProducto; onSuccess: () => void }) {
  const varianteDefault = alerta.variantes[0];
  const [cantidad, setCantidad] = useState(Math.max(1, alerta.stockMinimo - alerta.stockActual + 5));
  const [varianteId, setVarianteId] = useState<number>(varianteDefault?.id || 0);
  const [motivo, setMotivo] = useState("Reabastecimiento");
  const [loading, setLoading] = useState(false);

  const v = alerta.variantes.find(x => x.id === varianteId);
  const nuevoStock = (v?.stockAdicional || 0) + cantidad;

  const handleSubmit = async () => {
    if (cantidad <= 0) return toast.error("Cantidad debe ser mayor a 0");
    setLoading(true);
    try {
      await api.put(`/inventory/variantes/${varianteId}/stock`, { 
        cantidad, 
        tipo: "entrada", 
        motivo 
      });
      toast.success(`+${cantidad} unidades agregadas`);
      onSuccess();
    } catch (e: any) { toast.error(e.response?.data?.message || "Error"); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="bg-secondary/30 rounded-xl p-3">
        <p className="font-extrabold">{alerta.nombre}</p>
        <p className="text-xs text-foreground/50">{alerta.sku}</p>
        <p className="text-xs mt-1">Stock: <strong className="text-rose">{alerta.stockActual}</strong> / Mínimo: <strong>{alerta.stockMinimo}</strong></p>
      </div>

      {alerta.variantes.length > 1 && (
        <div>
          <Label>Variante</Label>
          <select value={varianteId} onChange={e => setVarianteId(parseInt(e.target.value))} className="w-full h-11 rounded-xl border-3 border-foreground bg-white px-4 font-bold text-sm">
            {alerta.variantes.map(v => <option key={v.id} value={v.id}>{v.atributo}: {v.valor} ({v.stockAdicional} uds)</option>)}
          </select>
        </div>
      )}

      <div>
        <Label>Cantidad</Label>
        <div className="flex items-center gap-2">
          <button onClick={() => setCantidad(c => Math.max(1, c - 1))} className="h-11 w-11 rounded-xl border-3 border-foreground font-extrabold text-lg hover:bg-secondary/50">−</button>
          <Input type="number" min={1} value={cantidad} onChange={e => setCantidad(parseInt(e.target.value) || 1)} className="text-center text-xl font-extrabold" />
          <button onClick={() => setCantidad(c => c + 1)} className="h-11 w-11 rounded-xl border-3 border-foreground font-extrabold text-lg hover:bg-secondary/50">+</button>
        </div>
        <div className="flex gap-2 mt-2">
          {[5, 10, 25, 50].map(n => (
            <button key={n} onClick={() => setCantidad(n)} className={`flex-1 py-1 rounded-lg border-2 text-xs font-bold ${cantidad === n ? "border-primary bg-primary/10" : "border-foreground/30 hover:bg-secondary/50"}`}>+{n}</button>
          ))}
        </div>
      </div>

      <div className={`rounded-xl p-3 border-2 text-xs ${nuevoStock < alerta.stockMinimo ? "bg-rose/10 border-rose" : "bg-primary/10 border-primary"}`}>
        {nuevoStock < alerta.stockMinimo ? "⚠️ Seguirá en alerta" : "✓ Quedará saludable"} · {v?.stockAdicional || 0} + {cantidad} = <strong>{nuevoStock} uds</strong>
      </div>

      <DialogFooter>
        <Button onClick={handleSubmit} disabled={loading} className="w-full">{loading ? "Abasteciendo..." : `Agregar ${cantidad} unidades`}</Button>
      </DialogFooter>
    </div>
  );
}

// ============================================
// SECCIÓN ALTO CONSUMO
// ============================================
function AltoConsumoSection() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"groomer" | "servicio">("groomer");

  useEffect(() => {
    api.get("/inventory/alertas/alto-consumo")
      .then(({ data }) => setData(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Cargando análisis de consumo..." />;
  if (!data) return null;

  const lista = viewMode === "groomer" ? data.porGroomer : data.porServicio;

  if (!lista || lista.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" /> Alto Consumo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground/50 text-center py-4">
            No se detectaron patrones de consumo elevado.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" /> Alto Consumo
          </CardTitle>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={viewMode === "groomer" ? "default" : "outline"}
              onClick={() => setViewMode("groomer")}
              className="text-xs"
            >
              Por Groomer
            </Button>
            <Button
              size="sm"
              variant={viewMode === "servicio" ? "default" : "outline"}
              onClick={() => setViewMode("servicio")}
              className="text-xs"
            >
              Por Servicio
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {lista.map((item: any, idx: number) => (
            <div
              key={idx}
              className={`p-4 border-2 border-foreground rounded-xl ${
                item.cantidadTotal > 30 ? 'bg-rose/5 border-rose' :
                item.cantidadTotal > 15 ? 'bg-accent/5 border-accent' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {viewMode === "groomer" ? (
                    <User className="h-5 w-5" />
                  ) : (
                    <Scissors className="h-5 w-5" />
                  )}
                  <h3 className="font-extrabold text-base">
                    {viewMode === "groomer" 
                      ? `${item.nombre} ${item.apellido}`
                      : item.servicio
                    }
                  </h3>
                </div>
                <Badge variant={item.cantidadTotal > 30 ? "destructive" : "secondary"}>
                  {item.cantidadTotal > 30 ? "Consumo elevado" : "Revisar"}
                </Badge>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-secondary/30 rounded-lg p-2 text-center">
                  <p className="text-lg font-extrabold">{item.totalConsumos}</p>
                  <p className="text-[9px]">Registros</p>
                </div>
                <div className="bg-primary/10 rounded-lg p-2 text-center">
                  <p className="text-lg font-extrabold">{item.cantidadTotal}</p>
                  <p className="text-[9px]">Total uds</p>
                </div>
                <div className="bg-accent/10 rounded-lg p-2 text-center">
                  <p className="text-lg font-extrabold">
                    {Object.keys(item.productos).length}
                  </p>
                  <p className="text-[9px]">Productos</p>
                </div>
              </div>

              {/* Productos más consumidos */}
              <div>
                <p className="text-xs font-bold mb-1">Productos más usados:</p>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(item.productos)
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .slice(0, 5)
                    .map(([nombre, cantidad]) => (
                      <span
                        key={nombre}
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                          (cantidad as number) > 10
                            ? 'border-rose bg-rose/10 text-rose'
                            : 'border-foreground/20 bg-secondary/40'
                        }`}
                      >
                        {nombre}: {cantidad as number}u
                      </span>
                    ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}