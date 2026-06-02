"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { ArrowLeft, Calendar, Clock, Dog, User } from "lucide-react";
import { toast } from "sonner";

const schema = z.object({
  mascotaId: z.string().min(1, "Selecciona una mascota"),
  servicioId: z.string().min(1, "Selecciona un servicio"),
  groomerId: z.string().optional(),
  fecha: z.string().min(1, "Selecciona fecha"),
  hora: z.string().min(1, "Selecciona horario"),
});

type FormData = z.infer<typeof schema>;

// 👈 NUEVA INTERFAZ
interface SlotInfo {
  hora: string;
  disponible: boolean;
  razon?: string;
}

function NewAppointmentContent() {
  const [loading, setLoading] = useState(false);
  const [pets, setPets] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [groomers, setGroomers] = useState<any[]>([]);
  const [slots, setSlots] = useState<SlotInfo[]>([]);  // 👈 CORREGIDO
  const [loadingSlots, setLoadingSlots] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPetId = searchParams.get("petId");

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { mascotaId: preselectedPetId || "" },
  });

  const selectedService = watch("servicioId");
  const selectedGroomer = watch("groomerId");
  const selectedFecha = watch("fecha");

  useEffect(() => {
    Promise.all([
      api.get("/pets"),
      api.get("/services?active=true"),
      api.get("/users/groomers"),
    ]).then(([petsRes, servicesRes, groomersRes]) => {
      setPets(petsRes.data.data || []);
      setServices(servicesRes.data.data || []);
      setGroomers(groomersRes.data.data || []);
    }).catch(() => toast.error("Error al cargar datos"));
  }, []);

  useEffect(() => {
    if (!selectedFecha || !selectedService) {
      setSlots([]);
      return;
    }

    const loadSlots = async () => {
      setLoadingSlots(true);
      setSlots([]);
      try {
        const servicio = services.find(s => s.id.toString() === selectedService);
        const duracion = servicio?.duracionBaseMinutos || 30;

        let groomerId = selectedGroomer;
        if (!groomerId && groomers.length > 0) {
          groomerId = String(groomers[0]?.groomer?.id || groomers[0]?.id);
        }

        if (!groomerId) {
          setSlots([]);
          return;
        }

        const { data } = await api.get("/availability/slots", {
          params: { groomerId, fecha: selectedFecha, duracion },
        });

        // 👇 El backend devuelve { hora, disponible, razon }[]
        const slotsArray: SlotInfo[] = Array.isArray(data.data) ? data.data : [];
        setSlots(slotsArray);
      } catch (error: any) {
        console.error("Error cargando slots:", error);
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    loadSlots();
  }, [selectedFecha, selectedService, selectedGroomer, services, groomers]);

  const onSubmit = async (data: FormData) => {
    if (!data.hora) {
      toast.error("Selecciona un horario disponible");
      return;
    }

    setLoading(true);
    try {
      const fechaHoraInicio = `${data.fecha}T${data.hora}:00`;
      const servicio = services.find(s => s.id.toString() === data.servicioId);
      const groomerId = data.groomerId || (groomers[0]?.groomer?.id || groomers[0]?.id);

      await api.post("/appointments", {
        mascotaId: parseInt(data.mascotaId),
        servicioId: parseInt(data.servicioId),
        groomerId: groomerId ? parseInt(groomerId) : undefined,
        fechaHoraInicio: new Date(fechaHoraInicio).toISOString(),
        duracionEstimadaMinutos: servicio?.duracionBaseMinutos || 30,
      });

      toast.success("Cita solicitada exitosamente");
      toast.info("Tu cita está en revisión. Recibirás una confirmación pronto.");
      router.push("/my-appointments");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al solicitar cita");
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Volver
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-6 w-6" />Solicitar Cita
          </CardTitle>
          <CardDescription>
            Selecciona tu mascota, el servicio y la fecha. Tu cita quedará en revisión.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {/* Mascota */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1"><Dog className="h-4 w-4" />Mascota *</Label>
              <select {...register("mascotaId")} className="w-full h-12 rounded-xl border-3 border-foreground bg-white px-4 font-bold">
                <option value="">Seleccionar mascota</option>
                {pets.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.nombre} ({p.especie})</option>
                ))}
              </select>
              {errors.mascotaId && <p className="text-xs text-rose">{errors.mascotaId.message}</p>}
            </div>

            {/* Servicio */}
            <div className="space-y-1.5">
              <Label>Servicio *</Label>
              <select {...register("servicioId")} className="w-full h-12 rounded-xl border-3 border-foreground bg-white px-4 font-bold">
                <option value="">Seleccionar servicio</option>
                {services.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.nombre} - {s.duracionBaseMinutos} min</option>
                ))}
              </select>
              {errors.servicioId && <p className="text-xs text-rose">{errors.servicioId.message}</p>}
            </div>

            {/* Groomer */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1"><User className="h-4 w-4" />Groomer (opcional)</Label>
              <select {...register("groomerId")} className="w-full h-12 rounded-xl border-3 border-foreground bg-white px-4 font-bold">
                <option value="">Cualquiera disponible</option>
                {groomers.map((g: any) => (
                  <option key={g.id} value={g.groomer?.id || g.id}>{g.nombre} {g.apellido}</option>
                ))}
              </select>
            </div>

            {/* Fecha */}
            <div className="space-y-1.5">
              <Label>Fecha *</Label>
              <Input type="date" {...register("fecha")} min={today} className="font-bold" />
              {errors.fecha && <p className="text-xs text-rose">{errors.fecha.message}</p>}
            </div>

            {/* Franja Horaria */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Clock className="h-4 w-4" />Franja Horaria *</Label>

              {!selectedFecha || !selectedService ? (
                <p className="text-xs text-foreground/50">Selecciona fecha y servicio para ver horarios</p>
              ) : loadingSlots ? (
                <LoadingSpinner size="sm" text="Cargando horarios..." />
              ) : slots.length === 0 ? (
                <div className="bg-rose/10 border-2 border-rose rounded-xl p-3 text-center">
                  <p className="text-sm font-bold text-rose">Sin horarios disponibles</p>
                  <p className="text-xs">Intenta con otra fecha, servicio o groomer</p>
                </div>
              ) : (
                <>
                  {/* Leyenda */}
                  <div className="flex items-center gap-4 text-[10px] mb-1">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border-2 border-foreground bg-primary inline-block" /> Disponible</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border-2 border-foreground bg-rose/50 inline-block" /> Ocupado</span>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 max-h-[200px] overflow-y-auto">
                    {slots.map((slot) => (
                      <button
                        key={slot.hora}
                        type="button"
                        disabled={!slot.disponible}
                        onClick={() => setValue("hora", slot.hora)}
                        className={`py-2 px-3 rounded-xl border-3 border-foreground text-sm font-bold transition-all ${
                          watch("hora") === slot.hora
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
              )}
              {errors.hora && <p className="text-xs text-rose">{errors.hora.message}</p>}
            </div>

            {/* Aviso */}
            <div className="bg-secondary/50 rounded-xl border-2 border-foreground p-3 text-xs font-semibold">
              <p>Tu cita quedará en estado <Badge variant="secondary">En revisión</Badge> hasta que recepción la confirme.</p>
            </div>
          </CardContent>

          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              <Calendar className="mr-2 h-5 w-5" />
              {loading ? "Enviando solicitud..." : "Solicitar Cita"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function NewAppointmentPage() {
  return (
    <Suspense fallback={<LoadingSpinner text="Cargando..." />}>
      <NewAppointmentContent />
    </Suspense>
  );
}