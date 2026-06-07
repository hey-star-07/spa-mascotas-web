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
  Package, Search, User, Dog, Scissors, Clock,
  RefreshCw, ChevronLeft, ChevronRight, Filter
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// ============================================
// TIPOS UNIFICADOS (AHORA INCLUYE ASIGNADOS + CONSUMOS)
// ============================================
interface LogEntry {
  id: string;
  tipo: string;           // 'asignado' | 'consumo'
  fecha: string;
  producto: string;
  sku: string;
  variante: string | null;
  cantidad: number;
  cantidadUsada: number | null;
  estado: string;         // 'pendiente' | 'confirmado' | 'usado' | 'devuelto' | 'merma'
  origen: string;         // Texto descriptivo
  groomer: string;
  groomerApellido: string;
  mascota: string;
  servicio: string;
  fechaCita: string | null;
  asignadoPor: string;
  confirmadoPor: string;
  citaId: number | null;
}

interface ResumenGroomer {
  groomerId: number;
  nombre: string;
  apellido: string;
  totalConsumos: number;
  usados: number;
  devueltos: number;
  mermas: number;
  cantidadUsada: number;
  cantidadDevuelta: number;
  productos: Record<string, number>;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function LogInsumosPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [resumenGroomers, setResumenGroomers] = useState<ResumenGroomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [groomerFilter, setGroomerFilter] = useState("");
  const [groomers, setGroomers] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"log" | "resumen">("log");

  // Resumen general
  const [resumen, setResumen] = useState<any>(null);

  // ============================================
  // CARGA DE DATOS
  // ============================================
  const loadData = async () => {
    setLoading(true);
    try {
      if (viewMode === "log") {
        const { data } = await api.get("/inventory/log-completo", {
          params: {
            page,
            limit: 15,
            groomerId: groomerFilter || undefined,
            search: search || undefined,
          },
        });
        setLogs(data.data.insumos || []);
        setTotal(data.data.total);
        setTotalPages(data.data.totalPages);
        setResumen(data.data.resumen);
      } else {
        const { data } = await api.get("/inventory/log-insumos/resumen");
        setResumenGroomers(data.data || []);
      }
    } catch { toast.error("Error al cargar datos"); }
    finally { setLoading(false); }
  };

  const loadGroomers = async () => {
    try {
      const { data } = await api.get("/users/groomers");
      setGroomers(data.data || []);
    } catch {}
  };

  useEffect(() => { loadData(); loadGroomers(); }, [page, groomerFilter, viewMode]);

