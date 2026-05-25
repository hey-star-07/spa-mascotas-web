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
import { Calendar, Plus, Dog, Clock, XCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Appointment {
  id: number;
  fechaHoraInicio: string;
  estado: string;
  estadoSolicitud: string;
  mascota: { id: number; nombre: string };
  servicio: { nombre: string; precioBase: number };
  groomer: { usuario: { nombre: string; apellido: string } } | null;
}

export default function MyAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
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

  const estadoColor: Record<string, string> = {
    Agendada: "bg-primary",
    Confirmada: "bg-lavender",
    EnProgreso: "bg-accent",
    Completada: "bg-primary",
    Cancelada: "bg-rose",
    NoAsistio: "bg-rose",
  };

  const solicitudColor: Record<string, string> = {
    Solicitada: "bg-secondary",
    EnRevision: "bg-accent",
    Aprobada: "bg-primary",
    Rechazada: "bg-rose",
  };

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

      {appointments.length === 0 ? (
        <EmptyState
          icon={<Calendar className="h-12 w-12" />}
          title="Sin citas"
          description="Solicita tu primera cita de grooming"
          action={
            <Link href="/my-appointments/new">
              <Button><Plus className="mr-2 h-4 w-4" /> Solicitar Cita</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {appointments.map((a) => (
            <Card key={a.id} className={`hover:shadow-cartoon-hover transition-all ${a.estado === 'Cancelada' ? 'opacity-60' : ''}`}>
              <CardContent className="flex items-center justify-between py-4 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="text-center min-w-[70px]">
                    <p className="text-lg font-extrabold">
                      {new Date(a.fechaHoraInicio).toLocaleDateString('es-BO', { day: '2-digit', month: 'short' })}
                    </p>
                    <p className="text-xs font-semibold">
                      {new Date(a.fechaHoraInicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                  {/* Estado de solicitud o estado */}
                  {a.estadoSolicitud && a.estadoSolicitud !== 'Aprobada' ? (
                    <Badge className={solicitudColor[a.estadoSolicitud] || "bg-gray-300"}>
                      {a.estadoSolicitud === 'Solicitada' ? 'En revisión' :
                       a.estadoSolicitud === 'EnRevision' ? 'En revisión' : a.estadoSolicitud}
                    </Badge>
                  ) : (
                    <Badge className={estadoColor[a.estado] || "bg-gray-300"}>{a.estado}</Badge>
                  )}

                  {/* Botón cancelar (solo si está pendiente/confirmada) */}
                  {(a.estado === 'Agendada' || a.estado === 'Confirmada' || a.estadoSolicitud === 'Solicitada') && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleCancelClick(a)}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* DIÁLOGO DE CANCELACIÓN */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-rose" />
              Cancelar Cita
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Info de la cita */}
            {selectedAppointment && (
              <div className="bg-secondary/50 rounded-xl border-2 border-foreground p-3 text-sm">
                <p className="font-extrabold">
                  {selectedAppointment.mascota.nombre} - {selectedAppointment.servicio.nombre}
                </p>
                <p className="text-xs">
                  {new Date(selectedAppointment.fechaHoraInicio).toLocaleDateString()} a las{" "}
                  {new Date(selectedAppointment.fechaHoraInicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            )}

            {/* Motivo de cancelación */}
            <div className="space-y-1.5">
              <Label>Motivo de cancelación</Label>
              <select
                value={motivoCancelacion}
                onChange={(e) => setMotivoCancelacion(e.target.value)}
                className="w-full h-12 rounded-xl border-3 border-foreground bg-white px-4 font-bold"
              >
                <option value="">Seleccionar motivo</option>
                <option value="Salud">Problema de salud de la mascota</option>
                <option value="Tiempo">No tengo tiempo disponible</option>
                <option value="Emergencia">Emergencia familiar</option>
                <option value="Otro">Otro motivo</option>
              </select>
            </div>

            {/* Política de cancelación */}
            <div className="bg-rose/10 border-2 border-rose rounded-xl p-3">
              <p className="text-sm font-extrabold text-rose mb-1">Política de Cancelación</p>
              <ul className="text-xs space-y-1 text-foreground/70">
                <li>• Las cancelaciones deben hacerse con al menos <strong>24 horas</strong> de anticipación.</li>
                <li>• Cancelaciones tardías pueden generar un cargo.</li>
                <li>• Al cancelar, el slot se libera para otros clientes.</li>
              </ul>
            </div>

            {/* Checkbox de aceptación */}
            <label className="flex items-start gap-3 cursor-pointer p-3 border-2 border-foreground rounded-xl hover:bg-primary/10 transition-colors">
              <input
                type="checkbox"
                checked={aceptaPolitica}
                onChange={(e) => setAceptaPolitica(e.target.checked)}
                className="mt-1 h-5 w-5 rounded border-2 border-foreground accent-primary"
              />
              <span className="text-sm font-semibold">
                Acepto la política de cancelación y entiendo que mi cita será cancelada definitivamente.
              </span>
            </label>
          </div>

          <DialogFooter className="flex gap-3">
            <Button variant="outline" onClick={() => setCancelOpen(false)} disabled={cancelling}>
              Mantener Cita
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelConfirm}
              disabled={cancelling || !aceptaPolitica}
            >
              {cancelling ? "Cancelando..." : "Confirmar Cancelación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}