"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { BarChart3, Clock, Scissors, Package, TrendingUp } from "lucide-react";

export default function GroomerReportsPage() {
  const [data, setData] = useState<any>(null);
  const [insumos, setInsumos] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/reports/groomer"),
      api.get("/reports/groomer/insumos"),
    ]).then(([d, i]) => {
      setData(d.data.data);
      setInsumos(i.data.data);
    }).catch(() => {})
    .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Cargando reportes..." />;
  if (!data) return <EmptyState icon={<BarChart3 className="h-12 w-12" />} title="Sin datos" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-8 w-8" strokeWidth={3} />
        <h1 className="text-3xl font-extrabold">Mi Productividad</h1>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card><CardContent className="pt-4 text-center"><Scissors className="h-8 w-8 mx-auto text-primary mb-1" /><p className="text-2xl font-extrabold">{data.totalServicios}</p><p className="text-xs">Servicios realizados</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Clock className="h-8 w-8 mx-auto text-accent mb-1" /><p className="text-2xl font-extrabold">{data.tiempoPromedio} min</p><p className="text-xs">Tiempo promedio</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Package className="h-8 w-8 mx-auto text-lavender mb-1" /><p className="text-2xl font-extrabold">{insumos?.totalInsumos || 0}</p><p className="text-xs">Insumos usados</p></CardContent></Card>
      </div>

      {/* Últimos servicios */}
      <Card>
        <CardHeader><CardTitle>Últimos Servicios</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.fichasRecientes?.map((f: any) => (
              <div key={f.id} className="flex justify-between p-2 border-2 border-foreground rounded-xl text-sm">
                <div>
                  <span className="font-bold">{f.mascota}</span> - {f.servicio}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs">{new Date(f.fecha).toLocaleDateString()}</span>
                  <Badge variant={f.checklistCompletado ? "default" : "secondary"}>
                    {f.fotos} fotos
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Consumo de insumos */}
      <Card>
        <CardHeader><CardTitle>Mi Consumo de Insumos</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {insumos?.porProducto?.map((p: any, i: number) => (
              <div key={i} className="flex justify-between p-2 border-2 border-foreground rounded-xl text-sm">
                <span className="font-bold">{p.producto}</span>
                <div className="flex gap-3 text-xs">
                  <span className="text-primary">Usado: {p.usado}</span>
                  <span className="text-secondary">Devuelto: {p.devuelto}</span>
                  <span className="text-rose">Merma: {p.merma}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}