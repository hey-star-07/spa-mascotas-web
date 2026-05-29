"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { AlertTriangle, Check, X, Dog, Calendar, User, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Solicitud {
  id: number;
  fechaHoraInicio: string;
  duracionEstimadaMinutos: number;
  estadoSolicitud: string;
  mascota: { id: number; nombre: string; raza: string | null };
  servicio: { id: number; nombre: string };
  cliente: { nombre: string };
  creadoPor: { nombre: string; apellido: string } | null;
}

export default function PendingRequestsPage() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSolicitudes = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/appointments", { params: { estadoSolicitud: "Solicitada" } });
      // Filtrar solo las solicitadas
      const pendientes = (data.data || []).filter(
        (a: any) => a.estadoSolicitud === "Solicitada" || a.estadoSolicitud === "EnRevision"
      );
      setSolicitudes(pendientes);
    } catch { toast.error("Error al cargar solicitudes"); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadSolicitudes(); }, []);

  const handleApprove = async (id: number) => {
    try {
      await api.put(`/appointments/${id}/approve`);
      toast.success("✅ Solicitud aprobada");
      loadSolicitudes();
    } catch { toast.error("Error al aprobar"); }
  };

  const handleReject = async (id: number) => {
    try {
      await api.put(`/appointments/${id}/reject`);
      toast.success("❌ Solicitud rechazada");
      loadSolicitudes();
    } catch { toast.error("Error al rechazar"); }
  };

  if (loading) return <LoadingSpinner text="Cargando solicitudes..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl border-3 border-foreground bg-accent p-2">
          <AlertTriangle className="h-8 w-8" strokeWidth={3} />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold">Solicitudes Pendientes</h1>
          <p className="text-sm font-semibold text-foreground/70">
            {solicitudes.length} solicitud{solicitudes.length !== 1 && "es"} por revisar
          </p>
        </div>
      </div>

      {solicitudes.length === 0 ? (
        <EmptyState
          icon={<Check className="h-12 w-12" />}
          title="¡Todo al día!"
          description="No hay solicitudes pendientes por revisar"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {solicitudes.map((s) => (
            <Card key={s.id} className="border-accent bg-accent/5 hover:shadow-cartoon-hover transition-all">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Dog className="h-5 w-5" />
                    {s.mascota.nombre}
                  </CardTitle>
                  <Badge variant="secondary">Pendiente</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span className="font-semibold">
                      {format(new Date(s.fechaHoraInicio), "EEEE d 'de' MMMM", { locale: es })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{format(new Date(s.fechaHoraInicio), "HH:mm")} • {s.duracionEstimadaMinutos} min</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Cliente: {s.cliente?.nombre || s.creadoPor?.nombre || "N/A"}</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl border-2 border-foreground p-2">
                  <p className="text-sm font-bold">{s.servicio.nombre}</p>
                  {s.mascota.raza && <p className="text-xs text-foreground/70">Raza: {s.mascota.raza}</p>}
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleApprove(s.id)}
                    className="flex-1"
                  >
                    <Check className="h-4 w-4 mr-1" /> Aprobar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleReject(s.id)}
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-1" /> Rechazar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
