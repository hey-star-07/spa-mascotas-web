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
  recomendacion?: string;
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

      {/* Lista de alertas mejorada */}
      {alertasActuales.length === 0 ? (
        <EmptyState
          icon={activeTab === "tienda" ? <ShoppingBag className="h-12 w-12" /> : <Scissors className="h-12 w-12" />}
          title={`Sin alertas de ${activeTab === "tienda" ? "tienda" : "insumos"}`}
          description={`Todos los ${activeTab === "tienda" ? "productos de tienda" : "insumos técnicos"} tienen stock suficiente.`}
        />
      ) : (
        <div className="space-y-4">
          {alertasActuales.map((a) => {
            const porcentajeStock = a.stockMinimo > 0 
              ? Math.round((a.stockActual / (a.stockMinimo * 2)) * 100) 
              : 0;
            const barraColor = a.urgencia === 'Crítica' ? 'bg-rose' : a.urgencia === 'Alta' ? 'bg-accent' : 'bg-secondary';
            
            return (
              <Card key={a.id} className={`hover:shadow-cartoon-hover transition-all overflow-hidden ${
                a.urgencia === 'Crítica' ? 'border-rose border-3' : 
                a.urgencia === 'Alta' ? 'border-accent border-3' : ''
              }`}>
                {/* Barra de urgencia superior */}
                <div className={`h-2 w-full ${
                  a.urgencia === 'Crítica' ? 'bg-rose' : 
                  a.urgencia === 'Alta' ? 'bg-accent' : 'bg-secondary'
                }`} />
                
                <CardContent className="py-5">
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    {/* Info principal */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`rounded-xl border-3 border-foreground p-4 ${
                        a.urgencia === 'Crítica' ? 'bg-rose/20' : 
                        a.urgencia === 'Alta' ? 'bg-accent/20' : 'bg-secondary/30'
                      }`}>
                        {activeTab === "tienda" ? (
                          <ShoppingBag className="h-8 w-8" />
                        ) : (
                          <Scissors className="h-8 w-8" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <h3 className="text-xl font-extrabold">{a.nombre}</h3>
                          <Badge className={`text-xs ${urgenciaColor[a.urgencia] || "bg-gray-200"}`}>
                            {a.urgencia}
                          </Badge>
                          {activeTab === "insumos" && a.unidadMedida && (
                            <Badge variant="outline" className="text-[10px]">{a.unidadMedida}</Badge>
                          )}
                        </div>
                        <p className="text-xs font-mono text-foreground/50 mb-3">SKU: {a.sku}</p>

                        {/* Barra de progreso GRANDE y visible */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm font-bold">
                            <span className="flex items-center gap-1">
                              <TrendingDown className="h-4 w-4 text-rose" />
                              Stock actual:
                            </span>
                            <span className={`text-lg ${a.stockActual === 0 ? 'text-rose' : 'text-foreground'}`}>
                              <strong>{a.stockActual}</strong>
                              <span className="text-sm text-foreground/50"> / {a.stockMinimo} mínimo</span>
                            </span>
                          </div>
                          
                          {/* Barra de progreso visual */}
                          <div className="relative h-8 bg-gray-100 rounded-xl border-2 border-foreground overflow-hidden">
                            {/* Barra de stock actual */}
                            <div
                              className={`h-full rounded-xl transition-all duration-500 flex items-center justify-end pr-2 ${
                                porcentajeStock <= 25 ? 'bg-rose' : 
                                porcentajeStock <= 50 ? 'bg-accent' : 'bg-primary'
                              }`}
                              style={{ width: `${Math.min(porcentajeStock, 100)}%` }}
                            >
                              {porcentajeStock > 15 && (
                                <span className="text-xs font-extrabold text-white drop-shadow">
                                  {porcentajeStock}%
                                </span>
                              )}
                            </div>
                            {/* Línea de stock mínimo */}
                            <div 
                              className="absolute top-0 h-full w-1 bg-foreground/50 border-r-2 border-foreground"
                              style={{ left: '50%' }}
                              title="Nivel mínimo"
                            />
                            {/* Etiquetas */}
                            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-between px-2 pointer-events-none">
                              <span className="text-[8px] font-bold text-foreground/40">0</span>
                              <span className="text-[8px] font-bold text-foreground/40">Mín</span>
                              <span className="text-[8px] font-bold text-foreground/40">Óptimo</span>
                            </div>
                          </div>
                          
                          <div className="flex justify-between text-[10px] text-foreground/50">
                            <span>0%</span>
                            <span>Stock mínimo (50%)</span>
                            <span>100%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Variantes */}
                  {a.variantes.length > 0 && (
                    <div className="mt-4 pt-3 border-t-2 border-foreground/20">
                      <p className="text-xs font-bold mb-2">Desglose por variante:</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {a.variantes.map(v => (
                          <div key={v.id} className={`p-2 rounded-lg border-2 text-center ${
                            v.stockAdicional === 0 ? 'border-rose bg-rose/10' :
                            v.stockAdicional <= a.stockMinimo / 2 ? 'border-accent bg-accent/10' : 'border-foreground/20'
                          }`}>
                            <p className="text-xs font-bold">{v.valor}</p>
                            <p className={`text-lg font-extrabold ${v.stockAdicional === 0 ? 'text-rose' : ''}`}>
                              {v.stockAdicional}
                            </p>
                            <p className="text-[9px] text-foreground/50">unidades</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* RECOMENDACIÓN DE REABASTECIMIENTO */}
                  {a.recomendacion && (
                    <div className={`mt-4 p-4 rounded-xl border-2 ${
                      a.urgencia === 'Crítica' ? 'bg-rose/10 border-rose' :
                      a.urgencia === 'Alta' ? 'bg-accent/10 border-accent' : 'bg-secondary/30 border-foreground/30'
                    }`}>
                      <div className="flex items-start gap-2">
                        <ShoppingBag className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                          a.urgencia === 'Crítica' ? 'text-rose' : 
                          a.urgencia === 'Alta' ? 'text-accent' : 'text-foreground/50'
                        }`} />
                        <div>
                          <p className={`text-sm font-extrabold mb-1 ${
                            a.urgencia === 'Crítica' ? 'text-rose' : 
                            a.urgencia === 'Alta' ? 'text-accent' : ''
                          }`}>
                            Recomendación de reabastecimiento:
                          </p>
                          <p className="text-sm font-semibold">{a.recomendacion}</p>
                          <div className="flex gap-2 mt-3">
                            <Link href="/inventory" className="flex-1">
                              <Button size="sm" variant="outline" className="w-full text-xs">
                                <Package className="mr-1 h-3 w-3" /> Gestionar Inventario
                              </Button>
                            </Link>
                            {a.urgencia === 'Crítica' && (
                              <Button size="sm" variant="destructive" className="text-xs">
                                <ShoppingBag className="mr-1 h-3 w-3" /> Comprar Ahora
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
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