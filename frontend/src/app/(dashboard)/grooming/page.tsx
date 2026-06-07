"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { ClipboardList, Dog, Clock, ArrowRight, CheckCircle, Scissors, Filter, Eye } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface FichaGrooming {
  id: number;
  citaId: number;
  fechaCierre: string | null;
  createdAt: string;
  estadoIngreso: string | null;
  recomendaciones: string | null;
  cita: {
    fechaHoraInicio: string;
    estado: string;
    mascota: { nombre: string; raza: string | null; imagen: string | null };
    servicio: { nombre: string };
  };
  checklist: Array<{ completado: boolean; plantillaChecklist: { item: string } }>;
  fotos: Array<{ id: number; tipo: string }>;
}

type TabFiltro = "todas" | "en-progreso" | "completadas";

export default function GroomingListPage() {
  const router = useRouter();
  const [fichas, setFichas] = useState<FichaGrooming[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabFiltro>("todas");

  useEffect(() => {
    loadFichas();
  }, []);
  
  useEffect(() => {
    api.get("/grooming/my-fichas")
      .then(({ data }) => setFichas(data.data || []))
      .catch(() => toast.error("Error al cargar fichas"))
      .finally(() => setLoading(false));
  }, []);

  const loadFichas = async () => {
    try {
      const { data } = await api.get("/grooming/my-fichas");
      setFichas(data.data || []);
    } catch { toast.error("Error al cargar fichas"); }
    finally { setLoading(false); }
  };

  // Filtrar fichas
  const filteredFichas = fichas.filter(f => {
    switch (activeTab) {
      case "en-progreso": return !f.fechaCierre;
      case "completadas": return !!f.fechaCierre;
      default: return true;
    }
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const activas = fichas.filter(f => !f.fechaCierre).length;
  const cerradas = fichas.filter(f => f.fechaCierre).length;

  if (loading) return <LoadingSpinner text="Cargando fichas..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ClipboardList className="h-8 w-8" strokeWidth={3} />
        <div>
          <h1 className="text-3xl font-extrabold">Fichas Técnicas</h1>
          <p className="text-sm font-semibold text-foreground/70">
            {activas} en progreso • {cerradas} completadas
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { key: "todas" as TabFiltro, label: "Todas", count: fichas.length, color: "bg-gray-200" },
          { key: "en-progreso" as TabFiltro, label: "En Progreso", count: activas, color: "bg-accent" },
          { key: "completadas" as TabFiltro, label: "Completadas", count: cerradas, color: "bg-primary" },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border-3 border-foreground text-sm font-bold transition-all ${
              activeTab === tab.key ? `${tab.color} shadow-cartoon-sm` : "bg-white hover:bg-primary/20"
            }`}
          >
            <Filter className="h-4 w-4" />
            {tab.label}
            <Badge variant="outline" className="text-[10px]">{tab.count}</Badge>
          </button>
        ))}
      </div>

      {/* Lista de fichas */}
      {filteredFichas.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-16 w-16" />}
          title={`Sin fichas ${activeTab !== "todas" ? activeTab === "en-progreso" ? "en progreso" : "completadas" : ""}`}
          description={activeTab === "todas" ? "No tienes fichas de grooming asignadas." : ""}
          action={
            <Button onClick={() => router.push("/groomer-dashboard")}>Ir a Mi Agenda</Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredFichas.map((ficha) => {
            const completados = ficha.checklist?.filter(c => c.completado).length || 0;
            const total = ficha.checklist?.length || 0;
            const isCompleted = !!ficha.fechaCierre;

            return (
              <Card
                key={ficha.id}
                className={`hover:shadow-cartoon-hover transition-all cursor-pointer ${isCompleted ? 'opacity-75' : ''}`}
                onClick={() => router.push(`/grooming/${ficha.id}`)}
              >
                <CardContent className="flex items-center justify-between py-4 flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-xl border-3 border-foreground p-3 ${isCompleted ? 'bg-primary/30' : 'bg-accent/30'}`}>
                      <Dog className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-extrabold text-lg">{ficha.cita.mascota.nombre}</p>
                        {ficha.cita.mascota.raza && (
                          <span className="text-xs text-foreground/50">({ficha.cita.mascota.raza})</span>
                        )}
                      </div>
                      <p className="text-sm">{ficha.cita.servicio.nombre}</p>
                      <div className="flex items-center gap-3 text-xs text-foreground/50 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(parseISO(ficha.cita.fechaHoraInicio), "dd/MM HH:mm")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Scissors className="h-3 w-3" />
                          Checklist: {completados}/{total}
                        </span>
                        {ficha.fotos.length > 0 && (
                          <span>{ficha.fotos.length} foto{ficha.fotos.length !== 1 && 's'}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant={isCompleted ? "default" : "secondary"}>
                      {isCompleted ? (
                        <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Completada</span>
                      ) : (
                        <span>En Progreso</span>
                      )}
                    </Badge>
                    {isCompleted && ficha.fechaCierre && (
                      <span className="text-xs text-foreground/50">
                        {format(parseISO(ficha.fechaCierre), "dd/MM/yy")}
                      </span>
                    )}
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}