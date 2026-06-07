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
  BarChart3, Clock, Scissors, Package, TrendingUp,
  Camera, CheckCircle, Calendar, Star, User, Dog,
  ChevronDown, ChevronUp, RefreshCw, Image as ImageIcon
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

// ============================================
// TIPOS
// ============================================
interface FichaReciente {
  id: number;
  fecha: string;
  mascota: string;
  servicio: string;
  fotos: number;
  checklistCompletado: boolean;
  estadoIngreso?: string;
  recomendaciones?: string;
}

interface ProductividadData {
  totalServicios: number;
  tiempoPromedio: number;
  serviciosPorDia: Array<{ fecha: string; cantidad: number }>;
  fichasRecientes: FichaReciente[];
}

interface ConsumoData {
  totalInsumos: number;
  porProducto: Array<{ producto: string; usado: number; devuelto: number; merma: number }>;
}

interface FotoGaleria {
  id: number;
  tipo: string;
  urlFoto: string;
  fecha: string;
  mascota: string;
  servicio: string;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function GroomerReportsPage() {
  const [productividad, setProductividad] = useState<ProductividadData | null>(null);
  const [consumo, setConsumo] = useState<ConsumoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>("productividad");
  const [selectedFoto, setSelectedFoto] = useState<FotoGaleria | null>(null);
  const [fotoModalOpen, setFotoModalOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get("/reports/groomer"),
      api.get("/reports/groomer/insumos"),
    ]).then(([prodRes, consRes]) => {
      setProductividad(prodRes.data.data);
      setConsumo(consRes.data.data);
    }).catch(() => toast.error("Error al cargar reportes"))
    .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Cargando tus reportes..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8" strokeWidth={3} />
          <div>
            <h1 className="text-3xl font-extrabold">Mi Productividad</h1>
            <p className="text-sm text-foreground/70">
              Reporte personal de desempeño
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          <RefreshCw className="mr-2 h-4 w-4" /> Actualizar
        </Button>
      </div>

