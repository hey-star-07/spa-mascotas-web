"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { BarChart3, DollarSign, TrendingUp, Calendar, Package, Users, Star } from "lucide-react";
import { toast } from "sonner";

export default function ReportsPage() {
  const [ventas, setVentas] = useState<any>(null);
  const [rentabilidad, setRentabilidad] = useState<any>(null);
  const [ocupacion, setOcupacion] = useState<any>(null);
  const [insumos, setInsumos] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/reports/ventas"),
      api.get("/reports/rentabilidad"),
      api.get("/reports/ocupacion"),
      api.get("/reports/insumos"),
    ]).then(([v, r, o, i]) => {
      setVentas(v.data.data);
      setRentabilidad(r.data.data);
      setOcupacion(o.data.data);
      setInsumos(i.data.data);
    }).catch(() => toast.error("Error al cargar reportes"))
    .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Cargando reportes..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-8 w-8" strokeWidth={3} />
        <h1 className="text-3xl font-extrabold">Reportes</h1>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 text-center">
            <DollarSign className="h-8 w-8 mx-auto text-primary mb-1" />
            <p className="text-2xl font-extrabold">Bs. {ventas?.totalGeneral?.toFixed(0) || 0}</p>
            <p className="text-xs text-foreground/70">Ventas totales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Calendar className="h-8 w-8 mx-auto text-accent mb-1" />
            <p className="text-2xl font-extrabold">{ventas?.totalFacturas || 0}</p>
            <p className="text-xs text-foreground/70">Facturas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Users className="h-8 w-8 mx-auto text-lavender mb-1" />
            <p className="text-2xl font-extrabold">{ocupacion?.porGroomer?.length || 0}</p>
            <p className="text-xs text-foreground/70">Groomers activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Package className="h-8 w-8 mx-auto text-rose mb-1" />
            <p className="text-2xl font-extrabold">{insumos?.consumos?.length || 0}</p>
            <p className="text-xs text-foreground/70">Insumos usados</p>
          </CardContent>
        </Card>
      </div>

      {/* Ventas por día */}
      <Card>
        <CardHeader><CardTitle>Ventas por Día</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-foreground text-left">
                  <th className="pb-2 font-extrabold">Fecha</th>
                  <th className="pb-2 font-extrabold text-right">Servicios</th>
                  <th className="pb-2 font-extrabold text-right">Productos</th>
                  <th className="pb-2 font-extrabold text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {ventas?.porDia?.slice(0, 7).map((d: any) => (
                  <tr key={d.fecha} className="border-b border-foreground/20">
                    <td className="py-1">{d.fecha}</td>
                    <td className="py-1 text-right">Bs. {d.servicios.toFixed(2)}</td>
                    <td className="py-1 text-right">Bs. {d.productos.toFixed(2)}</td>
                    <td className="py-1 text-right font-bold">Bs. {d.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Ocupación por groomer */}
      <Card>
        <CardHeader><CardTitle>Ocupación por Groomer (Hoy)</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {ocupacion?.porGroomer?.map((g: any) => (
              <div key={g.groomer} className="p-3 border-2 border-foreground rounded-xl">
                <div className="flex justify-between mb-1">
                  <span className="font-bold">{g.groomer}</span>
                  <span>{g.totalCitas} citas</span>
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className={`h-2 flex-1 rounded-full border border-foreground/20 ${i < Math.round(g.porcentajeOcupacion / 10) ? 'bg-primary' : 'bg-gray-200'}`} />
                  ))}
                </div>
                <p className="text-xs text-right mt-1">{g.porcentajeOcupacion}% ocupación</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Servicios */}
      <Card>
        <CardHeader><CardTitle>Top 5 Servicios</CardTitle></CardHeader>
        <CardContent>
          {rentabilidad?.topServicios?.slice(0, 5).map((s: any, i: number) => (
            <div key={i} className="flex justify-between py-2 border-b border-foreground/20">
              <span>{i + 1}. {s.nombre}</span>
              <span className="font-bold">{s.cantidad}x - Bs. {s.ingresos.toFixed(2)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}