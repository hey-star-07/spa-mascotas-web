"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { AlertTriangle, Package, ShoppingBag, Scissors, RefreshCw, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

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
  variantes: Array<{ id: number; atributo: string; valor: string; stockAdicional: number }>;
}

type TabAlerta = "tienda" | "insumos";

export default function InventoryAlertsPage() {
  const [alertasTienda, setAlertasTienda] = useState<AlertaProducto[]>([]);
  const [alertasInsumos, setAlertasInsumos] = useState<AlertaProducto[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabAlerta>("tienda");

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

  const urgenciaColor: Record<string, string> = {
    Crítica: "bg-rose text-white",
    Alta: "bg-accent",
    Media: "bg-secondary",
  };

  const alertasActuales = activeTab === "tienda" ? alertasTienda : alertasInsumos;
  const totalCriticas = alertasActuales.filter(a => a.urgencia === 'Crítica').length;
  const totalAltas = alertasActuales.filter(a => a.urgencia === 'Alta').length;

  if (loading) return <LoadingSpinner text="Cargando alertas..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-8 w-8 text-rose" strokeWidth={3} />
          <div>
            <h1 className="text-3xl font-extrabold">Alertas de Inventario</h1>
            <p className="text-sm font-semibold text-foreground/70">
              {alertasTienda.length + alertasInsumos.length} alertas en total
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={loadData}>
          <RefreshCw className="mr-2 h-4 w-4" /> Actualizar
        </Button>
      </div>

      {/* Tabs: Tienda | Insumos */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("tienda")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border-3 border-foreground text-sm font-bold transition-all ${
            activeTab === "tienda" ? "bg-primary shadow-cartoon-sm translate-x-[1px] translate-y-[1px]" : "bg-white hover:bg-primary/20"
          }`}
        >
          <ShoppingBag className="h-4 w-4" />
          Productos de Tienda
          {alertasTienda.length > 0 && (
            <Badge variant="destructive" className="text-[10px] ml-1">{alertasTienda.length}</Badge>
          )}
        </button>
        <button
          onClick={() => setActiveTab("insumos")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border-3 border-foreground text-sm font-bold transition-all ${
            activeTab === "insumos" ? "bg-lavender shadow-cartoon-sm translate-x-[1px] translate-y-[1px]" : "bg-white hover:bg-lavender/20"
          }`}
        >
          <Scissors className="h-4 w-4" />
          Insumos de Grooming
          {alertasInsumos.length > 0 && (
            <Badge variant="destructive" className="text-[10px] ml-1">{alertasInsumos.length}</Badge>
          )}
        </button>
      </div>

      {/* Resumen rápido */}
      {alertasActuales.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-extrabold">{alertasActuales.length}</p>
              <p className="text-xs text-foreground/70">Total alertas</p>
            </CardContent>
          </Card>
          <Card className="border-rose">
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-extrabold text-rose">{totalCriticas}</p>
              <p className="text-xs text-foreground/70">Críticas (agotado)</p>
            </CardContent>
          </Card>
          <Card className="border-accent">
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-extrabold text-accent">{totalAltas}</p>
              <p className="text-xs text-foreground/70">Altas (comprar ya)</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de alertas */}
      {alertasActuales.length === 0 ? (
        <EmptyState
          icon={activeTab === "tienda" ? <ShoppingBag className="h-12 w-12" /> : <Scissors className="h-12 w-12" />}
          title={`Sin alertas de ${activeTab === "tienda" ? "tienda" : "insumos"}`}
          description={`Todos los ${activeTab === "tienda" ? "productos de tienda" : "insumos técnicos"} tienen stock suficiente.`}
        />
      ) : (
        <div className="space-y-3">
          {alertasActuales.map((a) => (
            <Card key={a.id} className={`hover:shadow-cartoon-hover transition-all ${
              a.urgencia === 'Crítica' ? 'border-rose bg-rose/5' : 
              a.urgencia === 'Alta' ? 'border-accent bg-accent/5' : ''
            }`}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-xl border-3 border-foreground p-3 ${
                      a.urgencia === 'Crítica' ? 'bg-rose/30' : 
                      a.urgencia === 'Alta' ? 'bg-accent/30' : 'bg-secondary/30'
                    }`}>
                      {activeTab === "tienda" ? (
                        <ShoppingBag className="h-6 w-6" />
                      ) : (
                        <Scissors className="h-6 w-6" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-extrabold text-lg">{a.nombre}</p>
                        <Badge className={urgenciaColor[a.urgencia] || "bg-gray-200"}>
                          {a.urgencia}
                        </Badge>
                        {activeTab === "insumos" && a.unidadMedida && (
                          <Badge variant="outline" className="text-[10px]">{a.unidadMedida}</Badge>
                        )}
                      </div>
                      <p className="text-xs font-mono text-foreground/50">SKU: {a.sku}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-rose" />
                      <p className="text-sm">
                        Stock: <span className="font-extrabold text-rose">{a.stockActual}</span>
                        <span className="text-foreground/50"> / {a.stockMinimo} mín</span>
                      </p>
                    </div>
                    {/* Barra de progreso */}
                    <div className="flex gap-0.5 mt-1.5 max-w-[150px] ml-auto">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-2 flex-1 rounded-full border border-foreground/20 transition-all ${
                            i < Math.ceil((a.stockActual / Math.max(a.stockMinimo * 2, 1)) * 5)
                              ? a.stockActual <= a.stockMinimo ? 'bg-rose' : 'bg-accent'
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-[10px] text-foreground/50 mt-0.5">
                      {a.porcentaje}% del stock mínimo
                    </p>
                  </div>
                </div>

                {/* Variantes */}
                {a.variantes.length > 0 && (
                  <div className="mt-3 pt-3 border-t-2 border-foreground/20">
                    <p className="text-xs font-bold mb-1">Variantes:</p>
                    <div className="flex flex-wrap gap-2">
                      {a.variantes.map(v => (
                        <div key={v.id} className={`px-2 py-1 rounded-lg text-xs border ${
                          v.stockAdicional === 0 ? 'border-rose bg-rose/10' :
                          v.stockAdicional <= a.stockMinimo ? 'border-accent bg-accent/10' : 'border-foreground/20'
                        }`}>
                          <span className="font-bold">{v.valor}</span>
                          <span className="ml-1 text-foreground/50">({v.stockAdicional})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Acción */}
                <div className="mt-3 flex gap-2">
                  <Link href={`/inventory`} className="flex-1">
                    <Button size="sm" variant="outline" className="w-full text-xs">
                      <Package className="mr-1 h-3 w-3" /> Ir a Inventario
                    </Button>
                  </Link>
                  {a.urgencia === 'Crítica' && (
                    <Button size="sm" variant="destructive" className="text-xs">
                      Comprar ahora
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}