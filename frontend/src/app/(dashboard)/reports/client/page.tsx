"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { getImageUrl } from "@/lib/images";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { Dog, Camera, Calendar, Scissors, MessageSquare, ClipboardList } from "lucide-react";

export default function ClientReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/reports/cliente")
      .then(({ data }) => setData(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Cargando historial..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Dog className="h-8 w-8" strokeWidth={3} />
        <h1 className="text-3xl font-extrabold">Historial de Mis Mascotas</h1>
      </div>

      {!data?.mascotas || data.mascotas.length === 0 ? (
        <EmptyState icon={<Dog className="h-12 w-12" />} title="Sin mascotas" description="Registra tu primera mascota" />
      ) : (
        data.mascotas.map((m: any) => (
          <Card key={m.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dog className="h-6 w-6" />
                {m.nombre}
                <Badge variant="outline">{m.totalServicios} servicios</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Últimas citas con recomendaciones */}
              <div>
                <p className="text-sm font-bold mb-2 flex items-center gap-1">
                  <Calendar className="h-4 w-4" /> Últimos servicios:
                </p>
                <div className="space-y-2">
                  {m.ultimasCitas?.map((c: any, i: number) => (
                    <div key={i} className="border-2 border-foreground rounded-xl p-3">
                      <div className="flex justify-between text-sm mb-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          {new Date(c.fecha).toLocaleDateString()}
                        </div>
                        <span className="font-bold">{c.servicio}</span>
                        <Badge variant="outline" className="text-[10px]">{c.estado}</Badge>
                      </div>
                      
                      {/* Estado de ingreso */}
                      {c.estadoIngreso && (
                        <div className="mt-2 bg-secondary/30 rounded-lg p-2 text-xs">
                          <p className="font-bold flex items-center gap-1">
                            <ClipboardList className="h-3 w-3" /> Estado al ingreso:
                          </p>
                          <p className="text-foreground/70 mt-0.5">{c.estadoIngreso}</p>
                        </div>
                      )}

                      {/* Recomendaciones del groomer */}
                      {c.recomendaciones && (
                        <div className="mt-2 bg-lavender/10 border-2 border-lavender rounded-xl p-2">
                          <p className="text-xs font-bold text-lavender flex items-center gap-1 mb-1">
                            <MessageSquare className="h-3 w-3" /> Recomendaciones del groomer:
                          </p>
                          <p className="text-xs text-foreground/70">{c.recomendaciones}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Galería de fotos */}
              {m.fotos?.length > 0 && (
                <div>
                  <p className="text-sm font-bold mb-2 flex items-center gap-1">
                    <Camera className="h-4 w-4" /> Galería de evolución:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {m.fotos.slice(0, 8).map((f: any, i: number) => (
                      <div key={i} className="relative">
                        <Badge className="absolute top-1 left-1 z-10 text-[9px]">
                          {f.tipo === 'antes' ? 'Antes' : 'Después'}
                        </Badge>
                        <img
                          src={getImageUrl(f.url) || ''}
                          className="w-20 h-20 object-cover rounded-xl border-2 border-foreground"
                          alt={f.tipo}
                        />
                        <p className="text-[8px] text-center mt-0.5">
                          {new Date(f.fecha).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}