"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Package, CheckCircle, RotateCcw, Trash2, AlertTriangle, TrendingDown, Truck } from "lucide-react";
import { toast } from "sonner";

interface InsumoAsignado {
  id: number;
  cantidadAsignada: number;
  cantidadUsada: number | null;
  estado: string;
  observacion: string | null;
  producto: { id: number; nombre: string; sku: string };
  variante: { id: number; atributo: string; valor: string } | null;
}

interface InsumosUsoProps {
  citaId: number;
  fichaId?: number;
  fechaCierre?: string | null;
  onTodosRegistrados: () => void;
}

export function InsumosUso({ citaId, fichaId, fechaCierre, onTodosRegistrados }: InsumosUsoProps) {
  const [insumos, setInsumos] = useState<InsumoAsignado[]>([]);
  const [loading, setLoading] = useState(true);
  const [registrando, setRegistrando] = useState<number | null>(null);

  const loadInsumos = async () => {
    try {
      const { data } = await api.get(`/inventory/insumos-asignados/${citaId}`);
      const lista = data.data || [];
      setInsumos(lista);

      // Verificar si todos tienen destino final
      const estadosFinales = ['usado', 'devuelto', 'merma'];
      const todosListos = lista.every((i: InsumoAsignado) => estadosFinales.includes(i.estado));
      if (todosListos && lista.length > 0) {
        onTodosRegistrados();
      }
    } catch {
      toast.error("Error al cargar insumos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadInsumos(); }, [citaId]);

  // PASO 7: Confirmar entrega (solo confirma recepción, NO descuenta)
  const confirmarEntrega = async (insumoId: number) => {
    setRegistrando(insumoId);
    try {
      await api.put(`/inventory/confirmar-insumo/${insumoId}`);
      toast.success("Recepción confirmada - Producto entregado");
      loadInsumos();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al confirmar");
    } finally {
      setRegistrando(null);
    }
  };

  // Registrar uso final (Usado / Devuelto / Merma)
  const registrarUso = async (insumoId: number, estado: string) => {
    setRegistrando(insumoId);
    try {
      await api.put(`/inventory/registrar-uso/${insumoId}`, { estado });
      const mensajes: Record<string, string> = {
        usado: "Insumo marcado como Usado - Se descontará del inventario",
        devuelto: "Insumo marcado como Devuelto - No se descuenta",
        merma: "Insumo marcado como Merma - Se descuenta y registra como desperdicio",
      };
      toast.success(mensajes[estado] || `Insumo marcado como: ${estado}`);
      loadInsumos();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al registrar");
    } finally {
      setRegistrando(null);
    }
  };

  // Contadores
  const pendientes = insumos.filter(i => i.estado === 'pendiente').length;
  const confirmados = insumos.filter(i => i.estado === 'confirmado').length;
  const usados = insumos.filter(i => i.estado === 'usado').length;
  const devueltos = insumos.filter(i => i.estado === 'devuelto').length;
  const mermas = insumos.filter(i => i.estado === 'merma').length;
  const estadosFinales = ['usado', 'devuelto', 'merma'];
  const sinDestino = insumos.filter(i => !estadosFinales.includes(i.estado)).length;
  const total = insumos.length;

  if (loading) return <LoadingSpinner text="Cargando insumos..." />;

  if (insumos.length === 0) {
    return (
      <div className="text-center py-6">
        <Package className="h-12 w-12 text-foreground/30 mx-auto mb-2" />
        <p className="text-sm font-semibold text-foreground/50">No hay insumos asignados para este servicio.</p>
      </div>
    );
  }

  const isFichaCerrada = !!fechaCierre;

  return (
    <div className="space-y-4">
      {/* Resumen visual */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <div className="bg-rose/10 border-2 border-rose rounded-xl p-2 text-center">
          <p className="text-lg font-extrabold text-rose">{pendientes}</p>
          <p className="text-[9px] font-semibold">Pendientes</p>
        </div>
        <div className="bg-accent/10 border-2 border-accent rounded-xl p-2 text-center">
          <p className="text-lg font-extrabold text-accent">{confirmados}</p>
          <p className="text-[9px] font-semibold">Entregados</p>
          <p className="text-[8px] text-foreground/50">No descuenta</p>
        </div>
        <div className="bg-primary/10 border-2 border-primary rounded-xl p-2 text-center">
          <p className="text-lg font-extrabold text-primary">{usados}</p>
          <p className="text-[9px] font-semibold">Usados</p>
          <p className="text-[8px] text-foreground/50">Descuenta stock</p>
        </div>
        <div className="bg-secondary/30 border-2 border-secondary rounded-xl p-2 text-center">
          <p className="text-lg font-extrabold">{devueltos}</p>
          <p className="text-[9px] font-semibold">Devueltos</p>
          <p className="text-[8px] text-foreground/50">No descuenta</p>
        </div>
        <div className="bg-rose/10 border-2 border-rose rounded-xl p-2 text-center">
          <p className="text-lg font-extrabold text-rose">{mermas}</p>
          <p className="text-[9px] font-semibold">Mermas</p>
          <p className="text-[8px] text-foreground/50">Desperdicio</p>
        </div>
      </div>

      {/* Barra de progreso */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span>Progreso: {total - sinDestino}/{total} con destino</span>
          <span>{Math.round(((total - sinDestino) / Math.max(total, 1)) * 100)}%</span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: Math.min(total, 20) }).map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full border border-foreground/20 transition-all ${
                i < usados ? 'bg-primary' :
                i < usados + devueltos ? 'bg-secondary' :
                i < usados + devueltos + mermas ? 'bg-rose' :
                i < usados + devueltos + mermas + confirmados ? 'bg-accent' :
                'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Impacto en stock */}
      {insumos.filter(i => i.estado === 'usado' || i.estado === 'merma').length > 0 && (
        <div className="bg-secondary/30 rounded-xl p-3">
          <p className="text-xs font-bold mb-2 flex items-center gap-1">
            <TrendingDown className="h-4 w-4" /> Impacto en inventario al cerrar:
          </p>
          <div className="space-y-1 text-xs">
            {insumos.filter(i => i.estado === 'usado' || i.estado === 'merma').map(insumo => (
              <div key={insumo.id} className="flex justify-between">
                <span>{insumo.producto.nombre}</span>
                <span className="font-bold text-rose">
                  -{Number(insumo.cantidadUsada || insumo.cantidadAsignada)} uds
                  {insumo.estado === 'merma' && ' (merma)'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de insumos */}
      <div className="space-y-2">
        {insumos.map((insumo) => {
          const tieneDestinoFinal = estadosFinales.includes(insumo.estado);
          const estaConfirmado = insumo.estado === 'confirmado';
          const estaPendiente = insumo.estado === 'pendiente';

          return (
            <div
              key={insumo.id}
              className={`p-3 border-2 border-foreground rounded-xl transition-all ${
                insumo.estado === 'usado' ? 'bg-primary/10 border-primary' :
                insumo.estado === 'devuelto' ? 'bg-secondary/30' :
                insumo.estado === 'merma' ? 'bg-rose/10 border-rose' :
                insumo.estado === 'confirmado' ? 'bg-accent/10 border-accent' : ''
              }`}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  {/* Icono de estado */}
                  {insumo.estado === 'pendiente' && <Clock className="h-5 w-5 text-rose" />}
                  {insumo.estado === 'confirmado' && <Truck className="h-5 w-5 text-accent" />}
                  {insumo.estado === 'usado' && <CheckCircle className="h-5 w-5 text-primary" />}
                  {insumo.estado === 'devuelto' && <RotateCcw className="h-5 w-5" />}
                  {insumo.estado === 'merma' && <Trash2 className="h-5 w-5 text-rose" />}

                  <div>
                    <p className="font-bold text-sm">{insumo.producto.nombre}</p>
                    {insumo.variante && <p className="text-xs">{insumo.variante.valor}</p>}
                    <p className="text-xs">
                      Cantidad asignada: <strong>{Number(insumo.cantidadAsignada)} uds</strong>
                      {insumo.cantidadUsada && insumo.cantidadUsada !== insumo.cantidadAsignada && (
                        <span className="ml-1">(usado: {Number(insumo.cantidadUsada)} uds)</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Badge de estado actual */}
                  <Badge variant={
                    insumo.estado === 'usado' ? 'default' :
                    insumo.estado === 'devuelto' ? 'secondary' :
                    insumo.estado === 'merma' ? 'destructive' :
                    insumo.estado === 'confirmado' ? 'default' : 'outline'
                  } className="text-xs">
                    {insumo.estado === 'pendiente' ? 'Pendiente' :
                     insumo.estado === 'confirmado' ? 'Entregado' :
                     insumo.estado === 'usado' ? 'Usado' :
                     insumo.estado === 'devuelto' ? 'Devuelto' : 'Merma'}
                  </Badge>

                  {/* Botones de acción (solo si la ficha NO está cerrada) */}
                  {!isFichaCerrada && (
                    <>
                      {/* PASO 7: Botón Entregado - solo confirma recepción */}
                      {estaPendiente && (
                        <Button
                          size="sm"
                          variant="accent"
                          onClick={() => confirmarEntrega(insumo.id)}
                          disabled={registrando === insumo.id}
                          title="Confirmar que recibiste físicamente este producto. No descuenta del inventario."
                        >
                          <Truck className="h-3 w-3 mr-1" /> Entregado
                        </Button>
                      )}

                      {/* Botones de destino final (aparecen después de confirmado) */}
                      {estaConfirmado && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => registrarUso(insumo.id, 'usado')}
                            disabled={registrando === insumo.id}
                            title="Se usó completamente. Se descuenta del inventario."
                          >
                            <CheckCircle className="h-3 w-3 mr-1" /> Usado
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => registrarUso(insumo.id, 'devuelto')}
                            disabled={registrando === insumo.id}
                            title="No se usó. Vuelve al inventario. No se descuenta."
                          >
                            <RotateCcw className="h-3 w-3 mr-1" /> Devuelto
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => registrarUso(insumo.id, 'merma')}
                            disabled={registrando === insumo.id}
                            title="Se desperdició. Se descuenta del inventario y se registra como pérdida."
                          >
                            <Trash2 className="h-3 w-3 mr-1" /> Merma
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {insumo.observacion && (
                <p className="text-[10px] text-foreground/50 mt-1 ml-8">Obs: {insumo.observacion}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Aviso de pendientes */}
      {sinDestino > 0 && !isFichaCerrada && (
        <div className="bg-rose/10 border-2 border-rose rounded-xl p-3 flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-rose flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-extrabold text-rose">Completa el registro de todos los insumos</p>
            <p className="text-xs text-foreground/70">
              <strong>Paso 1:</strong> Marca como "Entregado" cuando recibas físicamente el producto.<br />
              <strong>Paso 2:</strong> Define el destino final: Usado, Devuelto o Merma.<br />
              Todos los insumos deben tener un destino antes de cerrar el servicio.
            </p>
          </div>
        </div>
      )}

      {/* Leyenda */}
      <div className="bg-secondary/20 rounded-xl p-3 text-[10px] text-foreground/60 space-y-1.5">
        <p className="font-extrabold text-xs text-foreground/80 mb-1">Leyenda de estados:</p>
        <div className="flex items-center gap-2">
          <Truck className="h-3 w-3 text-accent" />
          <span><strong>Entregado:</strong> El groomer confirma que recibió el producto. No descuenta inventario.</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="h-3 w-3 text-primary" />
          <span><strong>Usado:</strong> Se utilizó completamente. Se descuenta del stock al cerrar el servicio.</span>
        </div>
        <div className="flex items-center gap-2">
          <RotateCcw className="h-3 w-3" />
          <span><strong>Devuelto:</strong> No se utilizó. Vuelve al inventario sin descuento.</span>
        </div>
        <div className="flex items-center gap-2">
          <Trash2 className="h-3 w-3 text-rose" />
          <span><strong>Merma:</strong> Se desperdició o perdió. Se descuenta del stock y queda registrado para auditoría.</span>
        </div>
      </div>
    </div>
  );
}