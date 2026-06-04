"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/auth-store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { InsumosAsignacion } from "@/components/inventory/insumos-asignacion";
import { EmptyState } from "@/components/shared/empty-state";
import { Package } from "lucide-react";
import { Calendar, Plus, ChevronLeft, ChevronRight, GripVertical, Dog, Clock, User, AlertTriangle, Check, X } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { toast } from "sonner";
import { format, addDays, startOfWeek, addWeeks, subWeeks, parseISO, isSameDay } from "date-fns";
import { es } from "date-fns/locale";

interface Appointment {
  id: number;
  fechaHoraInicio: string;
  fechaHoraFin: string;
  estado: string;
  estadoSolicitud: string;
  duracionEstimadaMinutos: number;
  mascota: { id: number; nombre: string; raza: string | null; imagen: string | null };
  cliente?: { nombre: string };
  groomer: { id: number; usuario: { nombre: string; apellido: string } } | null;
  servicio: { id: number; nombre: string; precioBase: number };
}

interface Groomer {
  id: number;
  nombre: string;
  apellido: string;
  groomer?: { id: number };
}

// ============================================
// COMPONENTE SELECTOR DE SLOTS (REUTILIZABLE)
// ============================================
interface SlotInfo {
  hora: string;
  disponible: boolean;
  razon?: string;
}

