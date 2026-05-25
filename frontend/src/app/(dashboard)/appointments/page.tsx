"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/auth-store";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { Calendar, Plus, ChevronLeft, ChevronRight, GripVertical, Dog, Clock, User, AlertTriangle, Check, X } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import Link from "next/link";
import { toast } from "sonner";
import { format, addDays, startOfWeek, addWeeks, subWeeks } from "date-fns";
import { es } from "date-fns/locale";

interface Appointment {
  id: number;
  fechaHoraInicio: string;
  fechaHoraFin: string;
  estado: string;
  estadoSolicitud: string;
  duracionEstimadaMinutos: number;
  mascota: { id: number; nombre: string; raza: string | null };
  groomer: { id: number; usuario: { nombre: string; apellido: string } } | null;
  servicio: { id: number; nombre: string; precioBase: number; color?: string };
  creadoPor: { nombre: string } | null;
}

interface Groomer {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  groomer?: { id: number };
}

const COLORS = ["#A8D5BA", "#F4E4BA", "#E8A87C", "#C3B1E1", "#F4C2C2", "#7C8B9E"];

export default function AppointmentsPage() {
  const { user } = useAuthStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [groomers, setGroomers] = useState<Groomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [pendingRequests, setPendingRequests] = useState<Appointment[]>([]);
  const [showPending, setShowPending] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [appRes, groomRes] = await Promise.all([
        api.get("/appointments", { params: { fecha: format(weekStart, "yyyy-MM-dd") } }),
        api.get("/users/groomers"),
      ]);
      const apps = appRes.data.data || [];
      setAppointments(apps);
      setGroomers(groomRes.data.data || []);
      // Filtrar solicitudes pendientes
      setPendingRequests(apps.filter((a: Appointment) => a.estadoSolicitud === "Solicitada" || a.estadoSolicitud === "EnRevision"));
    } catch { toast.error("Error al cargar datos"); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [weekStart]);

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const appointmentId = parseInt(draggableId);
    const newGroomerId = destination.droppableId;

    try {
      await api.put(`/appointments/${appointmentId}`, { groomerId: parseInt(newGroomerId) });
      toast.success("Cita reasignada exitosamente");
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al mover cita");
      loadData(); // Recargar para restaurar posición
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await api.put(`/appointments/${id}/approve`);
      toast.success("Solicitud aprobada");
      loadData();
    } catch { toast.error("Error al aprobar"); }
  };

  const handleReject = async (id: number) => {
    try {
      await api.put(`/appointments/${id}/reject`);
      toast.success("Solicitud rechazada");
      loadData();
    } catch { toast.error("Error al rechazar"); }
  };

  // Generar días de la semana
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Agrupar citas por groomer
  const getAppointmentsForGroomer = (groomerId: number) => {
    return appointments.filter(a => 
      a.groomer?.id === groomerId && 
      a.estado !== "Cancelada" && 
      a.estado !== "NoAsistio" &&
      a.estadoSolicitud !== "Solicitada"
    );
  };

  if (loading) return <LoadingSpinner text="Cargando agenda..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Calendar className="h-8 w-8" strokeWidth={3} />
          <div>
            <h1 className="text-3xl font-extrabold">Agenda Semanal</h1>
            <p className="text-sm font-semibold text-foreground/70">
              {format(weekStart, "d 'de' MMMM", { locale: es })} - {format(addDays(weekStart, 6), "d 'de' MMMM, yyyy", { locale: es })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Bandeja de solicitudes */}
          {pendingRequests.length > 0 && (
            <Button variant="secondary" onClick={() => setShowPending(!showPending)} className="relative">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Solicitudes
              <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-[10px]">
                {pendingRequests.length}
              </Badge>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setWeekStart(subWeeks(weekStart, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeekStart(new Date())}>
            Hoy
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeekStart(addWeeks(weekStart, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Link href="/appointments/new">
            <Button><Plus className="mr-2 h-4 w-4" /> Nueva Cita</Button>
          </Link>
        </div>
      </div>

      {/* Bandeja de solicitudes pendientes */}
      {showPending && pendingRequests.length > 0 && (
        <Card className="border-accent bg-accent/5 p-4">
          <h2 className="text-lg font-extrabold mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-accent" />
            Solicitudes Pendientes ({pendingRequests.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingRequests.map((a) => (
              <div key={a.id} className="p-3 border-2 border-foreground rounded-xl bg-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Dog className="h-4 w-4" />
                    <span className="font-extrabold">{a.mascota.nombre}</span>
                  </div>
                  <Badge variant="secondary">En revisión</Badge>
                </div>
                <p className="text-xs">{a.servicio.nombre} • {a.duracionEstimadaMinutos} min</p>
                <p className="text-xs text-foreground/50">
                  {format(new Date(a.fechaHoraInicio), "dd/MM HH:mm")} • {a.creadoPor?.nombre || "Cliente"}
                </p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="default" onClick={() => handleApprove(a.id)} className="flex-1">
                    <Check className="h-3 w-3 mr-1" /> Aprobar
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleReject(a.id)} className="flex-1">
                    <X className="h-3 w-3 mr-1" /> Rechazar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Calendario semanal con columnas por groomer */}
      {groomers.length === 0 ? (
        <EmptyState icon={<User className="h-12 w-12" />} title="No hay groomers" description="Registra groomers para ver la agenda" />
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="overflow-x-auto">
            <div className="flex gap-4 min-w-[800px]">
              {groomers.map((groomer, idx) => {
                const groomerApps = getAppointmentsForGroomer(groomer.groomer?.id || groomer.id);
                return (
                  <div key={groomer.id} className="flex-1 min-w-[200px]">
                    {/* Header del groomer */}
                    <div className="rounded-xl border-3 border-foreground p-3 mb-3 text-center" style={{ backgroundColor: COLORS[idx % COLORS.length] }}>
                      <p className="font-extrabold text-sm">{groomer.nombre} {groomer.apellido}</p>
                      <p className="text-xs font-semibold">{groomerApps.length} citas</p>
                    </div>

                    <Droppable droppableId={String(groomer.groomer?.id || groomer.id)}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`min-h-[300px] space-y-2 p-2 rounded-xl transition-colors ${
                            snapshot.isDraggingOver ? "bg-primary/20 border-2 border-dashed border-primary" : ""
                          }`}
                        >
                          {groomerApps.length === 0 ? (
                            <p className="text-xs text-foreground/40 text-center py-8">Sin citas asignadas</p>
                          ) : (
                            groomerApps.map((a, index) => (
                              <Draggable key={a.id} draggableId={a.id.toString()} index={index}>
                                {(provided, snapshot) => (
                                  <Card
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`text-xs transition-all cursor-grab ${
                                      snapshot.isDragging ? "shadow-cartoon rotate-2 scale-105 z-50" : "hover:shadow-cartoon-hover"
                                    }`}
                                  >
                                    <div className="p-2">
                                      <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-1" {...provided.dragHandleProps}>
                                          <GripVertical className="h-3 w-3 text-foreground/40" />
                                          <span className="font-extrabold">{a.mascota.nombre}</span>
                                        </div>
                                        <span className="font-mono text-[10px]">
                                          {format(new Date(a.fechaHoraInicio), "HH:mm")}
                                        </span>
                                      </div>
                                      <p className="text-[10px] text-foreground/70">{a.servicio.nombre} • {a.duracionEstimadaMinutos}min</p>
                                      {a.mascota.raza && <p className="text-[10px] text-foreground/50">{a.mascota.raza}</p>}
                                      <Badge className="mt-1 text-[10px]" variant="outline">{a.estado}</Badge>
                                    </div>
                                  </Card>
                                )}
                              </Draggable>
                            ))
                          )}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </div>
        </DragDropContext>
      )}
    </div>
  );
}