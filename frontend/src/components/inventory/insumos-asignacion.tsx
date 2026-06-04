"use client";

import { useState } from "react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Package, Plus, Minus, Save, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface InsumoItem {
  productoId: number;
  varianteId?: number;
  nombre: string;
  cantidad: number;
  stockDisponible: number;
}

interface InsumosAsignacionProps {
  citaId: number;
  servicioId: number;
  onSave: () => void;
}

export function InsumosAsignacion({ citaId, servicioId, onSave }: InsumosAsignacionProps) {
  const [insumos, setInsumos] = useState<InsumoItem[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState("");

  // Cargar productos disponibles
  useState(() => {
    api.get("/inventory/insumos-tecnicos").then(({ data }) => setProductos(data.data || []));
  });

  const addInsumo = () => {
    if (!selectedProducto) return;
    const producto = productos.find(p => p.id.toString() === selectedProducto);
    if (!producto) return;
    
    const stockTotal = producto.variantes?.reduce((sum: number, v: any) => sum + v.stockAdicional, 0) || 0;
    
    setInsumos([...insumos, {
      productoId: producto.id,
      varianteId: producto.variantes?.[0]?.id,
      nombre: producto.nombre,
      cantidad: 1,
      stockDisponible: stockTotal,
    }]);
    setSelectedProducto("");
  };

  const updateCantidad = (index: number, delta: number) => {
    const nuevos = [...insumos];
    nuevos[index].cantidad = Math.max(0, nuevos[index].cantidad + delta);
    setInsumos(nuevos);
  };

  const removeInsumo = (index: number) => {
    setInsumos(insumos.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (insumos.length === 0) return toast.error("Agrega al menos un insumo");
    setLoading(true);
    try {
      await api.post("/inventory/asignar-insumos", {
        citaId,
        insumos: insumos.map(i => ({
          productoId: i.productoId,
          varianteId: i.varianteId,
          cantidad: i.cantidad,
        })),
      });
      toast.success("Insumos asignados al groomer");
      onSave();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al asignar");
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <select
          value={selectedProducto}
          onChange={e => setSelectedProducto(e.target.value)}
          className="flex-1 h-12 rounded-xl border-3 border-foreground bg-white px-4 font-bold"
        >
          <option value="">Seleccionar producto</option>
          {productos.map(p => (
            <option key={p.id} value={p.id}>{p.nombre}</option>
          ))}
        </select>
        <Button onClick={addInsumo} variant="outline"><Plus className="h-4 w-4" /></Button>
      </div>

      {insumos.length > 0 && (
        <div className="space-y-2">
          {insumos.map((insumo, i) => (
            <div key={i} className="flex items-center justify-between p-2 border-2 border-foreground rounded-xl">
              <div className="flex-1">
                <p className="font-bold text-sm">{insumo.nombre}</p>
                <p className="text-[10px] text-foreground/50">Stock: {insumo.stockDisponible} uds</p>
                {insumo.cantidad > insumo.stockDisponible && (
                  <p className="text-[10px] text-rose font-bold flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Stock insuficiente
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="outline" onClick={() => updateCantidad(i, -1)}><Minus className="h-3 w-3" /></Button>
                <span className="w-8 text-center font-bold">{insumo.cantidad}</span>
                <Button size="sm" variant="outline" onClick={() => updateCantidad(i, 1)}><Plus className="h-3 w-3" /></Button>
              </div>
              <Button size="sm" variant="ghost" onClick={() => removeInsumo(i)} className="ml-2 text-rose">✕</Button>
            </div>
          ))}
        </div>
      )}

      {insumos.length > 0 && (
        <Button onClick={handleSave} disabled={loading} className="w-full" variant="accent">
          <Save className="mr-2 h-4 w-4" />
          {loading ? "Asignando..." : "Asignar Insumos al Groomer"}
        </Button>
      )}
    </div>
  );
}