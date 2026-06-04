"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { Calendar, Plus, Dog, Clock, XCircle, AlertTriangle, CheckCircle, Filter } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface Appointment {
  id: number;
  fechaHoraInicio: string;
  estado: string;
  estadoSolicitud: string;
  mascota: { id: number; nombre: string; imagen: string | null };
  servicio: { nombre: string; precioBase: number };
  groomer: { usuario: { nombre: string; apellido: string } } | null;
}

type TabFiltro = "todas" | "pendientes" | "confirmadas" | "completadas" | "canceladas";

export default function MyAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabFiltro>("todas");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState("");
  const [aceptaPolitica, setAceptaPolitica] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const loadAppointments = () => {
    setLoading(true);
    api.get("/appointments/my")
      .then(({ data }) => setAppointments(data.data || []))
      .catch(() => toast.error("Error al cargar citas"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAppointments(); }, []);

  // Filtrar y ordenar
  const filteredAppointments = appointments
    .filter(a => {
      switch (activeTab) {
        case "pendientes":
          return a.estadoSolicitud === "Solicitada" || a.estadoSolicitud === "EnRevision";
        case "confirmadas":
          return a.estado === "Confirmada" || a.estado === "Agendada" || a.estado === "EnProgreso";
        case "completadas":
          return a.estado === "Completada";
        case "canceladas":
          return a.estado === "Cancelada" || a.estadoSolicitud === "Rechazada" || a.estado === "NoAsistio";
        default:
          return true;
      }
    })
    .sort((a, b) => new Date(b.fechaHoraInicio).getTime() - new Date(a.fechaHoraInicio).getTime());

  const handleCancelClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setMotivoCancelacion("");
    setAceptaPolitica(false);
    setCancelOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!selectedAppointment) return;
    if (!aceptaPolitica) {
      toast.error("Debes aceptar la política de cancelación");
      return;
    }
    setCancelling(true);
    try {
      await api.put(`/appointments/${selectedAppointment.id}/cancel`, {
        motivo: motivoCancelacion || "Cancelado por el cliente",
      });
      toast.success("Cita cancelada exitosamente");
      setCancelOpen(false);
      loadAppointments();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al cancelar");
    } finally {
      setCancelling(false);
    }
  };

  // Contadores para tabs
  const counts = {
    todas: appointments.length,
    pendientes: appointments.filter(a => a.estadoSolicitud === "Solicitada" || a.estadoSolicitud === "EnRevision").length,
    confirmadas: appointments.filter(a => a.estado === "Confirmada" || a.estado === "Agendada" || a.estado === "EnProgreso").length,
    completadas: appointments.filter(a => a.estado === "Completada").length,
    canceladas: appointments.filter(a => a.estado === "Cancelada" || a.estadoSolicitud === "Rechazada" || a.estado === "NoAsistio").length,
  };

  const tabs: Array<{ key: TabFiltro; label: string; icon: any; color: string }> = [
    { key: "todas", label: "Todas", icon: Calendar, color: "bg-gray-200" },
    { key: "pendientes", label: "En Revisión", icon: AlertTriangle, color: "bg-accent" },
    { key: "confirmadas", label: "Confirmadas", icon: CheckCircle, color: "bg-lavender" },
    { key: "completadas", label: "Completadas", icon: CheckCircle, color: "bg-primary" },
    { key: "canceladas", label: "Canceladas", icon: XCircle, color: "bg-rose" },
  ];

  if (loading) return <LoadingSpinner text="Cargando tus citas..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-8 w-8" strokeWidth={3} />
          <h1 className="text-3xl font-extrabold">Mis Citas</h1>
        </div>
        <Link href="/my-appointments/new">
          <Button><Plus className="mr-2 h-4 w-4" /> Solicitar Cita</Button>
        </Link>
      </div>

      {/* Tabs de filtro */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border-3 border-foreground text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? `${tab.color} shadow-cartoon-sm translate-x-[1px] translate-y-[1px]`
                  : "bg-white hover:bg-primary/20"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              <Badge variant="outline" className="text-[10px] ml-1">{counts[tab.key]}</Badge>
            </button>
          );
        })}
      </div>

      {/* Lista de citas */}
      {filteredAppointments.length === 0 ? (
        <EmptyState
          icon={<Calendar className="h-12 w-12" />}
          title={`Sin citas ${activeTab !== "todas" ? tabs.find(t => t.key === activeTab)?.label.toLowerCase() : ""}`}
          description={activeTab === "todas" ? "Solicita tu primera cita de grooming" : "No hay citas en esta categoría"}
          action={activeTab === "todas" ? (
            <Link href="/my-appointments/new"><Button><Plus className="mr-2 h-4 w-4" />Solicitar Cita</Button></Link>
          ) : undefined}
        />
      ) : (
        <div className="space-y-3">
          {filteredAppointments.map((a) => {
            const isPending = a.estadoSolicitud === "Solicitada" || a.estadoSolicitud === "EnRevision";
            const isCancelled = a.estado === "Cancelada" || a.estadoSolicitud === "Rechazada";
            const isCompleted = a.estado === "Completada";
            const canCancel = a.estado === "Agendada" || a.estado === "Confirmada" || isPending;

            return (
              <Card key={a.id} className={`hover:shadow-cartoon-hover transition-all ${isCancelled ? 'opacity-60' : ''}`}>
                <CardContent className="flex items-center justify-between py-4 flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    {/* Fecha */}
                    <div className="text-center min-w-[70px]">
                      <p className="text-lg font-extrabold">
                        {format(parseISO(a.fechaHoraInicio), "dd", { locale: es })}
                      </p>
                      <p className="text-xs font-semibold">
                        {format(parseISO(a.fechaHoraInicio), "MMM", { locale: es })}
                      </p>
                      <p className="text-[10px] text-foreground/50">
                        {format(parseISO(a.fechaHoraInicio), "HH:mm")}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <Dog className="h-4 w-4" />
                        <span className="font-extrabold">{a.mascota.nombre}</span>
                      </div>
                      <p className="text-sm">{a.servicio.nombre} - Bs. {Number(a.servicio.precioBase).toFixed(2)}</p>
                      {a.groomer && (
                        <p className="text-xs text-foreground/70">Groomer: {a.groomer.usuario.nombre}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Estado */}
                    {isPending ? (
                      <Badge className="bg-accent">En Revisión</Badge>
                    ) : isCancelled ? (
                      <Badge variant="destructive">Cancelada</Badge>
                    ) : isCompleted ? (
                      <Badge variant="default">Completada</Badge>
                    ) : (
                      <Badge variant="secondary">{a.estado}</Badge>
                    )}

                    {/* Botón cancelar */}
                    {canCancel && (
                      <Button size="sm" variant="destructive" onClick={() => handleCancelClick(a)}>
                        <XCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Diálogo de Cancelación */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-rose" /> Cancelar Cita
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedAppointment && (
              <div className="bg-secondary/50 rounded-xl border-2 border-foreground p-3 text-sm">
                <p className="font-extrabold">{selectedAppointment.mascota.nombre} - {selectedAppointment.servicio.nombre}</p>
                <p className="text-xs">
                  {format(parseISO(selectedAppointment.fechaHoraInicio), "dd 'de' MMMM 'a las' HH:mm", { locale: es })}
                </p>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Motivo de cancelación</Label>
              <select value={motivoCancelacion} onChange={e => setMotivoCancelacion(e.target.value)} className="w-full h-12 rounded-xl border-3 border-foreground bg-white px-4 font-bold">
                <option value="">Seleccionar motivo</option>
                <option value="Salud">Problema de salud de la mascota</option>
                <option value="Tiempo">No tengo tiempo disponible</option>
                <option value="Emergencia">Emergencia familiar</option>
                <option value="Otro">Otro motivo</option>
              </select>
            </div>
            <div className="bg-rose/10 border-2 border-rose rounded-xl p-3">
              <p className="text-sm font-extrabold text-rose mb-1">Política de Cancelación</p>
              <ul className="text-xs space-y-1">
                <li>• Cancelar con al menos 24 horas de anticipación.</li>
                <li>• Cancelaciones tardías pueden generar un cargo.</li>
                <li>• Al cancelar, el slot se libera para otros clientes.</li>
              </ul>
            </div>
            <label className="flex items-start gap-3 cursor-pointer p-3 border-2 border-foreground rounded-xl">
              <input type="checkbox" checked={aceptaPolitica} onChange={e => setAceptaPolitica(e.target.checked)} className="mt-1 h-5 w-5 rounded accent-primary" />
              <span className="text-sm font-semibold">Acepto la política de cancelación.</span>
            </label>
          </div>
          <DialogFooter className="flex gap-3">
            <Button variant="outline" onClick={() => setCancelOpen(false)} disabled={cancelling}>Mantener Cita</Button>
            <Button variant="destructive" onClick={handleCancelConfirm} disabled={cancelling || !aceptaPolitica}>
              {cancelling ? "Cancelando..." : "Confirmar Cancelación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}