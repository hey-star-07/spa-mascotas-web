"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Package, CheckCircle, Clock, AlertTriangle, User } from "lucide-react";
import { toast } from "sonner";

interface InsumoAsignado {
  id: number;
  cantidadAsignada: number;
  estado: string;
  producto: { id: number; nombre: string; sku: string; imagenUrl: string | null };
  variante: { id: number; atributo: string; valor: string } | null;
  asignador: { id: number; nombre: string; apellido: string };
  confirmador: { id: number; nombre: string; apellido: string } | null;
  fechaAsignacion: string;
  fechaConfirmacion: string | null;
}

interface InsumosConfirmacionProps {
  citaId: number;
  onTodosConfirmados: () => void;
}

export function InsumosConfirmacion({ citaId, onTodosConfirmados }: InsumosConfirmacionProps) {
  const [insumos, setInsumos] = useState<InsumoAsignado[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmando, setConfirmando] = useState<number | null>(null);

  const loadInsumos = async () => {
    try {
      const { data } = await api.get(`/inventory/insumos-asignados/${citaId}`);
      setInsumos(data.data || []);
      
      // Verificar si todos están confirmados
      const todosListos = (data.data || []).every((i: InsumoAsignado) => i.estado !== 'pendiente');
      if (todosListos) {
        onTodosConfirmados();
      }
    } catch {
      toast.error("Error al cargar insumos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadInsumos(); }, [citaId]);

  const confirmarRecepcion = async (insumoId: number) => {
    setConfirmando(insumoId);
    try {
      await api.put(`/inventory/confirmar-insumo/${insumoId}`);
      toast.success("Recepción confirmada");
      loadInsumos();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al confirmar");
    } finally {
      setConfirmando(null);
    }
  };

  const confirmarTodos = async () => {
    const pendientes = insumos.filter(i => i.estado === 'pendiente');
    for (const insumo of pendientes) {
      await confirmarRecepcion(insumo.id);
    }
  };

  const pendientes = insumos.filter(i => i.estado === 'pendiente').length;
  const confirmados = insumos.filter(i => i.estado === 'confirmado').length;
  const total = insumos.length;

  if (loading) return <LoadingSpinner text="Cargando insumos asignados..." />;

  if (insumos.length === 0) {
    return (
      <div className="text-center py-6">
        <Package className="h-12 w-12 text-foreground/30 mx-auto mb-2" />
        <p className="text-sm font-semibold text-foreground/50">No hay insumos asignados para este servicio.</p>
        <p className="text-xs text-foreground/40 mt-1">Recepción no asignó insumos. Puedes continuar sin ellos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumen visual */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-rose/10 border-2 border-rose rounded-xl p-3 text-center">
          <p className="text-2xl font-extrabold text-rose">{pendientes}</p>
          <p className="text-[10px] font-semibold">Pendientes</p>
        </div>
        <div className="bg-accent/10 border-2 border-accent rounded-xl p-3 text-center">
          <p className="text-2xl font-extrabold text-accent">{confirmados}</p>
          <p className="text-[10px] font-semibold">Confirmados</p>
        </div>
        <div className="bg-primary/10 border-2 border-primary rounded-xl p-3 text-center">
          <p className="text-2xl font-extrabold text-primary">{total}</p>
          <p className="text-[10px] font-semibold">Total</p>
        </div>
      </div>

      {/* Barra de progreso */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span>Progreso de confirmación</span>
          <span>{Math.round((confirmados / Math.max(total, 1)) * 100)}%</span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className={`h-2.5 flex-1 rounded-full border-2 border-foreground transition-all ${
                i < confirmados ? "bg-primary" : i < confirmados + pendientes && pendientes > 0 ? "bg-rose/50" : "bg-gray-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Lista de insumos */}
      <div className="space-y-2">
        {insumos.map((insumo) => (
          <div
            key={insumo.id}
            className={`p-3 border-2 border-foreground rounded-xl transition-all ${
              insumo.estado === 'confirmado' ? 'bg-primary/10 border-primary' :
              insumo.estado !== 'pendiente' ? 'bg-gray-100' : ''
            }`}
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                {/* Icono de estado */}
                {insumo.estado === 'confirmado' ? (
                  <CheckCircle className="h-6 w-6 text-primary" />
                ) : insumo.estado === 'pendiente' ? (
                  <Clock className="h-6 w-6 text-rose" />
                ) : (
                  <CheckCircle className="h-6 w-6 text-gray-400" />
                )}

                <div>
                  <p className="font-bold text-sm">{insumo.producto.nombre}</p>
                  {insumo.variante && (
                    <p className="text-xs text-foreground/50">{insumo.variante.valor}</p>
                  )}
                  <p className="text-xs">
                    Cantidad asignada: <strong>{Number(insumo.cantidadAsignada)} uds</strong>
                  </p>
                  <div className="flex items-center gap-1 text-[10px] text-foreground/50 mt-1">
                    <User className="h-3 w-3" />
                    <span>Asignado por: {insumo.asignador?.nombre} {insumo.asignador?.apellido}</span>
                  </div>
                  {insumo.confirmador && (
                    <div className="flex items-center gap-1 text-[10px] text-primary mt-0.5">
                      <CheckCircle className="h-3 w-3" />
                      <span>Confirmado por: {insumo.confirmador?.nombre} {insumo.confirmador?.apellido}</span>
                      {insumo.fechaConfirmacion && (
                        <span>- {new Date(insumo.fechaConfirmacion).toLocaleTimeString()}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={insumo.estado === 'confirmado' ? 'default' : insumo.estado === 'pendiente' ? 'destructive' : 'secondary'}>
                  {insumo.estado === 'confirmado' ? 'Recibido' : insumo.estado === 'pendiente' ? 'Pendiente' : insumo.estado}
                </Badge>

                {insumo.estado === 'pendiente' && (
                  <Button
                    size="sm"
                    variant="accent"
                    onClick={() => confirmarRecepcion(insumo.id)}
                    disabled={confirmando === insumo.id}
                  >
                    {confirmando === insumo.id ? "Confirmando..." : "Confirmar Recepción"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Botón confirmar todos */}
      {pendientes > 0 && (
        <div className="bg-accent/10 border-2 border-accent rounded-xl p-3 text-center">
          <p className="text-sm font-bold text-accent mb-2">
            {pendientes} insumo{pendientes !== 1 && 's'} pendiente{pendientes !== 1 && 's'} de confirmación
          </p>
          <Button variant="accent" onClick={confirmarTodos} disabled={confirmando !== null}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Confirmar Todos
          </Button>
        </div>
      )}

      {/* Aviso de bloqueo */}
      {pendientes > 0 && (
        <div className="bg-rose/10 border-2 border-rose rounded-xl p-3 flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-rose flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-extrabold text-rose">Confirma todos los insumos</p>
            <p className="text-xs text-foreground/70">
              Debes confirmar la recepción de todos los insumos antes de continuar con el servicio.
              Esto genera el registro de salida de almacén.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}