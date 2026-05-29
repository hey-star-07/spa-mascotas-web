"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/auth-store";
import { getImageUrl } from "@/lib/images";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Calendar, Plus, ChevronLeft, ChevronRight, GripVertical,
  Dog, Clock, User, AlertTriangle, Check, X, Users, PawPrint,
  Info, CircleCheck, AlertCircle, Ban
} from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { toast } from "sonner";
import { format, addDays, subDays, parseISO } from "date-fns";
import { es } from "date-fns/locale";

 
// ============================================
// TIPOS
// ============================================
interface Appointment {
  id: number;
  fechaHoraInicio: string;
  fechaHoraFin: string;
  estado: string;
  duracionEstimadaMinutos: number;
  mascota: { id: number; nombre: string; raza: string | null; imagen: string | null };
  servicio: { id: number; nombre: string; duracionBaseMinutos: number };
  groomer: { id: number; usuario: { nombre: string; apellido: string } } | null;
}

interface Groomer {
  id: number;
  nombre: string;
  apellido: string;
  groomer?: { id: number };
}

interface Bloqueo {
  id: number;
  tipo: string;
  fechaInicio: string;
  fechaFin: string;
  descripcion: string | null;
}

// ============================================
// CONSTANTES
// ============================================
const HOURS = Array.from({ length: 10 }, (_, i) => `${(i + 8).toString().padStart(2, "0")}:00`);
const GROOMER_COLORS = ["#A8D5BA", "#F4E4BA", "#E8A87C", "#C3B1E1", "#F4C2C2", "#7C8B9E"];
const APPT_COLORS: Record<string, string> = {
  blue: "border-l-4 border-l-blue-500 bg-blue-50",
  green: "border-l-4 border-l-green-500 bg-green-50",
  amber: "border-l-4 border-l-amber-500 bg-amber-50",
  purple: "border-l-4 border-l-purple-500 bg-purple-50",
  coral: "border-l-4 border-l-rose-500 bg-rose-50",
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function CalendarPage() {
  const { user } = useAuthStore();
  const [viewMode, setViewMode] = useState<"groomers" | "pets">("groomers");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [groomers, setGroomers] = useState<Groomer[]>([]);
  const [bloqueos, setBloqueos] = useState<Bloqueo[]>([]);
  const [loading, setLoading] = useState(true);

  // Log de acciones
  const [logMessage, setLogMessage] = useState<{ type: "info" | "ok" | "error"; text: string }>({
    type: "info",
    text: "Arrastrá una cita para reprogramarla. El sistema valida disponibilidad en tiempo real.",
  });
  const [showConflict, setShowConflict] = useState(false);
  const [showOk, setShowOk] = useState(false);

  // Diálogo detalle
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // ============================================
  // CARGA DE DATOS
  // ============================================
    const loadData = async () => {
    setLoading(true);
    try {
        const fecha = format(selectedDate, "yyyy-MM-dd");
        console.log('🔍 FRONTEND - Cargando citas para:', fecha);
        
        const [appRes, groomRes, bloqRes] = await Promise.all([
        api.get("/appointments", { params: { fecha } }),
        api.get("/users/groomers"),
        api.get("/availability/bloqueos"),
        ]);
        
        console.log('🔍 FRONTEND - Respuesta citas:', appRes.data);
        console.log('🔍 FRONTEND - Total citas:', appRes.data.data?.length);
        
        setAppointments(appRes.data.data || []);
        setGroomers(groomRes.data.data || []);
        setBloqueos(bloqRes.data.data || []);
    } catch (error: any) {
        console.error('🔍 FRONTEND - Error:', error);
        toast.error("Error al cargar datos");
    } finally {
        setLoading(false);
    }
    };

  useEffect(() => { loadData(); }, [selectedDate]);

  // ============================================
  // HELPERS
  // ============================================
  const getAppointmentsForGroomer = (groomerId: number) => {
    return appointments.filter(
      (a) =>
        a.groomer?.id === groomerId &&
        a.estado !== "Cancelada" &&
        a.estado !== "NoAsistio"
    );
  };

  const getAppointmentAtHour = (groomerId: number, hour: string) => {
    const hourNum = parseInt(hour.split(":")[0]);
    return getAppointmentsForGroomer(groomerId).find((a) => {
      const appHour = new Date(a.fechaHoraInicio).getHours();
      return appHour === hourNum;
    });
  };

  const isBlocked = (groomerId: number, date: Date, hour: string) => {
    const hourNum = parseInt(hour.split(":")[0]);
    const checkDate = new Date(date);
    checkDate.setHours(hourNum, 0, 0, 0);

    return bloqueos.some((b) => {
      const inicio = new Date(b.fechaInicio);
      const fin = new Date(b.fechaFin);
      return checkDate >= inicio && checkDate <= fin;
    });
  };

  const getApptColor = (index: number): string => {
    const colors = ["blue", "green", "amber", "purple", "coral"];
    return colors[index % colors.length];
  };

  // ============================================
  // DRAG & DROP
  // ============================================
  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    const appointmentId = parseInt(draggableId);
    const newGroomerId = parseInt(destination.droppableId);
    const newHour = HOURS[destination.index];

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      setLogMessage({ type: "info", text: "Sin cambios: misma posición." });
      return;
    }

    // Verificar bloqueo
    if (isBlocked(newGroomerId, selectedDate, newHour)) {
      setLogMessage({ type: "error", text: `No se puede mover: el horario ${newHour} está bloqueado.` });
      triggerConflict();
      return;
    }

    const appointment = appointments.find((a) => a.id === appointmentId);
    if (!appointment) return;

    try {
      const fechaHoraInicio = new Date(selectedDate);
      fechaHoraInicio.setHours(parseInt(newHour.split(":")[0]), 0, 0, 0);

      await api.put(`/appointments/${appointmentId}`, {
        groomerId: newGroomerId,
        fechaHoraInicio: fechaHoraInicio.toISOString(),
      });

      const oldGroomer = appointment.groomer?.usuario?.nombre || "Sin asignar";
      const newGroomer = groomers.find((g) => (g.groomer?.id || g.id) === newGroomerId);
      const newGroomerName = newGroomer?.nombre || "Desconocido";

      setLogMessage({
        type: "ok",
        text: `${appointment.mascota.nombre} reprogramado: ${oldGroomer} → ${newGroomerName} ${newHour}`,
      });
      triggerOk();
      loadData();
    } catch (error: any) {
      setLogMessage({ type: "error", text: error.response?.data?.message || "Error al reprogramar" });
      triggerConflict();
    }
  };

  const triggerConflict = () => {
    setShowConflict(true);
    setShowOk(false);
    setTimeout(() => setShowConflict(false), 3000);
  };

  const triggerOk = () => {
    setShowOk(true);
    setShowConflict(false);
    setTimeout(() => setShowOk(false), 3000);
  };

  // ============================================
  // VISTA GROOMERS (columnas por día)
  // ============================================
  const renderGroomersView = () => (
    <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[600px]">
        <thead>
            <tr>
            <th className="p-2 text-xs font-bold border-b-2 border-foreground w-[60px]"></th>
            <th className="p-2 text-center text-xs font-bold border-b-2 border-foreground">
                {format(selectedDate, "EEEE d", { locale: es })}
            </th>
            </tr>
        </thead>
        <tbody>
            {HOURS.map((hour, hi) => (
            <tr key={hi}>
                <td className="p-1 text-[10px] text-foreground/50 text-right border-r border-foreground/10 align-top pt-2">
                {hour}
                </td>
                <td className="p-1 align-top min-h-[50px] border-b border-foreground/10">
                <div className="min-h-[48px] rounded p-1">
                    {groomers.map((groomer) => {
                    const appt = getAppointmentAtHour(groomer.groomer?.id || groomer.id, hour);
                    if (!appt) return null;
                    const colorIndex = groomers.indexOf(groomer);
                    return (
                        <div
                        key={appt.id}
                        onClick={() => { setSelectedAppointment(appt); setDetailOpen(true); }}
                        className="p-2 rounded-lg mb-1 cursor-pointer border-2 border-foreground/30 text-xs transition-all hover:shadow-sm"
                        style={{ backgroundColor: GROOMER_COLORS[colorIndex % GROOMER_COLORS.length] }}
                        >
                        <div className="flex items-center justify-between">
                            <span className="font-extrabold">{appt.mascota.nombre}</span>
                        </div>
                        <p className="text-[10px]">{appt.servicio.nombre}</p>
                        <div className="flex items-center gap-1 mt-1">
                            <User className="h-3 w-3" />
                            <span className="text-[10px]">{groomer.nombre}</span>
                        </div>
                        </div>
                    );
                    })}
                    {isBlocked(0, selectedDate, hour) && groomers.every(g => !getAppointmentAtHour(g.groomer?.id || g.id, hour)) && (
                    <div className="flex items-center justify-center h-[46px] text-[10px] text-rose/50">
                        <Ban className="h-3 w-3 mr-1" /> Bloqueado
                    </div>
                    )}
                    {!isBlocked(0, selectedDate, hour) && groomers.every(g => !getAppointmentAtHour(g.groomer?.id || g.id, hour)) && (
                    <div className="flex items-center justify-center h-[46px] border border-dashed border-foreground/20 rounded-lg text-[10px] text-foreground/30">
                        libre
                    </div>
                    )}
                </div>
                </td>
            </tr>
            ))}
        </tbody>
        </table>
    </div>
    );
  // ============================================
  // VISTA MASCOTAS (columnas por groomer)
  // ============================================
  const renderPetsView = () => (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[600px]">
          <thead>
            <tr>
              <th className="p-2 text-xs font-bold border-b-2 border-foreground w-[60px]"></th>
              {groomers.map((groomer, gi) => {
                const count = getAppointmentsForGroomer(groomer.groomer?.id || groomer.id).length;
                return (
                  <th key={gi} className="p-2 text-center text-xs font-bold border-b-2 border-foreground">
                    <div>{groomer.nombre}</div>
                    <div className="text-[10px] font-normal text-foreground/50">
                      {count} cita{count !== 1 && "s"}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {HOURS.map((hour, hi) => (
              <tr key={hi}>
                <td className="p-1 text-[10px] text-foreground/50 text-right border-r border-foreground/10 align-top pt-2">
                  {hour}
                </td>
                {groomers.map((groomer, gi) => {
                  const groomerId = groomer.groomer?.id || groomer.id;
                  const appt = getAppointmentAtHour(groomerId, hour);
                  const blocked = isBlocked(groomerId, selectedDate, hour);
                  const colorIndex = gi % GROOMER_COLORS.length;

                  return (
                    <td
                      key={gi}
                      className={`p-1 align-top min-h-[50px] border-b border-foreground/10 border-r border-foreground/10 ${
                        blocked ? "bg-rose/5" : ""
                      }`}
                    >
                      <Droppable droppableId={String(groomerId)}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`min-h-[48px] rounded p-1 transition-colors ${
                              snapshot.isDraggingOver ? "bg-primary/20" : ""
                            }`}
                          >
                            {appt ? (
                              <Draggable key={appt.id} draggableId={appt.id.toString()} index={hi}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    onClick={() => { setSelectedAppointment(appt); setDetailOpen(true); }}
                                    className={`p-2 rounded-lg mb-1 cursor-grab border-2 border-foreground/30 text-xs transition-all hover:shadow-sm ${
                                      snapshot.isDragging ? "shadow-lg rotate-1 scale-105 z-50" : ""
                                    }`}
                                    style={{
                                      backgroundColor: GROOMER_COLORS[colorIndex],
                                      ...provided.draggableProps.style,
                                    }}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-extrabold">{appt.mascota.nombre}</span>
                                      <GripVertical className="h-3 w-3 text-foreground/40" />
                                    </div>
                                    <p className="text-[10px]">{appt.servicio.nombre} · {appt.duracionEstimadaMinutos}min</p>
                                    <Badge className="text-[9px] mt-1" variant="outline">{appt.estado}</Badge>
                                  </div>
                                )}
                              </Draggable>
                            ) : blocked ? (
                              <div className="flex items-center justify-center h-[46px] text-[10px] text-rose/50">
                                <Ban className="h-3 w-3 mr-1" /> Bloqueado
                              </div>
                            ) : (
                              <div className="flex items-center justify-center h-[46px] border border-dashed border-foreground/20 rounded-lg text-[10px] text-foreground/30">
                                libre
                              </div>
                            )}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DragDropContext>
  );

// ============================================
// RENDER PRINCIPAL (CORREGIDO)
// ============================================
    if (loading) return <LoadingSpinner text="Cargando calendario..." />;

    return (
    <DragDropContext onDragEnd={handleDragEnd}>
        <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between flex-wrap gap-3 p-3 bg-white border-3 border-foreground rounded-xl">
            <div>
            <h1 className="text-lg font-extrabold flex items-center gap-2">
                <Calendar className="h-6 w-6" />
                Calendario Maestro
            </h1>
            <p className="text-xs text-foreground/50">
                {format(selectedDate, "EEEE d 'de' MMMM, yyyy", { locale: es })} · {user?.rol}
            </p>
            </div>
            <div className="flex items-center gap-2">
            {/* Botones de vista */}
            <div className="flex border-2 border-foreground rounded-lg overflow-hidden">
                <button
                onClick={() => setViewMode("groomers")}
                className={`px-3 py-1.5 text-xs font-bold transition-colors ${
                    viewMode === "groomers" ? "bg-primary" : "bg-white hover:bg-primary/20"
                }`}
                >
                <Users className="inline h-3 w-3 mr-1" /> Groomers
                </button>
                <button
                onClick={() => setViewMode("pets")}
                className={`px-3 py-1.5 text-xs font-bold transition-colors ${
                    viewMode === "pets" ? "bg-primary" : "bg-white hover:bg-primary/20"
                }`}
                >
                <PawPrint className="inline h-3 w-3 mr-1" /> Mascotas
                </button>
            </div>

            {/* Navegación de fecha */}
            <Button variant="outline" size="sm" onClick={() => setSelectedDate(subDays(selectedDate, 1))}>
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>
                Hoy
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSelectedDate(addDays(selectedDate, 1))}>
                <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Badges */}
            <Badge variant="outline" className="text-xs">{appointments.length} citas</Badge>
            {showConflict && <Badge variant="destructive" className="text-xs animate-pulse">⚠ Conflicto</Badge>}
            {showOk && <Badge variant="default" className="text-xs">✓ Movido</Badge>}
            </div>
        </div>

        {/* Hint */}
        <div className="flex items-center gap-2 text-xs text-foreground/50 bg-secondary/50 rounded-xl p-2 px-4">
            <Info className="h-4 w-4" />
            {viewMode === "groomers"
            ? "Vista de citas del día. Haz clic en una cita para ver detalles."
            : "Arrastrá cualquier cita a otro groomer para reprogramarla. El sistema valida disponibilidad en tiempo real."}
        </div>

        {/* Calendario */}
        <Card>
            <CardContent className="p-2">
            {viewMode === "groomers" ? renderGroomersView() : renderPetsView()}
            </CardContent>
        </Card>

        {/* Log de acciones */}
        <div className="flex items-center gap-2 text-xs p-3 bg-secondary/50 rounded-xl border border-foreground/20 min-h-[44px]">
            {logMessage.type === "info" && <Info className="h-4 w-4 text-info" />}
            {logMessage.type === "ok" && <CircleCheck className="h-4 w-4 text-primary" />}
            {logMessage.type === "error" && <AlertCircle className="h-4 w-4 text-rose" />}
            <span>{logMessage.text}</span>
        </div>

        {/* Diálogo de detalle */}
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
            <DialogContent>
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                <Dog className="h-5 w-5" />
                {selectedAppointment?.mascota.nombre}
                </DialogTitle>
            </DialogHeader>
            {selectedAppointment && (
                <div className="space-y-3">
                {selectedAppointment.mascota.imagen && (
                    <img
                    src={getImageUrl(selectedAppointment.mascota.imagen) || ''}
                    alt={selectedAppointment.mascota.nombre}
                    className="w-full h-32 object-cover rounded-xl border-3 border-foreground"
                    />
                )}
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><strong>Servicio:</strong> {selectedAppointment.servicio.nombre}</div>
                    <div><strong>Duración:</strong> {selectedAppointment.duracionEstimadaMinutos} min</div>
                    <div><strong>Groomer:</strong> {selectedAppointment.groomer?.usuario?.nombre || "Sin asignar"}</div>
                    <div><strong>Estado:</strong> <Badge variant="outline">{selectedAppointment.estado}</Badge></div>
                    <div><strong>Hora:</strong> {format(parseISO(selectedAppointment.fechaHoraInicio), "HH:mm")}</div>
                    <div><strong>Raza:</strong> {selectedAppointment.mascota.raza || "N/A"}</div>
                </div>
                </div>
            )}
            <DialogFooter>
                <Button variant="outline" onClick={() => setDetailOpen(false)}>Cerrar</Button>
            </DialogFooter>
            </DialogContent>
        </Dialog>
        </div>
    </DragDropContext>
    );
}