function SlotSelector({
  groomerId,
  fecha,
  servicioId,
  services,
  selectedHour,
  onSelectHour,
}: {
  groomerId: number;
  fecha: string;
  servicioId: string;
  services: any[];
  selectedHour: string;
  onSelectHour: (hora: string) => void;
}) {
  const [slots, setSlots] = useState<SlotInfo[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (!fecha || !servicioId || !groomerId) {
      setSlots([]);
      return;
    }

    const loadSlots = async () => {
      setLoadingSlots(true);
      try {
        const servicio = services.find(s => s.id.toString() === servicioId);
        const duracion = servicio?.duracionBaseMinutos || 30;

        const { data } = await api.get("/availability/slots", {
          params: { groomerId, fecha, duracion },
        });
        setSlots(Array.isArray(data.data) ? data.data : []);
      } catch {
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    loadSlots();
  }, [fecha, servicioId, groomerId, services]);

  if (loadingSlots) {
    return <LoadingSpinner size="sm" text="Cargando horarios..." />;
  }

  if (slots.length === 0) {
    return (
      <div className="bg-rose/10 border-2 border-rose rounded-xl p-3 text-center">
        <p className="text-sm font-bold text-rose">Sin horarios disponibles</p>
        <p className="text-xs">Intenta con otra fecha o groomer</p>
      </div>
    );
  }

  return (
    <>
      {/* Leyenda */}
      <div className="flex items-center gap-4 text-[10px] mb-1">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded border-2 border-foreground bg-primary inline-block" /> Disponible
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded border-2 border-foreground bg-rose/50 inline-block" /> Ocupado
        </span>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 max-h-[200px] overflow-y-auto">
        {slots.map((slot) => (
          <button
            key={slot.hora}
            type="button"
            disabled={!slot.disponible}
            onClick={() => onSelectHour(slot.hora)}
            className={`py-2 px-3 rounded-xl border-3 border-foreground text-sm font-bold transition-all ${
              selectedHour === slot.hora
                ? "bg-primary shadow-cartoon-sm"
                : !slot.disponible
                ? "bg-rose/20 opacity-50 cursor-not-allowed line-through"
                : "bg-white hover:bg-primary/20"
            }`}
            title={!slot.disponible ? slot.razon || "No disponible" : `Disponible a las ${slot.hora}`}
          >
            {slot.hora}
          </button>
        ))}
      </div>
      <p className="text-[10px] text-foreground/50">
        {slots.filter(s => s.disponible).length} de {slots.length} horarios disponibles
      </p>
    </>
  );
}

const GROOMER_COLORS = ["#A8D5BA", "#F4E4BA", "#E8A87C", "#C3B1E1", "#F4C2C2", "#7C8B9E"];

export default function AppointmentsPage() {
  const { user } = useAuthStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [groomers, setGroomers] = useState<Groomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [pendingRequests, setPendingRequests] = useState<Appointment[]>([]);
  const [showPending, setShowPending] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedGroomer, setSelectedGroomer] = useState<Groomer | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedHour, setSelectedHour] = useState("");
  const [pets, setPets] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [formData, setFormData] = useState({ mascotaId: "", servicioId: "" });
  const [creating, setCreating] = useState(false);
  const [slots, setSlots] = useState<SlotInfo[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [insumosDialogOpen, setInsumosDialogOpen] = useState(false);
  const [citaRecienCreada, setCitaRecienCreada] = useState<number | null>(null);
  const loadData = async () => {
    setLoading(true);
    try {
      const [appRes, groomRes, petsRes, servRes] = await Promise.all([
        api.get("/appointments", { params: { fecha: format(weekStart, "yyyy-MM-dd") } }),
        api.get("/users/groomers"),
        api.get("/pets/all"),
        api.get("/services?active=true"),
      ]);
      setAppointments(appRes.data.data || []);
      setGroomers(groomRes.data.data || []);
      setPets(petsRes.data.data || []);
      setServices(servRes.data.data || []);
      setPendingRequests(
        (appRes.data.data || []).filter(
          (a: Appointment) => a.estadoSolicitud === "Solicitada" || a.estadoSolicitud === "EnRevision"
        )
      );
    } catch (error: any) {
      toast.error("Error al cargar datos");
      console.error(error);
    } finally {
      setLoading(false);
    }
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
      loadData();
    }
  };

  const handleApprove = async (id: number) => {
    try { await api.put(`/appointments/${id}/approve`); toast.success("Aprobada"); loadData(); }
    catch { toast.error("Error"); }
  };

  const handleReject = async (id: number) => {
    try { await api.put(`/appointments/${id}/reject`); toast.success("Rechazada"); loadData(); }
    catch { toast.error("Error"); }
  };

  const openNewAppointment = (groomer: Groomer) => {
    setSelectedGroomer(groomer);
    setSelectedDate(format(new Date(), "yyyy-MM-dd"));
    setSelectedHour("");
    setFormData({ mascotaId: "", servicioId: "" });
    setDialogOpen(true);
  };

  const handleCreateAppointment = async () => {
    if (!selectedGroomer || !selectedDate || !selectedHour || !formData.mascotaId || !formData.servicioId) {
      toast.error("Completa todos los campos");
      return;
    }
    setCreating(true);
    try {
      const fechaHoraInicio = `${selectedDate}T${selectedHour}:00`;
      const servicio = services.find(s => s.id.toString() === formData.servicioId);
      const response = await api.post("/appointments", {
        mascotaId: parseInt(formData.mascotaId),
        servicioId: parseInt(formData.servicioId),
        groomerId: selectedGroomer.groomer?.id || selectedGroomer.id,
        fechaHoraInicio: new Date(fechaHoraInicio).toISOString(),
        duracionEstimadaMinutos: servicio?.duracionBaseMinutos || 30,
      });
      toast.success("Cita creada exitosamente");
          // PREGUNTAR SI QUIERE ASIGNAR INSUMOS
      setCitaRecienCreada(response.data.data.id);
      setInsumosDialogOpen(true);
      setDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al crear cita");
    } finally { setCreating(false); }
  };

  const getAppointmentsForGroomer = (groomerId: number) => {
    return appointments.filter(
      (a) =>
        a.groomer?.id === groomerId &&
        a.estado !== "Cancelada" &&
        a.estado !== "NoAsistio" &&
        a.estadoSolicitud !== "Solicitada"
    );
  };

  // Generar horas del día
  const hours = [];
  for (let h = 9; h <= 17; h++) {
    hours.push(`${h.toString().padStart(2, "0")}:00`);
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

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
              {format(weekStart, "d 'de' MMMM", { locale: es })} - {format(addDays(weekStart, 6), "d 'de' MMMM", { locale: es })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {pendingRequests.length > 0 && (
            <Button variant="secondary" onClick={() => setShowPending(!showPending)} className="relative">
              <AlertTriangle className="mr-2 h-4 w-4" /> Solicitudes
              <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-[10px]">
                {pendingRequests.length}
              </Badge>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setWeekStart(subWeeks(weekStart, 1))}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>Hoy</Button>
          <Button variant="outline" size="sm" onClick={() => setWeekStart(addWeeks(weekStart, 1))}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Bandeja de Solicitudes */}
      {showPending && pendingRequests.length > 0 && (
        <Card className="border-accent bg-accent/5 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-extrabold flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-accent" />Solicitudes Pendientes ({pendingRequests.length})</h2>
            <Button variant="ghost" size="sm" onClick={() => setShowPending(false)}><X className="h-4 w-4" /></Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingRequests.map((a) => (
              <div key={a.id} className="p-3 border-2 border-foreground rounded-xl bg-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2"><Dog className="h-4 w-4" /><span className="font-extrabold">{a.mascota.nombre}</span></div>
                  <Badge variant="secondary">En revisión</Badge>
                </div>
                <p className="text-xs">{a.servicio.nombre} • {a.duracionEstimadaMinutos} min</p>
                <p className="text-xs text-foreground/50">{format(parseISO(a.fechaHoraInicio), "dd/MM HH:mm")}</p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="default" onClick={() => handleApprove(a.id)} className="flex-1"><Check className="h-3 w-3 mr-1" />Aprobar</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleReject(a.id)} className="flex-1"><X className="h-3 w-3 mr-1" />Rechazar</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Grid de Groomers con Drag & Drop */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groomers.map((groomer, idx) => {
            const groomerApps = getAppointmentsForGroomer(groomer.groomer?.id || groomer.id);
            return (
              <Droppable key={groomer.id} droppableId={String(groomer.groomer?.id || groomer.id)}>
                {(provided, snapshot) => (
                  <Card ref={provided.innerRef} {...provided.droppableProps} className={`transition-colors ${snapshot.isDraggingOver ? "bg-primary/20 border-2 border-dashed border-primary" : ""}`}>
                    {/* Header del groomer */}
                    <div className="p-3 flex items-center justify-between rounded-t-xl" style={{ backgroundColor: GROOMER_COLORS[idx % GROOMER_COLORS.length] }}>
                      <div>
                        <p className="font-extrabold">{groomer.nombre} {groomer.apellido}</p>
                        <p className="text-xs">{groomerApps.length} cita(s)</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => openNewAppointment(groomer)}>
                        <Plus className="h-3 w-3 mr-1" /> Asignar
                      </Button>
                    </div>

                    {/* Lista de citas */}
                    <CardContent className="p-2 space-y-1 min-h-[80px] max-h-[400px] overflow-y-auto">
                      {groomerApps.length === 0 ? (
                        <p className="text-xs text-foreground/40 text-center py-6">Sin citas asignadas</p>
                      ) : (
                        groomerApps.map((a, index) => (
                          <Draggable key={a.id} draggableId={a.id.toString()} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`p-2 rounded-xl border-2 border-foreground text-xs bg-white cursor-grab transition-all ${snapshot.isDragging ? "shadow-cartoon rotate-2 scale-105 z-50" : "hover:shadow-cartoon-sm"}`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-extrabold">{a.mascota.nombre}</span>
                                  <span className="font-mono text-[10px]">{format(parseISO(a.fechaHoraInicio), "dd/MM HH:mm")}</span>
                                </div>
                                <p className="text-[10px]">{a.servicio.nombre} • {a.duracionEstimadaMinutos}min</p>
                                <div className="flex items-center gap-1 mt-1">
                                  <Badge className="text-[10px]" variant="outline">{a.estado}</Badge>
                                  <GripVertical className="h-3 w-3 text-foreground/30 ml-auto" />
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))
                      )}
                      {provided.placeholder}
                    </CardContent>
                  </Card>
                )}
              </Droppable>
            );
          })}
        </div>
      </DragDropContext>

      {/* Diálogo Asignar Cita */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" /> Asignar Cita a {selectedGroomer?.nombre}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Mascota */}
            <div>
              <Label>Mascota *</Label>
              <select
                value={formData.mascotaId}
                onChange={e => setFormData({...formData, mascotaId: e.target.value})}
                className="w-full h-12 rounded-xl border-3 border-foreground bg-white px-4 font-bold"
              >
                <option value="">Seleccionar</option>
                {pets.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.nombre} ({p.especie}) - {p.cliente?.usuario?.nombre}</option>
                ))}
              </select>
            </div>

            {/* Servicio */}
            <div>
              <Label>Servicio *</Label>
              <select
                value={formData.servicioId}
                onChange={e => setFormData({...formData, servicioId: e.target.value})}
                className="w-full h-12 rounded-xl border-3 border-foreground bg-white px-4 font-bold"
              >
                <option value="">Seleccionar</option>
                {services.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.nombre} - {s.duracionBaseMinutos} min</option>
                ))}
              </select>
            </div>

            {/* Fecha */}
            <div>
              <Label>Fecha *</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Slots disponibles */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Clock className="h-4 w-4" />Franja Horaria *</Label>

              {!selectedDate || !formData.servicioId ? (
                <p className="text-xs text-foreground/50">Selecciona fecha y servicio para ver horarios</p>
              ) : (
                <SlotSelector
                  groomerId={selectedGroomer?.groomer?.id || selectedGroomer?.id || 0}
                  fecha={selectedDate}
                  servicioId={formData.servicioId}
                  services={services}
                  selectedHour={selectedHour}
                  onSelectHour={setSelectedHour}
                />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateAppointment} disabled={creating}>
              {creating ? "Creando..." : "Asignar Cita"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo Asignar Insumos */}
      <Dialog open={insumosDialogOpen} onOpenChange={setInsumosDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" /> Asignar Insumos al Groomer
            </DialogTitle>
          </DialogHeader>
          {citaRecienCreada && (
            <InsumosAsignacion
              citaId={citaRecienCreada}
              servicioId={parseInt(formData.servicioId)}
              onSave={() => {
                setInsumosDialogOpen(false);
                toast.success("Insumos asignados correctamente");
              }}
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setInsumosDialogOpen(false)}>
              Omitir (asignar después)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}