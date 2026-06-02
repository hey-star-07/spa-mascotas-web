"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/auth-store";
import { getImageUrl } from "@/lib/images";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Calendar, ChevronLeft, ChevronRight, GripVertical,
  Dog, Clock, User, AlertTriangle, Users, PawPrint,
  Info, CircleCheck, AlertCircle, Ban, CalendarDays,
} from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { toast } from "sonner";
import { format, addDays, subDays, parseISO, isSameDay, isToday, startOfMonth, endOfMonth, getDay, addMonths, subMonths } from "date-fns";
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

interface CapacidadGroomer {
  total: number;
  ocupadas: number;
  disponibles: number;
  limite: number;
  alLimite: boolean;
}

// ============================================
// CONSTANTES
// ============================================
const HOURS = Array.from({ length: 10 }, (_, i) => `${(i + 9).toString().padStart(2, "0")}:00`);
const GROOMER_COLORS = ["#A8D5BA", "#F4E4BA", "#E8A87C", "#C3B1E1", "#F4C2C2", "#7C8B9E"];

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function CalendarPage() {
  const { user } = useAuthStore();
  const [viewMode, setViewMode] = useState<"groomers" | "pets">("pets");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [groomers, setGroomers] = useState<Groomer[]>([]);
  const [bloqueos, setBloqueos] = useState<Bloqueo[]>([]);
  const [capacidades, setCapacidades] = useState<Record<number, CapacidadGroomer>>({});
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Log
  const [logMessage, setLogMessage] = useState<{ type: "info" | "ok" | "error"; text: string }>({
    type: "info", text: "Arrastrá una cita a otro groomer para reprogramarla.",
  });

  // Diálogos
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedGroomerForAssign, setSelectedGroomerForAssign] = useState<Groomer | null>(null);
  const [assignForm, setAssignForm] = useState({ mascotaId: "", servicioId: "", fecha: "", hora: "" });
  const [assigning, setAssigning] = useState(false);
  const [pets, setPets] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  // Selector de fecha
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(new Date());
  const loadDataRef = useRef<NodeJS.Timeout | null>(null);

  // ============================================
  // CARGA DE DATOS
  // ============================================
  useEffect(() => {
    // Carga inicial (solo una vez)
    Promise.all([
      api.get("/users/groomers"),
      api.get("/availability/bloqueos"),
      api.get("/pets/all"),
      api.get("/services?active=true"),
    ]).then(([groomRes, bloqRes, petsRes, servRes]) => {
      setGroomers(groomRes.data.data || []);
      setBloqueos(bloqRes.data.data || []);
      setPets(petsRes.data.data || []);
      setServices(servRes.data.data || []);
    }).catch(() => {});
  }, []);

  // Cargar citas cuando cambia fecha (con debounce)
  useEffect(() => {
    if (loadDataRef.current) clearTimeout(loadDataRef.current);
    loadDataRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const fecha = format(selectedDate, "yyyy-MM-dd");
        const [appRes] = await Promise.all([
          api.get("/appointments", { params: { fecha } }),
        ]);
        setAppointments(appRes.data.data || []);
        // Cargar capacidades
        loadCapacidades(fecha);
      } catch (error: any) {
        if (error.response?.status !== 429) toast.error("Error al cargar citas");
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => { if (loadDataRef.current) clearTimeout(loadDataRef.current); };
  }, [selectedDate]);

  const loadCapacidades = async (fecha: string) => {
    const caps: Record<number, CapacidadGroomer> = {};
    for (const g of groomers) {
      try {
        const { data } = await api.get(`/availability/capacidad/${g.groomer?.id || g.id}`, { params: { fecha } });
        caps[g.id] = data.data;
      } catch {}
    }
    setCapacidades(caps);
  };

  // ============================================
  // HELPERS
  // ============================================
  const getAppointmentsForGroomer = useCallback((groomerId: number) => {
    return appointments.filter(a => a.groomer?.id === groomerId && a.estado !== "Cancelada" && a.estado !== "NoAsistio");
  }, [appointments]);

  const getAppointmentAtHour = (groomerId: number, hour: string) => {
    const hourNum = parseInt(hour.split(":")[0]);
    return getAppointmentsForGroomer(groomerId).find(a => new Date(a.fechaHoraInicio).getHours() === hourNum);
  };

  const isBlocked = (date: Date, hour: string) => {
    const checkDate = new Date(date);
    checkDate.setHours(parseInt(hour.split(":")[0]), 0, 0, 0);
    return bloqueos.some(b => checkDate >= new Date(b.fechaInicio) && checkDate <= new Date(b.fechaFin));
  };

  // ============================================
  // DRAG & DROP
  // ============================================
  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const appointmentId = parseInt(draggableId);
    const newGroomerId = parseInt(destination.droppableId);
    const newHour = HOURS[destination.index];

    if (isBlocked(selectedDate, newHour)) {
      setLogMessage({ type: "error", text: `Horario ${newHour} bloqueado.` });
      return;
    }

    const appointment = appointments.find(a => a.id === appointmentId);
    if (!appointment) return;

    try {
      const fechaHoraInicio = new Date(selectedDate);
      fechaHoraInicio.setHours(parseInt(newHour.split(":")[0]), 0, 0, 0);

      await api.put(`/appointments/${appointmentId}`, {
        groomerId: newGroomerId,
        fechaHoraInicio: fechaHoraInicio.toISOString(),
      });

      const oldName = appointment.groomer?.usuario?.nombre || "Sin asignar";
      const newG = groomers.find(g => (g.groomer?.id || g.id) === newGroomerId);
      setLogMessage({ type: "ok", text: `${appointment.mascota.nombre}: ${oldName} → ${newG?.nombre || "?"} ${newHour}` });
      
      // Recargar
      const fecha = format(selectedDate, "yyyy-MM-dd");
      const appRes = await api.get("/appointments", { params: { fecha } });
      setAppointments(appRes.data.data || []);
    } catch (error: any) {
      setLogMessage({ type: "error", text: error.response?.data?.message || "Error al reprogramar" });
    }
  };

  // ============================================
  // ASIGNAR CITA
  // ============================================
  const openAssignDialog = (groomer: Groomer) => {
    setSelectedGroomerForAssign(groomer);
    setAssignForm({ mascotaId: "", servicioId: "", fecha: format(selectedDate, "yyyy-MM-dd"), hora: "" });
    setSlots([]);
    setAssignDialogOpen(true);
  };

  const loadSlotsForAssign = async () => {
    if (!selectedGroomerForAssign || !assignForm.fecha || !assignForm.servicioId) return;
    setLoadingSlots(true);
    try {
      const servicio = services.find(s => s.id.toString() === assignForm.servicioId);
      const duracion = servicio?.duracionBaseMinutos || 30;
      const { data } = await api.get("/availability/slots", {
        params: { groomerId: selectedGroomerForAssign.groomer?.id || selectedGroomerForAssign.id, fecha: assignForm.fecha, duracion },
      });
      setSlots(data.data?.slots || data.data || []);
    } catch { setSlots([]); }
    finally { setLoadingSlots(false); }
  };

  useEffect(() => { loadSlotsForAssign(); }, [assignForm.fecha, assignForm.servicioId, selectedGroomerForAssign]);

  const handleAssign = async () => {
    if (!selectedGroomerForAssign || !assignForm.mascotaId || !assignForm.servicioId || !assignForm.hora) {
      toast.error("Completa todos los campos");
      return;
    }
    setAssigning(true);
    try {
      const fechaHoraInicio = `${assignForm.fecha}T${assignForm.hora}:00`;
      const servicio = services.find(s => s.id.toString() === assignForm.servicioId);
      await api.post("/appointments", {
        mascotaId: parseInt(assignForm.mascotaId),
        servicioId: parseInt(assignForm.servicioId),
        groomerId: selectedGroomerForAssign.groomer?.id || selectedGroomerForAssign.id,
        fechaHoraInicio: new Date(fechaHoraInicio).toISOString(),
        duracionEstimadaMinutos: servicio?.duracionBaseMinutos || 30,
      });
      toast.success("Cita asignada");
      setAssignDialogOpen(false);
      const fecha = format(selectedDate, "yyyy-MM-dd");
      const appRes = await api.get("/appointments", { params: { fecha } });
      setAppointments(appRes.data.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error");
    } finally { setAssigning(false); }
  };

  // ============================================
  // SELECTOR DE FECHA (CALENDARIO)
  // ============================================
  const daysWithAppointments = new Set(appointments.map(a => format(parseISO(a.fechaHoraInicio), "yyyy-MM-dd")));

  const renderDatePicker = () => {
    const monthStart = startOfMonth(pickerMonth);
    const monthEnd = endOfMonth(pickerMonth);
    const startDay = getDay(monthStart);
    const daysInMonth = monthEnd.getDate();
    const weeks: (Date | null)[][] = [];
    let currentWeek: (Date | null)[] = [];

    for (let i = 0; i < startDay; i++) currentWeek.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      currentWeek.push(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth(), d));
      if (currentWeek.length === 7) { weeks.push(currentWeek); currentWeek = []; }
    }
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null);
      weeks.push(currentWeek);
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => setPickerMonth(subMonths(pickerMonth, 1))}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="font-extrabold text-sm">{format(pickerMonth, "MMMM yyyy", { locale: es })}</span>
          <Button variant="outline" size="sm" onClick={() => setPickerMonth(addMonths(pickerMonth, 1))}><ChevronRight className="h-4 w-4" /></Button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold">
          {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map(d => <div key={d}>{d}</div>)}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map((day, di) => {
              if (!day) return <div key={di} />;
              const dateStr = format(day, "yyyy-MM-dd");
              const hasApps = daysWithAppointments.has(dateStr);
              const isSel = isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);
              return (
                <button
                  key={di}
                  onClick={() => { setSelectedDate(day); setDatePickerOpen(false); }}
                  className={`h-9 rounded-xl border-2 text-xs font-bold transition-all ${
                    isSel ? "bg-primary border-foreground shadow-cartoon-sm" :
                    isTodayDate ? "border-primary bg-primary/20" :
                    hasApps ? "border-accent bg-accent/20" : "border-foreground/20 hover:bg-primary/10"
                  }`}
                >
                  {format(day, "d")}
                  {hasApps && <div className="w-1.5 h-1.5 rounded-full bg-accent mx-auto mt-0.5" />}
                </button>
              );
            })}
          </div>
        ))}
        <p className="text-[10px] text-foreground/50 text-center">
          <span className="inline-block w-2 h-2 rounded-full bg-accent mr-1" /> Días con citas
        </p>
      </div>
    );
  };

  // ============================================
  // VISTA MASCOTAS (DRAG & DROP)
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
                const cap = capacidades[groomer.id];
                return (
                  <th key={gi} className="p-2 text-center text-xs font-bold border-b-2 border-foreground min-w-[120px]">
                    <div className="flex items-center justify-center gap-1">
                      {groomer.nombre}
                      <button onClick={() => openAssignDialog(groomer)} className="text-primary hover:scale-110 transition-transform" title="Asignar cita">+</button>
                    </div>
                    <div className="text-[10px] font-normal text-foreground/50 mt-0.5">
                      {count}/{cap?.limite || 6} citas
                    </div>
                    {cap && (
                      <div className="flex gap-0.5 mt-1 max-w-[80px] mx-auto">
                        {Array.from({ length: cap.limite }).map((_, i) => (
                          <div key={i} className={`h-1.5 flex-1 rounded-full border border-foreground/20 ${i < cap.ocupadas ? (cap.alLimite ? "bg-rose" : "bg-primary") : "bg-gray-200"}`} />
                        ))}
                      </div>
                    )}
                    {cap?.alLimite && <p className="text-[9px] text-rose mt-0.5">Lleno</p>}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {HOURS.map((hour, hi) => (
              <tr key={hi}>
                <td className="p-1 text-[10px] text-foreground/50 text-right border-r border-foreground/10 align-top pt-2">{hour}</td>
                {groomers.map((groomer, gi) => {
                  const groomerId = groomer.groomer?.id || groomer.id;
                  const appt = getAppointmentAtHour(groomerId, hour);
                  const blocked = isBlocked(selectedDate, hour);
                  return (
                    <td key={gi} className={`p-1 align-top min-h-[50px] border-b border-foreground/10 border-r border-foreground/10 ${blocked ? "bg-rose/5" : ""}`}>
                      <Droppable droppableId={String(groomerId)}>
                        {(provided, snapshot) => (
                          <div ref={provided.innerRef} {...provided.droppableProps} className={`min-h-[48px] rounded p-1 transition-colors ${snapshot.isDraggingOver ? "bg-primary/20" : ""}`}>
                            {appt ? (
                              <Draggable key={appt.id} draggableId={appt.id.toString()} index={hi}>
                                {(provided, snapshot) => (
                                  <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                                    onClick={() => { setSelectedAppointment(appt); setDetailOpen(true); }}
                                    className={`p-2 rounded-lg mb-1 cursor-grab border-2 border-foreground/30 text-xs transition-all hover:shadow-sm ${snapshot.isDragging ? "shadow-lg rotate-1 scale-105 z-50" : ""}`}
                                    style={{ backgroundColor: GROOMER_COLORS[gi % GROOMER_COLORS.length], ...provided.draggableProps.style }}>
                                    <div className="flex items-center justify-between">
                                      <span className="font-extrabold">{appt.mascota.nombre}</span>
                                      <GripVertical className="h-3 w-3 text-foreground/40" />
                                    </div>
                                    <p className="text-[10px]">{appt.servicio.nombre} · {appt.duracionEstimadaMinutos}min</p>
                                  </div>
                                )}
                              </Draggable>
                            ) : blocked ? (
                              <div className="flex items-center justify-center h-[46px] text-[10px] text-rose/50"><Ban className="h-3 w-3 mr-1" />Bloqueado</div>
                            ) : (
                              <div className="flex items-center justify-center h-[46px] border border-dashed border-foreground/20 rounded-lg text-[10px] text-foreground/30">libre</div>
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

  // Vista Groomers (solo lectura) - AGREGAR DENTRO DEL COMPONENTE
  const renderGroomersView = () => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse min-w-[600px]">
        <thead>
          <tr>
            <th className="p-2 text-xs font-bold border-b-2 border-foreground w-[60px]"></th>
            <th className="p-2 text-center text-xs font-bold border-b-2 border-foreground">
              {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
            </th>
          </tr>
        </thead>
        <tbody>
          {HOURS.map((hour, hi) => (
            <tr key={hi}>
              <td className="p-1 text-[10px] text-foreground/50 text-right border-r border-foreground/10 align-top pt-2">{hour}</td>
              <td className="p-1 align-top min-h-[50px] border-b border-foreground/10">
                <div className="min-h-[48px] rounded p-1">
                  {groomers.map((groomer) => {
                    const appt = getAppointmentAtHour(groomer.groomer?.id || groomer.id, hour);
                    if (!appt) return null;
                    const colorIndex = groomers.indexOf(groomer);
                    return (
                      <div key={appt.id} onClick={() => { setSelectedAppointment(appt); setDetailOpen(true); }}
                        className="p-2 rounded-lg mb-1 cursor-pointer border-2 border-foreground/30 text-xs transition-all hover:shadow-sm"
                        style={{ backgroundColor: GROOMER_COLORS[colorIndex % GROOMER_COLORS.length] }}>
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold">{appt.mascota.nombre}</span>
                          <span className="text-[10px]">{appt.servicio.nombre}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <User className="h-3 w-3" />
                          <span className="text-[10px]">{groomer.nombre}</span>
                          <Badge className="text-[9px] ml-auto" variant="outline">{appt.estado}</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // ============================================
  // RENDER PRINCIPAL
  // ============================================
  if (loading && appointments.length === 0) return <LoadingSpinner text="Cargando calendario..." />;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3 p-3 bg-white border-3 border-foreground rounded-xl">
        <div>
          <h1 className="text-lg font-extrabold flex items-center gap-2"><Calendar className="h-6 w-6" />Calendario Maestro</h1>
          <p className="text-xs text-foreground/50">{format(selectedDate, "EEEE d 'de' MMMM, yyyy", { locale: es })}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border-2 border-foreground rounded-lg overflow-hidden">
            <button onClick={() => setViewMode("pets")} className={`px-3 py-1.5 text-xs font-bold ${viewMode === "pets" ? "bg-primary" : "bg-white hover:bg-primary/20"}`}>
              <PawPrint className="inline h-3 w-3 mr-1" />Mascotas
            </button>
            <button onClick={() => setViewMode("groomers")} className={`px-3 py-1.5 text-xs font-bold ${viewMode === "groomers" ? "bg-primary" : "bg-white hover:bg-primary/20"}`}>
              <Users className="inline h-3 w-3 mr-1" />Groomers
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={() => setSelectedDate(subDays(selectedDate, 1))}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>Hoy</Button>
          <Button variant="outline" size="sm" onClick={() => setSelectedDate(addDays(selectedDate, 1))}><ChevronRight className="h-4 w-4" /></Button>
          <Button variant="secondary" size="sm" onClick={() => { setPickerMonth(selectedDate); setDatePickerOpen(true); }}>
            <CalendarDays className="h-4 w-4 mr-1" /> Elegir día
          </Button>
          <Badge variant="outline" className="text-xs">{appointments.length} citas</Badge>
        </div>
      </div>

      {/* Hint */}
      <div className="flex items-center gap-2 text-xs text-foreground/50 bg-secondary/50 rounded-xl p-2 px-4">
        <Info className="h-4 w-4" />
        {viewMode === "pets" ? "Arrastrá una cita a otro groomer para reprogramarla." : "Vista del día. Haz clic en una cita para ver detalles."}
      </div>

      {/* Calendario */}
      <Card><CardContent className="p-2">{viewMode === "pets" ? renderPetsView() : renderGroomersView()}</CardContent></Card>

      {/* Log */}
      <div className="flex items-center gap-2 text-xs p-3 bg-secondary/50 rounded-xl border border-foreground/20 min-h-[44px]">
        {logMessage.type === "info" && <Info className="h-4 w-4 text-info" />}
        {logMessage.type === "ok" && <CircleCheck className="h-4 w-4 text-primary" />}
        {logMessage.type === "error" && <AlertCircle className="h-4 w-4 text-rose" />}
        <span>{logMessage.text}</span>
      </div>

      {/* Diálogo Detalle */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Dog className="h-5 w-5" />{selectedAppointment?.mascota.nombre}</DialogTitle>
            <DialogDescription>Detalle de la cita</DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-3">
              {selectedAppointment.mascota.imagen && <img src={getImageUrl(selectedAppointment.mascota.imagen) || ''} className="w-full h-32 object-cover rounded-xl border-3 border-foreground" />}
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
          <DialogFooter><Button variant="outline" onClick={() => setDetailOpen(false)}>Cerrar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo Asignar Cita */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Cita a {selectedGroomerForAssign?.nombre}</DialogTitle>
            <DialogDescription>{format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Mascota *</Label><select value={assignForm.mascotaId} onChange={e => setAssignForm({...assignForm, mascotaId: e.target.value})} className="w-full h-12 rounded-xl border-3 border-foreground bg-white px-4 font-bold"><option value="">Seleccionar</option>{pets.map((p: any) => <option key={p.id} value={p.id}>{p.nombre} ({p.especie})</option>)}</select></div>
            <div><Label>Servicio *</Label><select value={assignForm.servicioId} onChange={e => setAssignForm({...assignForm, servicioId: e.target.value})} className="w-full h-12 rounded-xl border-3 border-foreground bg-white px-4 font-bold"><option value="">Seleccionar</option>{services.map((s: any) => <option key={s.id} value={s.id}>{s.nombre} - {s.duracionBaseMinutos} min</option>)}</select></div>
            <div><Label>Fecha *</Label><Input type="date" value={assignForm.fecha} onChange={e => setAssignForm({...assignForm, fecha: e.target.value})} /></div>
            <div>
              <Label>Horario disponible *</Label>
              {loadingSlots ? <LoadingSpinner size="sm" /> : slots.length === 0 ? <p className="text-xs text-foreground/50">No hay horarios disponibles</p> : (
                <div className="grid grid-cols-4 gap-1.5 max-h-[150px] overflow-y-auto">
                  {slots.map(slot => (
                    <button key={slot} onClick={() => setAssignForm({...assignForm, hora: slot})}
                      className={`py-1.5 px-2 rounded-lg border-2 border-foreground text-xs font-bold transition-all ${assignForm.hora === slot ? "bg-primary shadow-cartoon-sm" : "bg-white hover:bg-primary/20"}`}>
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleAssign} disabled={assigning}>{assigning ? "Asignando..." : "Asignar Cita"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Selector de Fecha */}
      <Dialog open={datePickerOpen} onOpenChange={setDatePickerOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Elegir día del calendario</DialogTitle>
            <DialogDescription>Días con punto naranja tienen citas</DialogDescription>
          </DialogHeader>
          {renderDatePicker()}
          <DialogFooter><Button variant="outline" onClick={() => setDatePickerOpen(false)}>Cerrar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Vista Groomers (solo lectura)
function renderGroomersView() {
  
  // Esta función necesita acceso a las variables del componente padre.
  // Se pasa implícitamente por el scope del componente.
  return null; // Se renderiza dentro del componente principal
}