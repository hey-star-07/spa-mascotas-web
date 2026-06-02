"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { ClipboardList, Dog, Clock, ArrowRight, CheckCircle, Scissors } from "lucide-react";

interface FichaGrooming {
  id: number;
  citaId: number;
  fechaCierre: string | null;
  createdAt: string;
  cita: {
    fechaHoraInicio: string;
    mascota: { nombre: string; raza: string | null };
    servicio: { nombre: string };
  };
  checklist: Array<{ completado: boolean }>;
}

export default function GroomingListPage() {
  const router = useRouter();
  const [fichas, setFichas] = useState<FichaGrooming[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/grooming/my-fichas")
      .then(({ data }) => setFichas(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Cargando fichas..." />;

  const activas = fichas.filter(f => !f.fechaCierre);
  const cerradas = fichas.filter(f => f.fechaCierre);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ClipboardList className="h-8 w-8" strokeWidth={3} />
        <div>
          <h1 className="text-3xl font-extrabold">Fichas Técnicas</h1>
          <p className="text-sm font-semibold text-foreground/70">
            {activas.length} activa{activas.length !== 1 && "s"} • {cerradas.length} cerrada{cerradas.length !== 1 && "s"}
          </p>
        </div>
      </div>

      {/* Fichas Activas */}
      {activas.length > 0 && (
        <div>
          <h2 className="text-xl font-extrabold mb-3 flex items-center gap-2">
            <Badge variant="secondary">En Progreso</Badge>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activas.map((ficha) => {
              const completados = ficha.checklist?.filter(c => c.completado).length || 0;
              const total = ficha.checklist?.length || 0;
              return (
                <Card key={ficha.id} className="hover:shadow-cartoon-hover transition-all cursor-pointer" onClick={() => router.push(`/grooming/${ficha.id}`)}>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Dog className="h-8 w-8" />
                      <div>
                        <p className="font-extrabold text-lg">{ficha.cita.mascota.nombre}</p>
                        <p className="text-xs">{ficha.cita.servicio.nombre}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(ficha.cita.fechaHoraInicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <Badge variant="outline">{completados}/{total}</Badge>
                    </div>
                    <Button size="sm" variant="outline" className="w-full mt-3">
                      <Scissors className="mr-2 h-3 w-3" /> Continuar
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Fichas Cerradas */}
      {cerradas.length > 0 && (
        <div>
          <h2 className="text-xl font-extrabold mb-3 flex items-center gap-2">
            <Badge variant="default">Completadas</Badge>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-70">
            {cerradas.map((ficha) => (
              <Card key={ficha.id} className="hover:shadow-cartoon-hover transition-all cursor-pointer" onClick={() => router.push(`/grooming/${ficha.id}`)}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Dog className="h-8 w-8" />
                    <div>
                      <p className="font-extrabold text-lg">{ficha.cita.mascota.nombre}</p>
                      <p className="text-xs">{ficha.cita.servicio.nombre}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-foreground/50">
                    <CheckCircle className="h-3 w-3 text-primary" />
                    Cerrada: {ficha.fechaCierre ? new Date(ficha.fechaCierre).toLocaleDateString() : "N/A"}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {fichas.length === 0 && (
        <EmptyState
          icon={<ClipboardList className="h-16 w-16" />}
          title="Sin fichas técnicas"
          description="No tienes fichas de grooming asignadas."
          action={
            <Button onClick={() => router.push("/groomer-dashboard")}>Ir a Mi Agenda</Button>
          }
        />
      )}
    </div>
  );
}