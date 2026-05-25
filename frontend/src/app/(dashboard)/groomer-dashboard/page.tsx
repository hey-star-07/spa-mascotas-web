"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/auth-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { Dog, Clock, Scissors, CheckCircle, AlertCircle, Play } from "lucide-react";
import { toast } from "sonner";

interface CitaHoy {
  id: number;
  fechaHoraInicio: string;
  estado: string;
  mascota: { id: number; nombre: string; raza: string | null; tamanio: string | null; alergiasConocidas: string | null };
  servicio: { id: number; nombre: string };
  fichaGrooming: { id: number } | null;
}

export default function GroomerDashboardPage() {
  const { user } = useAuthStore();
  const [citas, setCitas] = useState<CitaHoy[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCitas = async () => {
    try {
      // Obtener las citas del groomer para hoy
      const { data } = await api.get("/appointments/my-day");
      setCitas(data.data || []);
    } catch { toast.error("Error al cargar agenda"); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadCitas(); }, []);

  const iniciarServicio = async (citaId: number) => {
    try {
      const { data } = await api.post(`/grooming/iniciar-servicio/${citaId}`);
      toast.success("¡Servicio iniciado! Ficha técnica creada.");
      // Redirigir a la ficha
      window.location.href = `/grooming/${data.data.id}`;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al iniciar servicio");
    }
  };

  if (loading) return <LoadingSpinner text="Cargando tu agenda..." />;

  // Filtrar citas confirmadas/en progreso
  const citasActivas = citas.filter(c => c.estado === 'Confirmada' || c.estado === 'EnProgreso' || c.estado === 'Agendada');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Scissors className="h-8 w-8" strokeWidth={3} />
        <div>
          <h1 className="text-3xl font-extrabold">Mi Agenda de Hoy</h1>
          <p className="text-sm font-semibold text-foreground/70">
            Bienvenido/a, {user?.nombre} • {citasActivas.length} servicio{citasActivas.length !== 1 && "s"} hoy
          </p>
        </div>
      </div>

      {citasActivas.length === 0 ? (
        <EmptyState
          icon={<Dog className="h-12 w-12" />}
          title="Sin servicios para hoy"
          description="No tienes citas asignadas para el día de hoy"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {citasActivas.map((cita) => (
            <Card key={cita.id} className="hover:shadow-cartoon-hover transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Dog className="h-5 w-5" /> {cita.mascota.nombre}
                </CardTitle>
                <Badge variant={cita.estado === 'EnProgreso' ? 'secondary' : 'default'}>
                  {cita.estado}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  <span className="font-bold">{new Date(cita.fechaHoraInicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-sm font-semibold">{cita.servicio.nombre}</p>
                <p className="text-xs">Raza: {cita.mascota.raza || 'N/A'} | Tamaño: {cita.mascota.tamanio || 'N/A'}</p>
                
                {cita.mascota.alergiasConocidas && (
                  <div className="bg-rose/10 border-2 border-rose rounded-xl p-2 text-xs flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 text-rose" />
                    {cita.mascota.alergiasConocidas}
                  </div>
                )}

                {cita.fichaGrooming ? (
                  <Link href={`/grooming/${cita.fichaGrooming.id}`}>
                    <Button size="sm" className="w-full mt-2">
                      <Scissors className="mr-2 h-4 w-4" /> Continuar Ficha Técnica
                    </Button>
                  </Link>
                ) : (
                  <Button size="sm" className="w-full mt-2" variant="accent" onClick={() => iniciarServicio(cita.id)}>
                    <Play className="mr-2 h-4 w-4" /> Iniciar Servicio
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}