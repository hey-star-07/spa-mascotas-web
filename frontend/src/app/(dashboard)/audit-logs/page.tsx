"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import api from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import {
  ScrollText, Search, RefreshCw, AlertTriangle, Lock,
  ChevronLeft, ChevronRight, Shield, LogIn, LogOut, UserPlus, Edit, Trash2, Activity,
} from "lucide-react";

interface AuditLogEntry {
  id: number;
  tablaAfectada: string;
  registroId: number | null;
  accion: string;
  usuario: {
    id: number;
    nombre: string;
    apellido: string | null;
    rol: string;
    email: string;
  } | null;
  datosNuevos: any;
  ipAddress: string | null;
  userAgent: string | null;
  fechaAccion: string;
}

const ACTION_CONFIG: Record<string, { color: string; label: string }> = {
  LOGIN: { color: "bg-primary", label: "Inicio de Sesión" },
  LOGIN_FAILED: { color: "bg-rose", label: "Intento Fallido" },
  LOGOUT: { color: "bg-secondary", label: "Cierre de Sesión" },
  CREATE: { color: "bg-lavender", label: "Creación" },
  UPDATE: { color: "bg-accent", label: "Actualización" },
  DELETE: { color: "bg-rose", label: "Eliminación" },
  DEACTIVATE: { color: "bg-rose", label: "Desactivación" },
  REACTIVATE: { color: "bg-primary", label: "Reactivación" },
  PASSWORD_CHANGE: { color: "bg-lavender", label: "Cambio de Contraseña" },
};

const getActionConfig = (accion: string) => {
  return ACTION_CONFIG[accion] || { color: "bg-gray-300", label: accion };
};

export default function AuditLogsPage() {
  const { user } = useAuthStore();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 15;

  const loadLogs = async () => {
    setLoading(true);
    setError(false);
    try {
      const { data } = await api.get("/audit-logs", {
        params: { search: search || undefined, accion: filterAction || undefined, page, limit },
      });
      setLogs(data.data.logs);
      setTotal(data.data.total);
      setTotalPages(data.data.totalPages);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLogs(); }, [page, search, filterAction]);

  if (user?.rol !== "Admin") {
    return <EmptyState icon={<Shield className="h-16 w-16" />} title="Acceso Restringido" description="Solo el administrador puede ver los logs" />;
  }

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString("es-BO", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
  };

  const getBrowser = (ua: string | null) => {
    if (!ua) return "—";
    if (ua.includes("Chrome")) return "Chrome";
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Safari")) return "Safari";
    if (ua.includes("Edge")) return "Edge";
    return ua.split(" ")[0] || "—";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border-3 border-foreground bg-info p-2">
            <ScrollText className="h-8 w-8 text-white" strokeWidth={3} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold">Auditoría</h1>
            <p className="text-sm font-semibold text-foreground/70">{total} registros totales</p>
          </div>
        </div>
        <Button onClick={loadLogs} variant="outline" disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/50" />
              <Input placeholder="Buscar usuario, email, IP..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-10" />
            </div>
            <select value={filterAction} onChange={(e) => { setFilterAction(e.target.value); setPage(1); }} className="h-12 rounded-xl border-3 border-foreground bg-white px-4 font-bold shadow-cartoon-sm">
              <option value="">Todas las acciones</option>
              {Object.entries(ACTION_CONFIG).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      {loading ? <LoadingSpinner text="Cargando logs..." /> :
       error ? <ErrorState onRetry={loadLogs} /> :
       logs.length === 0 ? <EmptyState icon={<ScrollText className="h-12 w-12" />} title="No hay registros" /> :
       (
        <Card>
          <CardContent className="pt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-3 border-foreground text-left">
                  <th className="pb-3 font-extrabold px-2">#</th>
                  <th className="pb-3 font-extrabold px-2">Fecha/Hora</th>
                  <th className="pb-3 font-extrabold px-2">Usuario</th>
                  <th className="pb-3 font-extrabold px-2">Rol</th>
                  <th className="pb-3 font-extrabold px-2">Acción</th>
                  <th className="pb-3 font-extrabold px-2 hidden md:table-cell">Tabla</th>
                  <th className="pb-3 font-extrabold px-2 hidden lg:table-cell">IP</th>
                  <th className="pb-3 font-extrabold px-2 hidden lg:table-cell">Navegador</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, index) => {
                  const config = getActionConfig(log.accion);
                  return (
                    <tr key={log.id} className="border-b-2 border-foreground/20 hover:bg-primary/10 transition-colors">
                      <td className="py-2 px-2 font-bold text-foreground/50">{(page - 1) * limit + index + 1}</td>
                      <td className="py-2 px-2 font-semibold text-xs whitespace-nowrap">{formatDateTime(log.fechaAccion)}</td>
                      <td className="py-2 px-2 font-bold">{log.usuario ? `${log.usuario.nombre} ${log.usuario.apellido || ""}` : "Sistema"}</td>
                      <td className="py-2 px-2">
                        {log.usuario && (
                          <Badge className="text-xs" variant="outline">{log.usuario.rol}</Badge>
                        )}
                      </td>
                      <td className="py-2 px-2">
                        <Badge className={`text-xs ${config.color}`}>{config.label}</Badge>
                        {log.datosNuevos?.attempt && (
                          <span className="text-xs text-rose font-bold ml-1">
                            ({log.datosNuevos.attempt}/{log.datosNuevos.maxAttempts})
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-xs hidden md:table-cell">{log.tablaAfectada}</td>
                      <td className="py-2 px-2 font-mono text-xs hidden lg:table-cell">{log.ipAddress || "—"}</td>
                      <td className="py-2 px-2 text-xs hidden lg:table-cell">{getBrowser(log.userAgent)}</td>
                    </tr>
                  );
                })}
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
    </div>
  );
}