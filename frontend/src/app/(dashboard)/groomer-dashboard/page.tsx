"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/auth-store";
import { getImageUrl } from "@/lib/images";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { Dog, Clock, Scissors, Calendar, ChevronLeft, ChevronRight, Play, CheckCircle, AlertCircle, Package } from "lucide-react";
import { toast } from "sonner";
import { format, addDays, addWeeks, subWeeks, startOfWeek, isSameDay, isToday, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface Cita {
  id: number;
  fechaHoraInicio: string;
  fechaHoraFin: string;
  estado: string;
  duracionEstimadaMinutos: number;
  mascota: { id: number; nombre: string; raza: string | null; imagen: string | null };
  servicio: { id: number; nombre: string; duracionBaseMinutos: number };
  fichaGrooming: { id: number; fechaCierre: string | null } | null;
}

const ESTADO_COLORS: Record<string, string> = {
  Agendada: "bg-secondary",
  Confirmada: "bg-lavender",
  EnProgreso: "bg-accent",
  Completada: "bg-primary",
};

export default function GroomerDashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [viewMode, setViewMode] = useState<"week" | "day">("week");

  const loadCitas = async () => {
    setLoading(true);
    try {
      const desde = format(weekStart, "yyyy-MM-dd");
      const hasta = format(addDays(weekStart, 7), "yyyy-MM-dd");
      
      const { data } = await api.get("/appointments/my-calendar", {
        params: { desde, hasta },
      });
      setCitas(data.data || []);
    } catch { toast.error("Error al cargar agenda"); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadCitas(); }, [weekStart]);

  const iniciarServicio = async (citaId: number) => {
    try {
      const { data } = await api.post(`/grooming/iniciar-servicio/${citaId}`);
      toast.success("¡Servicio iniciado!");
      if (data.data?.id) {
        router.push(`/grooming/${data.data.id}`);
      }
      loadCitas();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al iniciar servicio");
    }
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getCitasForDay = (day: Date) => {
    return citas.filter(cita => {
      const citaDate = parseISO(cita.fechaHoraInicio);
      return isSameDay(citaDate, day);
    }).sort((a, b) => new Date(a.fechaHoraInicio).getTime() - new Date(b.fechaHoraInicio).getTime());
  };

  const citasHoy = getCitasForDay(new Date());
  const totalSemana = citas.length;

  if (loading) return <LoadingSpinner text="Cargando agenda..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Calendar className="h-8 w-8" strokeWidth={3} />
          <div>
            <h1 className="text-3xl font-extrabold">Mi Agenda</h1>
            <p className="text-sm font-semibold text-foreground/70">
              {user?.nombre} • {totalSemana} cita{totalSemana !== 1 && "s"} esta semana
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setViewMode(viewMode === "week" ? "day" : "week")}>
            {viewMode === "week" ? "📅 Semana" : "📆 Día"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeekStart(subWeeks(weekStart, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
            Hoy
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeekStart(addWeeks(weekStart, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-extrabold">{citasHoy.length}</p>
            <p className="text-xs text-foreground/70">Hoy</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-extrabold">{totalSemana}</p>
            <p className="text-xs text-foreground/70">Esta semana</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-extrabold text-primary">
              {citas.filter(c => c.estado === 'Completada').length}
            </p>
            <p className="text-xs text-foreground/70">Completadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-extrabold text-accent">
              {citas.filter(c => c.estado === 'EnProgreso' || c.estado === 'Confirmada').length}
            </p>
            <p className="text-xs text-foreground/70">Pendientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-extrabold">
              {citas.reduce((sum, c) => sum + c.duracionEstimadaMinutos, 0) / 60}
            </p>
            <p className="text-xs text-foreground/70">Horas totales</p>
          </CardContent>
        </Card>
      </div>

      {/* Calendario Semanal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {format(weekStart, "'Semana del' d 'de' MMMM", { locale: es })} - {format(addDays(weekStart, 6), "d 'de' MMMM", { locale: es })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day, idx) => {
              const citasDelDia = getCitasForDay(day);
              const hoy = isToday(day);
              return (
                <div key={idx} className={`rounded-xl border-2 p-2 min-h-[120px] ${hoy ? "border-primary bg-primary/10" : "border-foreground/20"}`}>
                  {/* Cabecera del día */}
                  <div className={`text-center mb-2 pb-1 border-b-2 ${hoy ? "border-primary" : "border-foreground/10"}`}>
                    <p className="text-xs font-bold">{format(day, "EEE", { locale: es })}</p>
                    <p className={`text-lg font-extrabold ${hoy ? "text-primary" : ""}`}>
                      {format(day, "d")}
                    </p>
                  </div>

                  {/* Citas del día */}
                  <div className="space-y-1">
                    {citasDelDia.length === 0 ? (
                      <p className="text-[10px] text-foreground/30 text-center py-2">Libre</p>
                    ) : (
                      citasDelDia.slice(0, 4).map((cita) => (
                        <div
                          key={cita.id}
                          className={`p-1 rounded text-[9px] cursor-pointer hover:opacity-80 transition-opacity border border-foreground/20 ${ESTADO_COLORS[cita.estado] || "bg-gray-200"}`}
                          onClick={() => {
                            if (cita.fichaGrooming?.id) {
                              router.push(`/grooming/${cita.fichaGrooming.id}`);
                            }
                          }}
                          title={`${cita.mascota.nombre} - ${cita.servicio.nombre} (${format(parseISO(cita.fechaHoraInicio), "HH:mm")})`}
                        >
                          <div className="flex items-center gap-1">
                            {cita.mascota.imagen ? (
                              <img src={getImageUrl(cita.mascota.imagen) || ''} className="w-4 h-4 rounded-full object-cover" />
                            ) : (
                              <Dog className="w-3 h-3" />
                            )}
                            <span className="font-extrabold truncate">{cita.mascota.nombre}</span>
                          </div>
                          <p className="truncate text-[8px]">{format(parseISO(cita.fechaHoraInicio), "HH:mm")} - {cita.servicio.nombre}</p>
                          {cita.fichaGrooming?.id && !cita.fichaGrooming?.fechaCierre && (
                            <Badge className="text-[7px] px-1 py-0 mt-0.5 bg-accent">En progreso</Badge>
                          )}
                        </div>
                      ))
                    )}
                    {citasDelDia.length > 4 && (
                      <p className="text-[9px] text-center text-foreground/50 font-bold">
                        +{citasDelDia.length - 4} más
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Lista de citas de hoy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Hoy - {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {citasHoy.length === 0 ? (
            <EmptyState
              icon={<Dog className="h-12 w-12" />}
              title="Sin servicios para hoy"
              description="No tienes citas asignadas para el día de hoy"
            />
          ) : (
            <div className="space-y-3">
              {citasHoy.map((cita) => (
                <Card key={cita.id} className="hover:shadow-cartoon-hover transition-all">
                  <CardContent className="flex items-center justify-between py-3 flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      {cita.mascota.imagen ? (
                        <img src={getImageUrl(cita.mascota.imagen) || ''} className="w-12 h-12 rounded-xl border-3 border-foreground object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl border-3 border-foreground bg-primary flex items-center justify-center">
                          <Dog className="h-6 w-6" />
                        </div>
                      )}
                      <div>
                        <p className="font-extrabold text-lg">{cita.mascota.nombre}</p>
                        <p className="text-sm">{cita.servicio.nombre} • {cita.duracionEstimadaMinutos} min</p>
                        <div className="flex items-center gap-1 text-xs text-foreground/50">
                          <Clock className="h-3 w-3" />
                          {format(parseISO(cita.fechaHoraInicio), "HH:mm")}
                          {cita.mascota.raza && <span>• {cita.mascota.raza}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={ESTADO_COLORS[cita.estado] || "bg-gray-200"}>{cita.estado}</Badge>
                      {cita.fichaGrooming?.id && !cita.fichaGrooming?.fechaCierre ? (
                        <Button size="sm" onClick={() => router.push(`/grooming/${cita.fichaGrooming!.id}`)}>
                          <Scissors className="mr-2 h-4 w-4" /> Continuar
                        </Button>
                      ) : cita.fichaGrooming?.fechaCierre ? (
                        <Badge variant="default" className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> Completada
                        </Badge>
                      ) : (
                        <Button size="sm" variant="accent" onClick={() => iniciarServicio(cita.id)}>
                          <Play className="mr-2 h-4 w-4" /> Iniciar
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}