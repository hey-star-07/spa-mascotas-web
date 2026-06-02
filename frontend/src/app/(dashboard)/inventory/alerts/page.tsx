"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { AlertTriangle, Package, TrendingUp, ShoppingCart, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface AlertaStock {
  id: number;
  nombre: string;
  sku: string;
  stockActual: number;
  stockMinimo: number;
  porcentaje: number;
  urgencia: string;
  mensaje: string;
}

interface AlertaConsumo {
  groomer: string;
  producto: string;
  cantidadTotal: number;
  vecesUsado: number;
}

export default function InventoryAlertsPage() {
  const [alertasStock, setAlertasStock] = useState<AlertaStock[]>([]);
  const [alertasConsumo, setAlertasConsumo] = useState<AlertaConsumo[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [stockRes, consumoRes] = await Promise.all([
        api.get("/inventory/recomendaciones-reabastecimiento"),
        api.get("/inventory/alertas-consumo"),
      ]);
      setAlertasStock(stockRes.data.data || []);
      setAlertasConsumo(consumoRes.data.data || []);
    } catch { toast.error("Error al cargar alertas"); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const urgenciaColor: Record<string, string> = {
    Crítica: "bg-rose text-white",
    Alta: "bg-accent",
    Media: "bg-secondary",
    Baja: "bg-gray-200",
  };

  if (loading) return <LoadingSpinner text="Cargando alertas..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-8 w-8 text-rose" strokeWidth={3} />
          <div>
            <h1 className="text-3xl font-extrabold">Alertas de Inventario</h1>
            <p className="text-sm font-semibold text-foreground/70">
            {alertasStock.length} producto{alertasStock.length !== 1 ? "s" : ""} necesita{alertasStock.length !== 1 ? "n" : ""} reabastecimiento
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={loadData}><RefreshCw className="mr-2 h-4 w-4" />Actualizar</Button>
      </div>

      {/* Alertas de Stock */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" /> Productos que necesitan reabastecimiento
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alertasStock.length === 0 ? (
            <EmptyState icon={<Package className="h-12 w-12" />} title="Todo al día" description="No hay productos que necesiten reabastecimiento urgente" />
          ) : (
            <div className="space-y-3">
              {alertasStock.map((a) => (
                <div key={a.id} className={`p-4 border-2 border-foreground rounded-xl ${a.urgencia === 'Crítica' ? 'bg-rose/10 border-rose' : a.urgencia === 'Alta' ? 'bg-accent/10' : 'bg-secondary/20'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-extrabold text-lg">{a.nombre}</p>
                      <p className="text-xs font-mono">SKU: {a.sku}</p>
                    </div>
                    <Badge className={urgenciaColor[a.urgencia] || "bg-gray-200"}>{a.urgencia}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-sm mb-2">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Stock: {a.stockActual}</span>
                        <span>Mínimo: {a.stockMinimo}</span>
                      </div>
                      <div className="flex gap-1">
                        {Array.from({ length: 10 }).map((_, i) => (
                          <div key={i} className={`h-2 flex-1 rounded-full border border-foreground/20 ${i < Math.ceil((a.stockActual / Math.max(a.stockMinimo * 2, 1)) * 10) ? (a.stockActual <= a.stockMinimo ? 'bg-rose' : 'bg-accent') : 'bg-gray-200'}`} />
                        ))}
                      </div>
                    </div>
                    <span className="font-bold text-lg">{a.porcentaje.toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <ShoppingCart className="h-4 w-4" />
                    <span>{a.mensaje}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alertas de Consumo Elevado */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" /> Consumo elevado por groomer
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alertasConsumo.length === 0 ? (
            <p className="text-sm text-foreground/50">No se detectaron patrones de consumo elevado</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-3 border-foreground text-left">
                    <th className="pb-2 font-extrabold px-2">Groomer</th>
                    <th className="pb-2 font-extrabold px-2">Producto</th>
                    <th className="pb-2 font-extrabold px-2 text-center">Cantidad Total</th>
                    <th className="pb-2 font-extrabold px-2 text-center">Veces Usado</th>
                    <th className="pb-2 font-extrabold px-2">Alerta</th>
                  </tr>
                </thead>
                <tbody>
                  {alertasConsumo.map((a, i) => (
                    <tr key={i} className="border-b-2 border-foreground/20">
                      <td className="py-2 px-2 font-bold">{a.groomer}</td>
                      <td className="py-2 px-2">{a.producto}</td>
                      <td className="py-2 px-2 text-center font-mono">{a.cantidadTotal} uds</td>
                      <td className="py-2 px-2 text-center">{a.vecesUsado}x</td>
                      <td className="py-2 px-2">
                        <Badge variant={a.vecesUsado >= 10 ? "destructive" : "secondary"} className="text-xs">
                          {a.vecesUsado >= 10 ? "Consumo elevado" : "Revisar"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}