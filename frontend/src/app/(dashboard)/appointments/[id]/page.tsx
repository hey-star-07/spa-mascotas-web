"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { ArrowLeft, Dog, User, Clock, Calendar } from "lucide-react";

export default function AppointmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/appointments/${params.id}`)
      .then(({ data }) => setAppointment(data.data))
      .catch(() => router.push("/appointments"))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <LoadingSpinner text="Cargando cita..." />;
  if (!appointment) return <p>Cita no encontrada</p>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" /> Volver</Button>
      <Card>
        <CardHeader>
          <CardTitle>Detalle de Cita</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Dog className="h-8 w-8" />
            <div>
              <p className="text-xl font-extrabold">{appointment.mascota?.nombre}</p>
              <p className="text-sm">{appointment.mascota?.raza} - {appointment.servicio?.nombre}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2"><Calendar className="h-4 w-4" /> {new Date(appointment.fechaHoraInicio).toLocaleDateString()}</div>
            <div className="flex items-center gap-2"><Clock className="h-4 w-4" /> {new Date(appointment.fechaHoraInicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            <div className="flex items-center gap-2"><User className="h-4 w-4" /> {appointment.groomer?.usuario?.nombre || "Por asignar"}</div>
            <Badge>{appointment.estado}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}