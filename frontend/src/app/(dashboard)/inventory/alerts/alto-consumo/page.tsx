"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { TrendingUp, User, Scissors, RefreshCw, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface AlertaConsumo {
  groomerId?: number;
  nombre?: string;
  apellido?: string;
  servicio?: string;
  totalConsumos: number;
  cantidadTotal: number;
  productos: Record<string, number>;
}

export default function AltoConsumoPage() {
  const [data, setData] = useState<{ porGroomer: AlertaConsumo[]; porServicio: AlertaConsumo[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"groomer" | "servicio">("groomer");

  const loadData = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/inventory/alertas/alto-consumo");
      setData(data.data);
    } catch { toast.error("Error al cargar datos"); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const lista = viewMode === "groomer" ? data?.porGroomer : data?.porServicio;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/inventory/alerts">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-1 h-4 w-4" /> Alertas
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-7 w-7 text-rose" strokeWidth={3} />
            <div>
              <h1 className="text-2xl font-extrabold">Alto Consumo</h1>
              <p className="text-sm text-foreground/60">
                Análisis de patrones de consumo elevado
              </p>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={loadData}>
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Actualizar
        </Button>
      </div>

      {/* Toggle vista */}
      <div className="flex gap-2">
        <Button
          variant={viewMode === "groomer" ? "default" : "outline"}
          onClick={() => setViewMode("groomer")}
        >
          <User className="mr-2 h-4 w-4" /> Por Groomer
        </Button>
        <Button
          variant={viewMode === "servicio" ? "default" : "outline"}
          onClick={() => setViewMode("servicio")}
        >
          <Scissors className="mr-2 h-4 w-4" /> Por Servicio
        </Button>
      </div>

      {/* Contenido */}
      {loading ? (
        <LoadingSpinner text="Analizando consumo..." />
      ) : !lista || lista.length === 0 ? (
        <EmptyState
          icon={<TrendingUp className="h-12 w-12" />}
          title="Sin patrones elevados"
          description={`No se detectaron patrones de consumo elevado por ${viewMode === "groomer" ? "groomer" : "servicio"}.`}
        />
      ) : (
        <div className="space-y-4">
          {lista.map((item: AlertaConsumo, idx: number) => (
            <Card
              key={idx}
              className={`hover:shadow-cartoon-hover transition-all ${
                item.cantidadTotal > 30 ? 'border-rose bg-rose/5' :
                item.cantidadTotal > 15 ? 'border-accent bg-accent/5' : ''
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {viewMode === "groomer" ? (
                      <>
                        <User className="h-5 w-5" />
                        {item.nombre} {item.apellido}
                      </>
                    ) : (
                      <>
                        <Scissors className="h-5 w-5" />
                        {item.servicio}
                      </>
                    )}
                  </CardTitle>
                  <Badge variant={item.cantidadTotal > 30 ? "destructive" : "secondary"}>
                    {item.cantidadTotal > 30 ? "Consumo elevado" : "Revisar"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-secondary/30 rounded-xl p-3 text-center">
                    <p className="text-2xl font-extrabold">{item.totalConsumos}</p>
                    <p className="text-[10px] font-semibold">Registros</p>
                  </div>
                  <div className="bg-primary/10 rounded-xl p-3 text-center">
                    <p className="text-2xl font-extrabold">{item.cantidadTotal}</p>
                    <p className="text-[10px] font-semibold">Total uds</p>
                  </div>
                  <div className="bg-accent/10 rounded-xl p-3 text-center">
                    <p className="text-2xl font-extrabold">{Object.keys(item.productos).length}</p>
                    <p className="text-[10px] font-semibold">Productos</p>
                  </div>
                </div>

                {/* Productos más consumidos */}
                <div>
                  <p className="text-xs font-bold mb-2">Productos más usados:</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(item.productos)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .slice(0, 8)
                      .map(([nombre, cantidad]) => (
                        <div
                          key={nombre}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                            (cantidad as number) > 15
                              ? 'border-rose bg-rose/10 text-rose'
                              : (cantidad as number) > 8
                              ? 'border-accent bg-accent/10 text-accent'
                              : 'border-foreground/20 bg-secondary/40'
                          }`}
                        >
                          <span>{nombre}</span>
                          <span className="font-extrabold">{cantidad as number}u</span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Barra visual de consumo */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Nivel de consumo</span>
                    <span>{item.cantidadTotal} unidades</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full border border-foreground/20 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        item.cantidadTotal > 30 ? 'bg-rose' :
                        item.cantidadTotal > 15 ? 'bg-accent' : 'bg-primary'
                      }`}
                      style={{ width: `${Math.min((item.cantidadTotal / 50) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}