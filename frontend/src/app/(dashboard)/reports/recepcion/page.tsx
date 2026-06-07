"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Calendar, Clock, Dog, User, Scissors, DollarSign, AlertTriangle,
  XCircle, RefreshCw, ChevronDown, ChevronUp, Package, Wallet,
  QrCode, Banknote, TrendingDown, CheckCircle, Phone
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

// ============================================
// TIPOS
// ============================================
interface CitaDiaria {
  id: number;
  fechaHoraInicio: string;
  estado: string;
  mascota: { nombre: string; raza: string | null; imagen: string | null };
  servicio: { nombre: string; precioBase: number };
  groomer: { usuario: { nombre: string; apellido: string } } | null;
  factura: { estado: string; total: number; metodoPago: string | null } | null;
  cliente?: { usuario: { nombre: string; apellido: string; telefono: string } };
}

interface CitaCancelada {
  id: number;
  fechaHoraInicio: string;
  estado: string;
  mascota: { nombre: string };
  servicio: { nombre: string } | null;
  creadoPor: { nombre: string; apellido: string } | null;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function RecepcionReportsPage() {
  const [cronograma, setCronograma] = useState<{ citas: CitaDiaria[]; resumen: any; fecha: string } | null>(null);
  const [canceladas, setCanceladas] = useState<{ citas: CitaCancelada[]; resumen: any } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [expandedSection, setExpandedSection] = useState<string | null>("cronograma");

  // Cierre de caja
  const [cierreData, setCierreData] = useState<any>(null);

  // Inventario crítico
  const [alertasTienda, setAlertasTienda] = useState<any[]>([]);
  const [alertasInsumos, setAlertasInsumos] = useState<any[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cronRes, cancRes, cierreRes, alertaTRes, alertaIRres] = await Promise.all([
        api.get("/reports/cronograma-diario", { params: { fecha: selectedDate } }),
        api.get("/reports/citas-canceladas"),
        api.get("/billing/cierre-caja", { params: { fecha: selectedDate } }),
        api.get("/inventory/alertas/tienda"),
        api.get("/inventory/alertas/insumos"),
      ]);
      setCronograma(cronRes.data.data);
      setCanceladas(cancRes.data.data);
      setCierreData(cierreRes.data.data);
      setAlertasTienda(alertaTRes.data.data || []);
      setAlertasInsumos(alertaIRres.data.data || []);
    } catch { toast.error("Error al cargar reportes"); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [selectedDate]);

  if (loading) return <LoadingSpinner text="Cargando reportes..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Calendar className="h-8 w-8" strokeWidth={3} />
          <div>
            <h1 className="text-3xl font-extrabold">Reportes de Recepción</h1>
            <p className="text-sm text-foreground/70">
              {format(parseISO(selectedDate), "EEEE d 'de' MMMM", { locale: es })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="w-40 text-sm font-bold"
          />
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="mr-1 h-4 w-4" /> Actualizar
          </Button>
        </div>
      </div>

      {/* KPIs rápidos */}
      {cronograma && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <KpiCard icon={<Dog className="h-5 w-5" />} value={cronograma.resumen.total} label="Citas hoy" color="bg-primary/20" />
          <KpiCard icon={<CheckCircle className="h-5 w-5" />} value={cronograma.resumen.confirmadas} label="Confirmadas" color="bg-lavender/20" />
          <KpiCard icon={<Scissors className="h-5 w-5" />} value={cronograma.resumen.enProgreso} label="En progreso" color="bg-accent/20" />
          <KpiCard icon={<DollarSign className="h-5 w-5" />} value={cronograma.resumen.pendientesPago} label="Pend. pago" color="bg-rose/10" />
          <KpiCard icon={<CheckCircle className="h-5 w-5" />} value={cronograma.resumen.completadas} label="Completadas" color="bg-secondary/30" />
        </div>
      )}

