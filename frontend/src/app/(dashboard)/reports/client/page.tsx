"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { getImageUrl } from "@/lib/images";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Dog, Camera, Calendar, Scissors, MessageSquare, ClipboardList,
  Star, Gift, TrendingUp, ChevronDown, ChevronUp, Award, Heart,
  Image as ImageIcon, RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

// ============================================
// TIPOS
// ============================================
interface MascotaHistorial {
  id: number;
  nombre: string;
  totalServicios: number;
  ultimoServicio: string | null;
  fotos: Array<{ tipo: string; url: string; fecha: string }>;
  ultimasCitas: Array<{
    fecha: string;
    servicio: string;
    estado: string;
    recomendaciones: string | null;
    estadoIngreso: string | null;
  }>;
}

interface PuntosFidelidad {
  puntosFidelidad: number;
  totalServicios: number;
  totalCompras: number;
  puntosParaProximo: number;
  serviciosGratisDisponibles: number;
  progreso: number;
  proximoBeneficio: string;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function ClientReportsPage() {
  const [mascotas, setMascotas] = useState<MascotaHistorial[]>([]);
  const [puntos, setPuntos] = useState<PuntosFidelidad | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFoto, setSelectedFoto] = useState<{ url: string; tipo: string } | null>(null);
  const [expandedMascota, setExpandedMascota] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      api.get("/reports/cliente"),
      api.get("/reports/cliente/puntos"),
    ]).then(([histRes, puntosRes]) => {
      setMascotas(histRes.data.data?.mascotas || []);
      setPuntos(puntosRes.data.data);
    }).catch(() => toast.error("Error al cargar historial"))
    .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Cargando historial..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Dog className="h-8 w-8" strokeWidth={3} />
          <div>
            <h1 className="text-3xl font-extrabold">Historial de Mis Mascotas</h1>
            <p className="text-sm text-foreground/70">
              {mascotas.length} mascota{mascotas.length !== 1 ? 's' : ''} registrada{mascotas.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          <RefreshCw className="mr-2 h-4 w-4" /> Actualizar
        </Button>
      </div>

      {/* ============================================ */}
      {/* PUNTOS DE FIDELIDAD                            */}
      {/* ============================================ */}
      {puntos && (
        <Card className="border-2 border-amber-400 bg-gradient-to-r from-amber-50 to-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="h-6 w-6 text-amber-500" />
              Programa de Fidelidad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Puntos actuales */}
              <div className="bg-white rounded-xl border-2 border-amber-400 p-4 text-center">
                <p className="text-4xl font-extrabold text-amber-600">{puntos.puntosFidelidad}</p>
                <p className="text-sm font-bold">Puntos acumulados</p>
                <p className="text-[10px] text-foreground/50 mt-1">1 servicio = 10 pts | 1 compra Bs. 10 = 1 pt</p>
              </div>

              {/* Beneficios disponibles */}
              <div className="bg-white rounded-xl border-2 border-amber-400 p-4 text-center">
                <Gift className="h-8 w-8 text-amber-500 mx-auto mb-1" />
                <p className="text-2xl font-extrabold text-amber-600">{puntos.serviciosGratisDisponibles}</p>
                <p className="text-sm font-bold">Servicios gratis disponibles</p>
                <p className="text-[10px] text-foreground/50 mt-1">Cada 100 puntos = 1 servicio gratis</p>
              </div>

              {/* Progreso al próximo */}
              <div className="bg-white rounded-xl border-2 border-amber-400 p-4">
                <p className="text-sm font-bold mb-2">Progreso al próximo beneficio:</p>
                <div className="h-8 bg-gray-100 rounded-full border-2 border-amber-400 overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ width: `${puntos.progreso}%` }}
                  >
                    {puntos.progreso > 15 && `${puntos.progreso}%`}
                  </div>
                </div>
                <p className="text-xs text-center mt-2 font-bold text-amber-600">
                  {puntos.proximoBeneficio}
                </p>
              </div>
            </div>

            {/* Estadísticas adicionales */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-white/50 rounded-xl p-3 text-center">
                <p className="text-lg font-extrabold">{puntos.totalServicios}</p>
                <p className="text-[10px]">Servicios realizados</p>
              </div>
              <div className="bg-white/50 rounded-xl p-3 text-center">
                <p className="text-lg font-extrabold">Bs. {Number(puntos.totalCompras || 0).toFixed(0)}</p>
                <p className="text-[10px]">Total en compras</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ============================================ */}
      {/* HISTORIAL POR MASCOTA                          */}
      {/* ============================================ */}
      {mascotas.length === 0 ? (
        <EmptyState
          icon={<Dog className="h-16 w-16" />}
          title="Sin mascotas registradas"
          description="Registra tu primera mascota para ver su historial"
        />
      ) : (
        <div className="space-y-4">
          {mascotas.map((m) => {
            const isExpanded = expandedMascota === m.id;
            return (
              <Card key={m.id} className="overflow-hidden">
                {/* Header de mascota */}
                <div
                  className="p-4 cursor-pointer hover:bg-secondary/10 transition-colors flex items-center justify-between"
                  onClick={() => setExpandedMascota(isExpanded ? null : m.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl border-3 border-foreground bg-primary/20 p-3">
                      <Dog className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold">{m.nombre}</h3>
                      <p className="text-sm text-foreground/50">
                        {m.totalServicios} servicio{m.totalServicios !== 1 ? 's' : ''} realizado{m.totalServicios !== 1 ? 's' : ''}
                        {m.ultimoServicio && ` · Último: ${format(parseISO(m.ultimoServicio), "dd/MM/yy")}`}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">{m.totalServicios}</Badge>
                </div>

                {isExpanded && (
                  <CardContent className="border-t-3 border-foreground pt-4 space-y-4">
                    {/* Últimas citas */}
                    {m.ultimasCitas?.length > 0 && (
                      <div>
                        <p className="text-sm font-bold mb-2 flex items-center gap-1">
                          <Calendar className="h-4 w-4" /> Últimos servicios:
                        </p>
                        <div className="space-y-2">
                          {m.ultimasCitas.map((c, i) => (
                            <div key={i} className="border-2 border-foreground rounded-xl p-3">
                              <div className="flex justify-between text-sm mb-1">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-3 w-3" />
                                  <span className="font-bold">{format(parseISO(c.fecha), "dd/MM/yy")}</span>
                                </div>
                                <span>{c.servicio}</span>
                                <Badge variant="outline" className="text-[10px]">{c.estado}</Badge>
                              </div>

                              {c.estadoIngreso && (
                                <div className="mt-2 bg-secondary/30 rounded-lg p-2 text-xs">
                                  <p className="font-bold flex items-center gap-1">
                                    <ClipboardList className="h-3 w-3" /> Estado al ingreso:
                                  </p>
                                  <p className="text-foreground/70 mt-0.5">{c.estadoIngreso}</p>
                                </div>
                              )}

                              {c.recomendaciones && (
                                <div className="mt-2 bg-lavender/10 border border-lavender/30 rounded-lg p-2 text-xs">
                                  <p className="font-bold text-lavender flex items-center gap-1">
                                    <MessageSquare className="h-3 w-3" /> Recomendaciones:
                                  </p>
                                  <p className="text-foreground/70 mt-0.5">{c.recomendaciones}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Galería de fotos */}
                    {m.fotos?.length > 0 && (
                      <div>
                        <p className="text-sm font-bold mb-2 flex items-center gap-1">
                          <Camera className="h-4 w-4" /> Galería de evolución:
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {m.fotos.slice(0, 12).map((f, i) => (
                            <div
                              key={i}
                              onClick={() => setSelectedFoto({ url: f.url, tipo: f.tipo })}
                              className="relative group cursor-pointer rounded-xl border-3 border-foreground overflow-hidden bg-secondary hover:shadow-cartoon-hover transition-all"
                            >
                              <div className="aspect-square">
                                <img
                                  src={getImageUrl(f.url) || '/paw-print.svg'}
                                  alt={f.tipo}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = '/paw-print.svg';
                                    target.className = 'w-full h-full object-contain p-4 opacity-50';
                                  }}
                                />
                              </div>
                              <div className="absolute bottom-0 left-0 right-0 bg-foreground/80 text-white p-1.5">
                                <Badge className={`text-[9px] ${f.tipo === 'antes' ? 'bg-rose' : 'bg-primary'}`}>
                                  {f.tipo === 'antes' ? 'Antes' : 'Después'}
                                </Badge>
                                <p className="text-[9px] mt-0.5">{format(parseISO(f.fecha), "dd/MM/yy")}</p>
                              </div>
                              <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 flex items-center justify-center transition-all">
                                <div className="bg-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all transform scale-50 group-hover:scale-100">
                                  <ImageIcon className="h-5 w-5" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* ============================================ */}
      {/* MODAL DE FOTO AMPLIADA                         */}
      {/* ============================================ */}
      {selectedFoto && (
        <div
          className="fixed inset-0 z-50 bg-foreground/80 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setSelectedFoto(null)}
        >
          <div
            className="max-w-2xl max-h-[90vh] bg-white rounded-2xl border-3 border-foreground shadow-cartoon overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4">
              <img
                src={getImageUrl(selectedFoto.url) || '/paw-print.svg'}
                alt={selectedFoto.tipo}
                className="max-h-[60vh] w-full object-contain rounded-xl"
              />
            </div>
            <div className="p-4 border-t-3 border-foreground bg-secondary/30 flex items-center justify-between">
              <Badge className={selectedFoto.tipo === 'antes' ? 'bg-rose' : 'bg-primary'}>
                {selectedFoto.tipo === 'antes' ? 'Antes' : 'Después'}
              </Badge>
              <Button variant="outline" size="sm" onClick={() => setSelectedFoto(null)}>Cerrar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}