  // ============================================
  // HELPERS
  // ============================================
  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'usado': return <Badge variant="default" className="text-[10px]">Usado</Badge>;
      case 'devuelto': return <Badge variant="secondary" className="text-[10px]">Devuelto</Badge>;
      case 'merma': return <Badge variant="destructive" className="text-[10px]">Merma</Badge>;
      case 'pendiente': return <Badge className="bg-accent text-[10px]">Pendiente</Badge>;
      case 'confirmado': return <Badge className="bg-lavender text-[10px]">Confirmado</Badge>;
      default: return <Badge variant="outline" className="text-[10px]">{estado}</Badge>;
    }
  };

  if (loading) return <LoadingSpinner text="Cargando log de insumos..." />;

  return (
    <div className="space-y-6">
      {/* ============================================ */}
      {/* HEADER                                         */}
      {/* ============================================ */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border-3 border-foreground bg-info p-2">
            <Package className="h-8 w-8 text-white" strokeWidth={3} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold">Log de Insumos</h1>
            <p className="text-sm font-semibold text-foreground/70">
              {total} registros totales
            </p>
          </div>
        </div>

        {/* Toggle vista */}
        <div className="flex gap-2">
          <Button
            variant={viewMode === "log" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("log")}
          >
            <Filter className="mr-1 h-4 w-4" /> Detalle
          </Button>
          <Button
            variant={viewMode === "resumen" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("resumen")}
          >
            <User className="mr-1 h-4 w-4" /> Por Groomer
          </Button>
        </div>
      </div>

      {/* ============================================ */}
      {/* RESUMEN RÁPIDO (solo vista detalle)           */}
      {/* ============================================ */}
      {viewMode === "log" && resumen && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          <Card><CardContent className="pt-3 pb-2 text-center"><p className="text-xl font-extrabold">{resumen.total}</p><p className="text-[10px]">Total</p></CardContent></Card>
          <Card><CardContent className="pt-3 pb-2 text-center"><p className="text-xl font-extrabold text-primary">{resumen.usados}</p><p className="text-[10px]">Usados</p></CardContent></Card>
          <Card><CardContent className="pt-3 pb-2 text-center"><p className="text-xl font-extrabold text-secondary">{resumen.devueltos}</p><p className="text-[10px]">Devueltos</p></CardContent></Card>
          <Card><CardContent className="pt-3 pb-2 text-center"><p className="text-xl font-extrabold text-rose">{resumen.mermas}</p><p className="text-[10px]">Mermas</p></CardContent></Card>
          <Card><CardContent className="pt-3 pb-2 text-center"><p className="text-xl font-extrabold text-accent">{resumen.pendientes}</p><p className="text-[10px]">Pendientes</p></CardContent></Card>
          <Card><CardContent className="pt-3 pb-2 text-center"><p className="text-xl font-extrabold text-lavender">{resumen.confirmados}</p><p className="text-[10px]">Confirmados</p></CardContent></Card>
        </div>
      )}

      {/* ============================================ */}
      {/* FILTROS                                       */}
      {/* ============================================ */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/50" />
              <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
            </div>
            <select
              value={groomerFilter}
              onChange={(e) => { setGroomerFilter(e.target.value); setPage(1); }}
              className="h-12 rounded-xl border-3 border-foreground bg-white px-4 font-bold"
            >
              <option value="">Todos los groomers</option>
              {groomers.map((g: any) => (
                <option key={g.id} value={g.groomer?.id || g.id}>
                  {g.nombre} {g.apellido}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* ============================================ */}
      {/* VISTA DETALLE (TABLA)                         */}
      {/* ============================================ */}
      {viewMode === "log" && (
        <>
          {logs.length === 0 ? (
            <EmptyState icon={<Package className="h-12 w-12" />} title="Sin registros" description="No hay consumo de insumos registrado" />
          ) : (
            <Card>
              <CardContent className="pt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-3 border-foreground text-left">
                      <th className="pb-3 font-extrabold px-2">Fecha</th>
                      <th className="pb-3 font-extrabold px-2">Origen</th>
                      <th className="pb-3 font-extrabold px-2">Groomer</th>
                      <th className="pb-3 font-extrabold px-2">Mascota</th>
                      <th className="pb-3 font-extrabold px-2">Servicio</th>
                      <th className="pb-3 font-extrabold px-2">Producto</th>
                      <th className="pb-3 font-extrabold px-2 text-center">Cant.</th>
                      <th className="pb-3 font-extrabold px-2 text-center">Estado</th>
                      <th className="pb-3 font-extrabold px-2">Destino</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr
                        key={log.id}
                        className={`border-b-2 border-foreground/20 ${
                          log.estado === 'devuelto' ? "bg-secondary/30" : 
                          log.estado === 'merma' ? "bg-rose/5" : ""
                        }`}
                      >
                        {/* Fecha */}
                        <td className="py-2 px-2 text-xs whitespace-nowrap">
                          {format(new Date(log.fecha), "dd/MM/yy HH:mm")}
                        </td>

                        {/* Origen (Admin/Groomer) */}
                        <td className="py-2 px-2">
                          <Badge variant={log.tipo === 'asignado' ? 'default' : 'secondary'} className="text-[10px]">
                            {log.tipo === 'asignado' ? 'Admin' : 'Groomer'}
                          </Badge>
                        </td>

                        {/* Groomer */}
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span className="font-bold text-xs">
                              {log.groomer} {log.groomerApellido}
                            </span>
                          </div>
                          {log.asignadoPor && (
                            <p className="text-[9px] text-foreground/40">Asignado: {log.asignadoPor}</p>
                          )}
                          {log.confirmadoPor && (
                            <p className="text-[9px] text-foreground/40">Confirmado: {log.confirmadoPor}</p>
                          )}
                        </td>

                        {/* Mascota */}
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-1">
                            <Dog className="h-3 w-3" />
                            <span className="text-xs">{log.mascota || "—"}</span>
                          </div>
                        </td>

                        {/* Servicio */}
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-1">
                            <Scissors className="h-3 w-3" />
                            <span className="text-xs">{log.servicio || "—"}</span>
                          </div>
                        </td>

                        {/* Producto */}
                        <td className="py-2 px-2">
                          <p className="font-bold text-xs">{log.producto}</p>
                          <p className="text-[10px] font-mono text-foreground/50">{log.sku}</p>
                          {log.variante && (
                            <Badge variant="outline" className="text-[9px]">{log.variante}</Badge>
                          )}
                        </td>

                        {/* Cantidad */}
                        <td className="py-2 px-2 text-center font-mono font-bold text-xs">
                          {log.cantidad}
                        </td>

                        {/* Estado */}
                        <td className="py-2 px-2 text-center">
                          {getEstadoBadge(log.estado)}
                        </td>

                        {/* Destino / Origen del descuento */}
                        <td className="py-2 px-2">
                          <span className={`text-[10px] font-semibold ${
                            log.estado === 'devuelto' ? 'text-secondary' :
                            log.estado === 'merma' ? 'text-rose' :
                            log.estado === 'usado' ? 'text-primary' : 'text-foreground/50'
                          }`}>
                            {log.origen}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-extrabold">Página {page} de {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* ============================================ */}
      {/* VISTA RESUMEN POR GROOMER                     */}
      {/* ============================================ */}
      {viewMode === "resumen" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resumenGroomers.length === 0 ? (
            <EmptyState icon={<User className="h-12 w-12" />} title="Sin datos" description="No hay consumos registrados" />
          ) : (
            resumenGroomers.map((g) => (
              <Card key={g.groomerId} className="hover:shadow-cartoon-hover transition-all">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {g.nombre} {g.apellido}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-primary/20 rounded-xl p-2 text-center">
                      <p className="text-lg font-extrabold">{g.usados}</p>
                      <p className="text-[10px] font-semibold">Usados</p>
                    </div>
                    <div className="bg-secondary/50 rounded-xl p-2 text-center">
                      <p className="text-lg font-extrabold">{g.devueltos}</p>
                      <p className="text-[10px] font-semibold">Devueltos</p>
                    </div>
                    <div className="bg-rose/10 rounded-xl p-2 text-center">
                      <p className="text-lg font-extrabold text-rose">{g.mermas}</p>
                      <p className="text-[10px] font-semibold">Mermas</p>
                    </div>
                  </div>

                  {/* Cantidades */}
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span>Cantidad usada:</span>
                      <span className="font-bold">{g.cantidadUsada} uds</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cantidad devuelta:</span>
                      <span className="font-bold text-secondary">{g.cantidadDevuelta} uds</span>
                    </div>
                    <div className="flex justify-between border-t-2 border-foreground/20 pt-1 mt-1">
                      <span className="font-extrabold">Total registros:</span>
                      <span className="font-extrabold">{g.totalConsumos}</span>
                    </div>
                  </div>

                  {/* Productos más usados */}
                  {Object.keys(g.productos).length > 0 && (
                    <div className="border-t-2 border-foreground/20 pt-2">
                      <p className="text-xs font-bold mb-1">Productos más usados:</p>
                      <div className="space-y-1">
                        {Object.entries(g.productos)
                          .sort(([, a], [, b]) => (b as number) - (a as number))
                          .slice(0, 5)
                          .map(([nombre, cantidad]) => (
                            <div key={nombre} className="flex justify-between text-[10px] bg-secondary/30 rounded px-2 py-1">
                              <span>{nombre}</span>
                              <span className="font-bold">{cantidad as number} uds</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}