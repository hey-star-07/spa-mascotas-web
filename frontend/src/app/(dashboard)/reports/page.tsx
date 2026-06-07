"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import {
  BarChart3, DollarSign, TrendingUp, Calendar, Package, Users,
  Star, MessageSquare, TrendingDown, RefreshCw, ChevronDown, ChevronUp
} from "lucide-react";
import { toast } from "sonner";

export default function ReportsPage() {
  const [ventas, setVentas] = useState<any>(null);
  const [rentabilidad, setRentabilidad] = useState<any>(null);
  const [ocupacion, setOcupacion] = useState<any>(null);
  const [insumos, setInsumos] = useState<any>(null);
  const [encuestas, setEncuestas] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>("ventas");

  useEffect(() => {
    Promise.all([
      api.get("/reports/ventas"),
      api.get("/reports/rentabilidad"),
      api.get("/reports/ocupacion"),
      api.get("/reports/insumos"),
      api.get("/reports/encuestas"),
    ]).then(([v, r, o, i, e]) => {
      setVentas(v.data.data);
      setRentabilidad(r.data.data);
      setOcupacion(o.data.data);
      setInsumos(i.data.data);
      setEncuestas(e.data.data);
    }).catch(() => toast.error("Error al cargar reportes"))
    .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Cargando reportes..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8" strokeWidth={3} />
          <h1 className="text-3xl font-extrabold">Reportes</h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          <RefreshCw className="mr-2 h-4 w-4" /> Actualizar
        </Button>
      </div>

      {/* KPIs Principales */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard icon={<DollarSign className="h-6 w-6" />} value={`Bs. ${(ventas?.totalGeneral || 0).toFixed(0)}`} label="Ventas totales" color="bg-primary/20" />
        <KpiCard icon={<Calendar className="h-6 w-6" />} value={ventas?.totalFacturas || 0} label="Facturas" color="bg-lavender/20" />
        <KpiCard icon={<Users className="h-6 w-6" />} value={ocupacion?.porGroomer?.length || 0} label="Groomers" color="bg-accent/20" />
        <KpiCard icon={<Package className="h-6 w-6" />} value={insumos?.consumos?.length || 0} label="Insumos usados" color="bg-secondary/30" />
        <KpiCard icon={<Star className="h-6 w-6" />} value={encuestas?.resumen?.promedio || "N/A"} label="Satisfacción" color="bg-rose/10" />
      </div>

      {/* ============================================ */}
      {/* VENTAS Y FACTURACIÓN                           */}
      {/* ============================================ */}
      <SectionCard
        title="Ventas y Facturación"
        icon={<DollarSign className="h-5 w-5" />}
        expanded={expandedSection === "ventas"}
        onToggle={() => setExpandedSection(expandedSection === "ventas" ? null : "ventas")}
      >
        {ventas && (
          <div className="space-y-4">
            {/* Métodos de pago */}
            <div className="grid grid-cols-3 gap-3">
              {ventas.porMetodoPago?.map((m: any) => (
                <div key={m.metodo} className="bg-secondary/30 rounded-xl p-3 text-center">
                  <p className="text-lg font-extrabold">Bs. {m.total.toFixed(0)}</p>
                  <p className="text-[10px]">{m.metodo} ({m.cantidad})</p>
                </div>
              ))}
            </div>

            {/* Ventas por día (barras) */}
            <div>
              <p className="text-xs font-bold mb-2">Últimos 7 días:</p>
              <div className="space-y-2">
                {ventas.porDia?.slice(0, 7).reverse().map((d: any) => {
                  const maxTotal = Math.max(...ventas.porDia.map((x: any) => x.total), 1);
                  const pct = (d.total / maxTotal) * 100;
                  return (
                    <div key={d.fecha} className="flex items-center gap-2 text-xs">
                      <span className="w-20 text-right">{d.fecha.slice(5)}</span>
                      <div className="flex-1 h-6 bg-gray-100 rounded-full border border-foreground/20 overflow-hidden">
                        <div className="h-full bg-primary rounded-full flex items-center justify-end pr-2 transition-all" style={{ width: `${pct}%` }}>
                          {pct > 20 && <span className="text-[10px] font-bold text-white">Bs. {d.total.toFixed(0)}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      {/* ============================================ */}
      {/* RANKING DE RENTABILIDAD                        */}
      {/* ============================================ */}
      <SectionCard
        title="Ranking de Rentabilidad"
        icon={<TrendingUp className="h-5 w-5" />}
        expanded={expandedSection === "rentabilidad"}
        onToggle={() => setExpandedSection(expandedSection === "rentabilidad" ? null : "rentabilidad")}
      >
        {rentabilidad && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top Servicios */}
            <div>
              <p className="text-xs font-bold mb-2">Top 5 Servicios:</p>
              <div className="space-y-2">
                {rentabilidad.topServicios?.slice(0, 5).map((s: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2 border-2 border-foreground rounded-xl text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-lg w-6">{i + 1}</span>
                      <span>{s.nombre}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{s.cantidad}x</p>
                      <p className="text-xs">Bs. {s.ingresos.toFixed(0)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Productos */}
            <div>
              <p className="text-xs font-bold mb-2">Top 5 Productos:</p>
              <div className="space-y-2">
                {rentabilidad.topProductos?.slice(0, 5).map((p: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2 border-2 border-foreground rounded-xl text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-lg w-6">{i + 1}</span>
                      <span>{p.nombre}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{p.cantidad}x</p>
                      <p className="text-xs">Bs. {p.ingresos.toFixed(0)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      {/* ============================================ */}
      {/* OCUPACIÓN GLOBAL                               */}
      {/* ============================================ */}
      <SectionCard
        title="Ocupación Global"
        icon={<Users className="h-5 w-5" />}
        expanded={expandedSection === "ocupacion"}
        onToggle={() => setExpandedSection(expandedSection === "ocupacion" ? null : "ocupacion")}
      >
        {ocupacion && (
          <div className="space-y-3">
            {ocupacion.porGroomer?.map((g: any) => (
              <div key={g.groomer} className="p-3 border-2 border-foreground rounded-xl">
                <div className="flex justify-between mb-2">
                  <span className="font-bold">{g.groomer}</span>
                  <span className="text-sm">{g.totalCitas} citas • {g.porcentajeOcupacion}% ocupación</span>
                </div>
                <div className="h-4 bg-gray-100 rounded-full border border-foreground/20 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      g.porcentajeOcupacion > 80 ? 'bg-rose' : g.porcentajeOcupacion > 50 ? 'bg-accent' : 'bg-primary'
                    }`}
                    style={{ width: `${g.porcentajeOcupacion}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* ============================================ */}
      {/* AUDITORÍA DE INSUMOS                           */}
      {/* ============================================ */}
      <SectionCard
        title="Auditoría de Insumos"
        icon={<Package className="h-5 w-5" />}
        expanded={expandedSection === "insumos"}
        onToggle={() => setExpandedSection(expandedSection === "insumos" ? null : "insumos")}
      >
        {insumos && (
          <div className="space-y-3">
            {insumos.consumos?.slice(0, 10).map((c: any, i: number) => (
              <div key={i} className="p-3 border-2 border-foreground rounded-xl">
                <div className="flex justify-between mb-1">
                  <span className="font-bold text-sm">{c.producto}</span>
                  <span className="text-xs">Eficiencia: {c.eficiencia}%</span>
                </div>
                <div className="flex gap-1">
                  <div className="flex-1 h-2 bg-primary rounded-full" style={{ width: `${c.eficiencia}%` }} />
                  <div className="h-2 bg-rose rounded-full" style={{ width: `${100 - c.eficiencia}%`, maxWidth: '40px' }} />
                </div>
                <div className="flex justify-between text-[10px] mt-1">
                  <span className="text-primary">Usado: {c.cantidadUsada}u</span>
                  <span className="text-secondary">Devuelto: {c.cantidadDevuelta}u</span>
                  <span className="text-rose">Merma: {c.cantidadMerma}u</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* ============================================ */}
      {/* SATISFACCIÓN / NPS                             */}
      {/* ============================================ */}
      <SectionCard
        title="Satisfacción del Cliente (NPS)"
        icon={<Star className="h-5 w-5" />}
        expanded={expandedSection === "satisfaccion"}
        onToggle={() => setExpandedSection(expandedSection === "satisfaccion" ? null : "satisfaccion")}
      >
        {encuestas && (
          <div className="space-y-4">
            {/* NPS Score */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-primary/20 rounded-xl p-3 text-center">
                <p className="text-2xl font-extrabold">{encuestas.resumen.promedio}</p>
                <p className="text-[10px]">Promedio /5</p>
              </div>
              <div className="bg-lavender/20 rounded-xl p-3 text-center">
                <p className="text-2xl font-extrabold">{encuestas.resumen.nps}%</p>
                <p className="text-[10px]">NPS</p>
              </div>
              <div className="bg-accent/20 rounded-xl p-3 text-center">
                <p className="text-2xl font-extrabold">{encuestas.resumen.total}</p>
                <p className="text-[10px]">Encuestas</p>
              </div>
            </div>

            {/* Distribución de estrellas */}
            <div>
              <p className="text-xs font-bold mb-2">Distribución de puntuaciones:</p>
              <div className="space-y-1.5">
                {encuestas.resumen.distribucion?.reverse().map((d: any) => (
                  <div key={d.puntuacion} className="flex items-center gap-2 text-xs">
                    <span className="w-16 text-right flex items-center gap-1">
                      {d.puntuacion} <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    </span>
                    <div className="flex-1 h-5 bg-gray-100 rounded-full border border-foreground/20 overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full flex items-center justify-end pr-2"
                        style={{ width: `${encuestas.resumen.total > 0 ? (d.cantidad / encuestas.resumen.total) * 100 : 0}%` }}
                      >
                        {d.cantidad > 0 && <span className="text-[9px] font-bold">{d.cantidad}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Últimos comentarios */}
            {encuestas.encuestas?.filter((e: any) => e.comentario).length > 0 && (
              <div>
                <p className="text-xs font-bold mb-2">Últimos comentarios:</p>
                <div className="space-y-2">
                  {encuestas.encuestas.filter((e: any) => e.comentario).slice(0, 5).map((e: any) => (
                    <div key={e.id} className="bg-secondary/30 rounded-xl p-3 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold">{e.cliente?.usuario?.nombre}</span>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-3 w-3 ${i < e.puntuacion ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-foreground/70">"{e.comentario}"</p>
                      <p className="text-[10px] text-foreground/40 mt-1">
                        {e.cita?.servicio?.nombre} • Groomer: {e.cita?.groomer?.usuario?.nombre}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ============================================
// COMPONENTES AUXILIARES
// ============================================

function KpiCard({ icon, value, label, color }: { icon: any; value: any; label: string; color: string }) {
  return (
    <Card>
      <CardContent className={`pt-4 text-center ${color} rounded-xl`}>
        <div className="flex justify-center mb-1">{icon}</div>
        <p className="text-xl font-extrabold">{value}</p>
        <p className="text-[10px] font-semibold">{label}</p>
      </CardContent>
    </Card>
  );
}

function SectionCard({ title, icon, expanded, onToggle, children }: {
  title: string; icon: any; expanded: boolean; onToggle: () => void; children: any;
}) {
  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {icon} {title}
          </CardTitle>
          {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </CardHeader>
      {expanded && <CardContent>{children}</CardContent>}
    </Card>
  );
}