      {/* KPIs */}
      {productividad && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard
            icon={<Scissors className="h-6 w-6" />}
            value={productividad.totalServicios}
            label="Servicios realizados"
            color="bg-primary/20"
          />
          <KpiCard
            icon={<Clock className="h-6 w-6" />}
            value={`${productividad.tiempoPromedio} min`}
            label="Tiempo promedio"
            color="bg-accent/20"
          />
          <KpiCard
            icon={<Package className="h-6 w-6" />}
            value={consumo?.totalInsumos || 0}
            label="Insumos usados"
            color="bg-lavender/20"
          />
          <KpiCard
            icon={<Star className="h-6 w-6" />}
            value={productividad.serviciosPorDia?.length || 0}
            label="Días trabajados"
            color="bg-secondary/30"
          />
        </div>
      )}

      {/* ============================================ */}
      {/* PRODUCTIVIDAD INDIVIDUAL                       */}
      {/* ============================================ */}
      <SectionCard
        title="Productividad Individual"
        icon={<TrendingUp className="h-5 w-5" />}
        expanded={expandedSection === "productividad"}
        onToggle={() => setExpandedSection(expandedSection === "productividad" ? null : "productividad")}
      >
        {productividad && (
          <div className="space-y-4">
            {/* Gráfico de servicios por día */}
            <div>
              <p className="text-xs font-bold mb-2">Servicios por día (últimos 30):</p>
              <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                {productividad.serviciosPorDia?.slice(-14).reverse().map((d) => {
                  const maxCant = Math.max(...productividad.serviciosPorDia.map(x => x.cantidad), 1);
                  const pct = (d.cantidad / maxCant) * 100;
                  return (
                    <div key={d.fecha} className="flex items-center gap-2 text-xs">
                      <span className="w-16 text-right font-mono">{d.fecha.slice(5)}</span>
                      <div className="flex-1 h-6 bg-gray-100 rounded-full border border-foreground/20 overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full flex items-center justify-end pr-2 transition-all"
                          style={{ width: `${pct}%` }}
                        >
                          {pct > 25 && (
                            <span className="text-[10px] font-bold text-white">{d.cantidad} serv.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Promedio vs total */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-primary/10 rounded-xl p-3 text-center">
                <p className="text-3xl font-extrabold">{productividad.totalServicios}</p>
                <p className="text-xs">Total servicios</p>
              </div>
              <div className="bg-accent/10 rounded-xl p-3 text-center">
                <p className="text-3xl font-extrabold">{productividad.tiempoPromedio}m</p>
                <p className="text-xs">Tiempo promedio</p>
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      {/* ============================================ */}
      {/* HISTORIAL DE SERVICIOS REALIZADOS              */}
      {/* ============================================ */}
      <SectionCard
        title="Historial de Servicios Realizados"
        icon={<CheckCircle className="h-5 w-5" />}
        expanded={expandedSection === "historial"}
        onToggle={() => setExpandedSection(expandedSection === "historial" ? null : "historial")}
        badge={productividad?.fichasRecientes?.length}
      >
        {productividad && (
          <div className="space-y-3">
            {productividad.fichasRecientes?.length === 0 ? (
              <EmptyState icon={<Scissors className="h-12 w-12" />} title="Sin servicios" description="Aún no has realizado servicios" />
            ) : (
              productividad.fichasRecientes.map((ficha) => (
                <Card key={ficha.id} className="hover:shadow-cartoon-hover transition-all">
                  <CardContent className="py-3">
                    <div className="flex items-start justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl border-2 border-foreground bg-primary/20 p-2">
                          <Dog className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="font-extrabold text-base">{ficha.mascota}</p>
                          <p className="text-sm">{ficha.servicio}</p>
                          <div className="flex items-center gap-2 text-xs text-foreground/50 mt-1">
                            <Calendar className="h-3 w-3" />
                            <span>{format(parseISO(ficha.fecha), "dd/MM/yy HH:mm")}</span>
                            <Camera className="h-3 w-3 ml-1" />
                            <span>{ficha.fotos} foto{ficha.fotos !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={ficha.checklistCompletado ? "default" : "secondary"}>
                          {ficha.checklistCompletado ? "Completado" : "Pendiente"}
                        </Badge>
                      </div>
                    </div>

                    {/* Estado de ingreso */}
                    {ficha.estadoIngreso && (
                      <div className="mt-2 bg-secondary/30 rounded-lg p-2 text-xs">
                        <p className="font-bold">Estado al ingreso:</p>
                        <p className="text-foreground/70">{ficha.estadoIngreso}</p>
                      </div>
                    )}

                    {/* Recomendaciones */}
                    {ficha.recomendaciones && (
                      <div className="mt-2 bg-lavender/10 border border-lavender/30 rounded-lg p-2 text-xs">
                        <p className="font-bold text-lavender">Recomendaciones:</p>
                        <p className="text-foreground/70">{ficha.recomendaciones}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </SectionCard>

      {/* ============================================ */}
      {/* GALERÍA DE FOTOS                               */}
      {/* ============================================ */}
      <SectionCard
        title="Galería de Fotos (Antes/Después)"
        icon={<Camera className="h-5 w-5" />}
        expanded={expandedSection === "galeria"}
        onToggle={() => setExpandedSection(expandedSection === "galeria" ? null : "galeria")}
      >
        {productividad && (
          <GaleriaFotos fichas={productividad.fichasRecientes} />
        )}
      </SectionCard>

      {/* ============================================ */}
      {/* CONSUMO PERSONAL DE INSUMOS                    */}
      {/* ============================================ */}
      <SectionCard
        title="Consumo Personal de Insumos"
        icon={<Package className="h-5 w-5" />}
        expanded={expandedSection === "consumo"}
        onToggle={() => setExpandedSection(expandedSection === "consumo" ? null : "consumo")}
      >
        {consumo && (
          <div className="space-y-4">
            {/* Total */}
            <div className="bg-primary/10 rounded-xl p-3 text-center">
              <p className="text-3xl font-extrabold">{consumo.totalInsumos}</p>
              <p className="text-xs">Total insumos registrados</p>
            </div>

            {/* Por producto */}
            {consumo.porProducto?.length === 0 ? (
              <p className="text-sm text-foreground/50 text-center">Sin registros de consumo</p>
            ) : (
              <div className="space-y-3">
                {consumo.porProducto.map((p, i) => {
                  const total = p.usado + p.devuelto + p.merma;
                  const maxTotal = Math.max(...consumo.porProducto.map(x => x.usado + x.devuelto + x.merma), 1);
                  const pct = (total / maxTotal) * 100;

                  return (
                    <div key={i} className="p-3 border-2 border-foreground rounded-xl">
                      <div className="flex justify-between mb-2">
                        <span className="font-bold text-sm">{p.producto}</span>
                        <span className="text-xs">{total} uds total</span>
                      </div>

                      {/* Barra de consumo */}
                      <div className="h-6 bg-gray-100 rounded-full border border-foreground/20 overflow-hidden flex">
                        {p.usado > 0 && (
                          <div
                            className="h-full bg-primary flex items-center justify-center text-[9px] font-bold text-white"
                            style={{ width: `${(p.usado / total) * 100}%` }}
                          >
                            {p.usado > total * 0.2 && `Usado: ${p.usado}`}
                          </div>
                        )}
                        {p.devuelto > 0 && (
                          <div
                            className="h-full bg-secondary flex items-center justify-center text-[9px] font-bold"
                            style={{ width: `${(p.devuelto / total) * 100}%` }}
                          >
                            {p.devuelto > total * 0.2 && `Dev: ${p.devuelto}`}
                          </div>
                        )}
                        {p.merma > 0 && (
                          <div
                            className="h-full bg-rose flex items-center justify-center text-[9px] font-bold text-white"
                            style={{ width: `${(p.merma / total) * 100}%` }}
                          >
                            {p.merma > total * 0.15 && `Merma: ${p.merma}`}
                          </div>
                        )}
                      </div>

                      {/* Leyenda */}
                      <div className="flex gap-3 mt-2 text-[10px]">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-primary inline-block" /> Usado: {p.usado}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-secondary inline-block" /> Devuelto: {p.devuelto}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-rose inline-block" /> Merma: {p.merma}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ============================================
// GALERÍA DE FOTOS
// ============================================
function GaleriaFotos({ fichas }: { fichas: FichaReciente[] }) {
  // Simular fotos desde las fichas (en producción vendrían del backend)
  const fotosMock: FotoGaleria[] = fichas.flatMap((f, i) => {
    const tipos = ['antes', 'despues'];
    return Array.from({ length: Math.min(f.fotos, 2) }).map((_, j) => ({
      id: i * 10 + j,
      tipo: tipos[j] || 'antes',
      urlFoto: `/uploads/pet-${(i % 5) + 1}.jpg`, // Placeholder
      fecha: f.fecha,
      mascota: f.mascota,
      servicio: f.servicio,
    }));
  });

  const [selectedFoto, setSelectedFoto] = useState<FotoGaleria | null>(null);

  if (fotosMock.length === 0) {
    return (
      <div className="text-center py-6">
        <ImageIcon className="h-12 w-12 text-foreground/30 mx-auto mb-2" />
        <p className="text-sm text-foreground/50">No hay fotos registradas aún.</p>
        <p className="text-xs text-foreground/40 mt-1">Las fotos de "antes y después" aparecerán aquí.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Grid de fotos */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {fotosMock.map((foto) => (
          <div
            key={foto.id}
            onClick={() => setSelectedFoto(foto)}
            className="relative group cursor-pointer rounded-xl border-3 border-foreground overflow-hidden bg-secondary hover:shadow-cartoon-hover transition-all"
          >
            {/* Imagen */}
            <div className="aspect-square">
              <img
                src={getImageUrl(foto.urlFoto) || '/paw-print.svg'}
                alt={`${foto.tipo} - ${foto.mascota}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/paw-print.svg';
                  target.className = 'w-full h-full object-contain p-4 opacity-50';
                }}
              />
            </div>

            {/* Overlay con info */}
            <div className="absolute bottom-0 left-0 right-0 bg-foreground/80 text-white p-2">
              <Badge className={`text-[9px] ${foto.tipo === 'antes' ? 'bg-rose' : 'bg-primary'}`}>
                {foto.tipo === 'antes' ? 'Antes' : 'Después'}
              </Badge>
              <p className="text-[10px] font-bold mt-0.5 truncate">{foto.mascota}</p>
              <p className="text-[8px] opacity-70 truncate">{foto.servicio}</p>
            </div>

            {/* Hover: lupa */}
            <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 flex items-center justify-center transition-all">
              <div className="bg-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all transform scale-50 group-hover:scale-100">
                <ImageIcon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de foto ampliada */}
      {selectedFoto && (
        <div
          className="fixed inset-0 z-50 bg-foreground/80 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setSelectedFoto(null)}
        >
          <div className="max-w-2xl max-h-[90vh] bg-white rounded-2xl border-3 border-foreground shadow-cartoon overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4">
              <img
                src={getImageUrl(selectedFoto.urlFoto) || '/paw-print.svg'}
                alt={`${selectedFoto.tipo} - ${selectedFoto.mascota}`}
                className="max-h-[60vh] w-full object-contain rounded-xl"
              />
            </div>
            <div className="p-4 border-t-3 border-foreground bg-secondary/30">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className={selectedFoto.tipo === 'antes' ? 'bg-rose' : 'bg-primary'}>
                      {selectedFoto.tipo === 'antes' ? 'Antes' : 'Después'}
                    </Badge>
                    <span className="font-extrabold">{selectedFoto.mascota}</span>
                  </div>
                  <p className="text-sm mt-1">{selectedFoto.servicio}</p>
                  <p className="text-xs text-foreground/50">{format(parseISO(selectedFoto.fecha), "dd/MM/yy")}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setSelectedFoto(null)}>Cerrar</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// COMPONENTES AUXILIARES
// ============================================

function KpiCard({ icon, value, label, color }: { icon: any; value: any; label: string; color: string }) {
  return (
    <Card>
      <CardContent className={`pt-4 text-center ${color} rounded-xl`}>
        <div className="flex justify-center mb-1">{icon}</div>
        <p className="text-xl font-extrabold">{value}</p>
        <p className="text-[10px] font-semibold">{label}</p>
      </CardContent>
    </Card>
  );
}

function SectionCard({ title, icon, expanded, onToggle, children, badge }: {
  title: string; icon: any; expanded: boolean; onToggle: () => void; children: any; badge?: number;
}) {
  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {icon} {title}
            {badge !== undefined && badge > 0 && (
              <Badge variant="secondary" className="text-[10px] ml-1">{badge}</Badge>
            )}
          </CardTitle>
          {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </CardHeader>
      {expanded && <CardContent>{children}</CardContent>}
    </Card>
  );
}