      {/* ============================================ */}
      {/* CRONOGRAMA DIARIO                              */}
      {/* ============================================ */}
      <SectionCard
        title="Cronograma Diario de Citas"
        icon={<Calendar className="h-5 w-5" />}
        expanded={expandedSection === "cronograma"}
        onToggle={() => setExpandedSection(expandedSection === "cronograma" ? null : "cronograma")}
        badge={cronograma?.resumen?.total}
      >
        {cronograma && (
          <div className="overflow-x-auto">
            {cronograma.citas.length === 0 ? (
              <EmptyState icon={<Calendar className="h-12 w-12" />} title="Sin citas" description={`No hay citas para el ${selectedDate}`} />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-3 border-foreground text-left">
                    <th className="pb-2 font-extrabold px-2">Hora</th>
                    <th className="pb-2 font-extrabold px-2">Mascota</th>
                    <th className="pb-2 font-extrabold px-2">Servicio</th>
                    <th className="pb-2 font-extrabold px-2">Groomer</th>
                    <th className="pb-2 font-extrabold px-2">Cliente</th>
                    <th className="pb-2 font-extrabold px-2">Estado</th>
                    <th className="pb-2 font-extrabold px-2">Pago</th>
                  </tr>
                </thead>
                <tbody>
                  {cronograma.citas.map((c) => (
                    <tr key={c.id} className="border-b border-foreground/10">
                      <td className="py-2 px-2 font-mono font-bold text-xs">
                        {format(parseISO(c.fechaHoraInicio), "HH:mm")}
                      </td>
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-1">
                          <Dog className="h-3 w-3" />
                          <span className="font-bold text-xs">{c.mascota.nombre}</span>
                        </div>
                        {c.mascota.raza && <p className="text-[10px] text-foreground/50">{c.mascota.raza}</p>}
                      </td>
                      <td className="py-2 px-2 text-xs">{c.servicio.nombre}</td>
                      <td className="py-2 px-2 text-xs">
                        {c.groomer ? `${c.groomer.usuario.nombre}` : "—"}
                      </td>
                      <td className="py-2 px-2 text-xs">
                        {c.cliente?.usuario?.nombre || "—"}
                        {c.cliente?.usuario?.telefono && (
                          <div className="flex items-center gap-1 text-[10px] text-foreground/50">
                            <Phone className="h-3 w-3" /> {c.cliente.usuario.telefono}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-2">
                        <Badge variant={c.estado === 'Completada' ? 'default' : c.estado === 'EnProgreso' ? 'secondary' : 'outline'} className="text-[10px]">
                          {c.estado}
                        </Badge>
                      </td>
                      <td className="py-2 px-2">
                        {c.factura ? (
                          c.factura.estado === 'Pagada' ? (
                            <Badge variant="default" className="text-[10px]">
                              {c.factura.metodoPago || 'Pagada'} Bs. {Number(c.factura.total).toFixed(0)}
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-[10px]">Pendiente</Badge>
                          )
                        ) : (
                          <span className="text-[10px] text-foreground/40">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </SectionCard>

      {/* ============================================ */}
      {/* CITAS CANCELADAS / NO-SHOW                     */}
      {/* ============================================ */}
      <SectionCard
        title="Citas Canceladas / No-Show"
        icon={<XCircle className="h-5 w-5" />}
        expanded={expandedSection === "canceladas"}
        onToggle={() => setExpandedSection(expandedSection === "canceladas" ? null : "canceladas")}
        badge={canceladas?.resumen?.total}
      >
        {canceladas && (
          <div className="space-y-3">
            {/* Resumen */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-rose/10 rounded-xl p-3 text-center">
                <p className="text-2xl font-extrabold text-rose">{canceladas.resumen.canceladas}</p>
                <p className="text-[10px]">Canceladas</p>
              </div>
              <div className="bg-accent/10 rounded-xl p-3 text-center">
                <p className="text-2xl font-extrabold text-accent">{canceladas.resumen.noShow}</p>
                <p className="text-[10px]">No asistieron</p>
              </div>
            </div>

            {/* Por servicio */}
            {Object.keys(canceladas.resumen.porServicio).length > 0 && (
              <div>
                <p className="text-xs font-bold mb-2">Por servicio:</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(canceladas.resumen.porServicio).map(([nombre, cantidad]) => (
                    <Badge key={nombre} variant="destructive" className="text-[10px]">
                      {nombre}: {cantidad as number}x
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Lista */}
            <div className="space-y-1 max-h-[300px] overflow-y-auto">
              {canceladas.citas.slice(0, 10).map(c => (
                <div key={c.id} className="flex items-center justify-between p-2 border-2 border-foreground rounded-xl text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono">{format(parseISO(c.fechaHoraInicio), "dd/MM HH:mm")}</span>
                    <Dog className="h-3 w-3" />
                    <span className="font-bold">{c.mascota.nombre}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{c.servicio?.nombre}</span>
                    <Badge variant={c.estado === 'Cancelada' ? 'destructive' : 'secondary'} className="text-[10px]">
                      {c.estado === 'Cancelada' ? 'Cancelada' : 'No asistió'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </SectionCard>

      {/* ============================================ */}
      {/* INVENTARIO CRÍTICO                             */}
      {/* ============================================ */}
      <SectionCard
        title="Inventario Crítico"
        icon={<AlertTriangle className="h-5 w-5" />}
        expanded={expandedSection === "inventario"}
        onToggle={() => setExpandedSection(expandedSection === "inventario" ? null : "inventario")}
        badge={(alertasTienda.length + alertasInsumos.length)}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tienda */}
          <div>
            <p className="text-xs font-bold mb-2 flex items-center gap-1">
              <Package className="h-3 w-3" /> Tienda ({alertasTienda.length})
            </p>
            {alertasTienda.length === 0 ? (
              <p className="text-xs text-foreground/50">Sin alertas</p>
            ) : (
              <div className="space-y-1">
                {alertasTienda.slice(0, 5).map(a => (
                  <div key={a.id} className="flex justify-between text-xs p-2 bg-rose/5 border border-rose/20 rounded-lg">
                    <span>{a.nombre}</span>
                    <span className="text-rose font-bold">{a.stockActual}/{a.stockMinimo}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Insumos */}
          <div>
            <p className="text-xs font-bold mb-2 flex items-center gap-1">
              <Scissors className="h-3 w-3" /> Insumos ({alertasInsumos.length})
            </p>
            {alertasInsumos.length === 0 ? (
              <p className="text-xs text-foreground/50">Sin alertas</p>
            ) : (
              <div className="space-y-1">
                {alertasInsumos.slice(0, 5).map(a => (
                  <div key={a.id} className="flex justify-between text-xs p-2 bg-rose/5 border border-rose/20 rounded-lg">
                    <span>{a.nombre}</span>
                    <span className="text-rose font-bold">{a.stockActual}/{a.stockMinimo}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      {/* ============================================ */}
      {/* CIERRE DE CAJA DIARIO                          */}
      {/* ============================================ */}
      <SectionCard
        title="Cierre de Caja Diario"
        icon={<Wallet className="h-5 w-5" />}
        expanded={expandedSection === "cierre"}
        onToggle={() => setExpandedSection(expandedSection === "cierre" ? null : "cierre")}
      >
        {cierreData ? (
          <div className="space-y-4">
            {/* Total */}
            <div className="bg-primary/10 border-2 border-primary rounded-xl p-4 text-center">
              <p className="text-sm font-bold">Total cobrado hoy</p>
              <p className="text-4xl font-extrabold mt-1">Bs. {cierreData.totalCobrado?.toFixed(2)}</p>
              <p className="text-xs mt-1">{cierreData.totalPagos} pagos realizados</p>
            </div>

            {/* Desglose por método */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-secondary/30 rounded-xl p-3 text-center">
                <Banknote className="h-6 w-6 mx-auto mb-1" />
                <p className="text-lg font-extrabold">Bs. {(cierreData.porMetodo?.Efectivo || 0).toFixed(0)}</p>
                <p className="text-[10px]">Efectivo</p>
              </div>
              <div className="bg-lavender/20 rounded-xl p-3 text-center">
                <QrCode className="h-6 w-6 mx-auto mb-1" />
                <p className="text-lg font-extrabold">Bs. {(cierreData.porMetodo?.QR || 0).toFixed(0)}</p>
                <p className="text-[10px]">QR</p>
              </div>
              <div className="bg-accent/20 rounded-xl p-3 text-center">
                <Wallet className="h-6 w-6 mx-auto mb-1" />
                <p className="text-lg font-extrabold">Bs. {(cierreData.porMetodo?.Transferencia || 0).toFixed(0)}</p>
                <p className="text-[10px]">Transferencia</p>
              </div>
            </div>

            {/* Barras visuales */}
            <div>
              <p className="text-xs font-bold mb-2">Distribución de cobros:</p>
              {[
                { label: 'Efectivo', valor: cierreData.porMetodo?.Efectivo || 0, color: 'bg-primary' },
                { label: 'QR', valor: cierreData.porMetodo?.QR || 0, color: 'bg-lavender' },
                { label: 'Transferencia', valor: cierreData.porMetodo?.Transferencia || 0, color: 'bg-accent' },
              ].map(item => {
                const maxVal = Math.max(cierreData.totalCobrado || 1, 1);
                const pct = (item.valor / maxVal) * 100;
                return (
                  <div key={item.label} className="flex items-center gap-2 text-xs mb-1.5">
                    <span className="w-24 text-right">{item.label}</span>
                    <div className="flex-1 h-5 bg-gray-100 rounded-full border border-foreground/20 overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full flex items-center justify-end pr-2`} style={{ width: `${pct}%` }}>
                        {pct > 15 && <span className="text-[9px] font-bold text-white">Bs. {item.valor.toFixed(0)}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-sm text-foreground/50 text-center py-4">No hay datos de cierre para hoy.</p>
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
      <CardContent className={`pt-3 pb-2 text-center ${color} rounded-xl`}>
        <div className="flex justify-center mb-1">{icon}</div>
        <p className="text-lg font-extrabold">{value}</p>
        <p className="text-[9px] font-semibold">{label}</p>
      </CardContent>
    </Card>
  );
}

function SectionCard({ title, icon, expanded, onToggle, children, badge }: {
  title: string; icon: any; expanded: boolean; onToggle: () => void; children: any; badge?: number;
}) {
  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {icon} {title}
            {badge !== undefined && badge > 0 && (
              <Badge variant="destructive" className="text-[10px] ml-1">{badge}</Badge>
            )}
          </CardTitle>
          {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </CardHeader>
      {expanded && <CardContent>{children}</CardContent>}
    </Card>
  );
}