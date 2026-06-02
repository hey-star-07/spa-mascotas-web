"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { Tag, Plus, Trash2, Percent, DollarSign, Calendar, Ticket } from "lucide-react";
import { toast } from "sonner";

interface Promocion {
  id: number;
  nombre: string;
  descripcion: string | null;
  tipo: string;
  valor: number;
  fechaInicio: string;
  fechaFin: string;
  codigoCupon: string | null;
  activo: boolean;
  producto: { nombre: string } | null;
  servicio: { nombre: string } | null;
}

export default function PromotionsPage() {
  const [promociones, setPromociones] = useState<Promocion[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadData = async () => {
    try {
      const { data } = await api.get("/promotions");
      setPromociones(data.data || []);
    } catch { toast.error("Error al cargar promociones"); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar esta promoción?")) return;
    try {
      await api.delete(`/promotions/${id}`);
      toast.success("Promoción eliminada");
      loadData();
    } catch { toast.error("Error"); }
  };

  const isActive = (promo: Promocion) => {
    const now = new Date();
    return promo.activo && new Date(promo.fechaInicio) <= now && new Date(promo.fechaFin) >= now;
  };

  if (loading) return <LoadingSpinner text="Cargando promociones..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Tag className="h-8 w-8" strokeWidth={3} />
          <div>
            <h1 className="text-3xl font-extrabold">Promociones</h1>
            <p className="text-sm font-semibold text-foreground/70">
              {promociones.length} promoción{promociones.length !== 1 && "es"}
            </p>
          </div>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nueva Promoción
        </Button>
      </div>

      {promociones.length === 0 ? (
        <EmptyState icon={<Tag className="h-12 w-12" />} title="Sin promociones" description="Crea tu primera promoción" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {promociones.map((p) => {
            const activa = isActive(p);
            return (
              <Card key={p.id} className={`hover:shadow-cartoon-hover transition-all ${!activa ? "opacity-60" : ""}`}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {p.tipo === 'porcentaje' ? <Percent className="h-5 w-5" /> : <DollarSign className="h-5 w-5" />}
                    {p.nombre}
                  </CardTitle>
                  <Badge variant={activa ? "default" : "destructive"}>
                    {activa ? "Activa" : "Inactiva"}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-2">
                  {p.descripcion && <p className="text-sm">{p.descripcion}</p>}
                  <div className="text-2xl font-extrabold">
                    {p.tipo === 'porcentaje' ? `${p.valor}%` : `Bs. ${p.valor}`}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Calendar className="h-3 w-3" />
                    {new Date(p.fechaInicio).toLocaleDateString()} → {new Date(p.fechaFin).toLocaleDateString()}
                  </div>
                  {p.codigoCupon && (
                    <div className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-1.5">
                      <Ticket className="h-4 w-4" />
                      <code className="text-sm font-mono font-bold">{p.codigoCupon}</code>
                    </div>
                  )}
                  {p.producto && <p className="text-xs">Producto: {p.producto.nombre}</p>}
                  {p.servicio && <p className="text-xs">Servicio: {p.servicio.nombre}</p>}
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(p.id)} className="mt-2">
                    <Trash2 className="h-3 w-3 mr-1" /> Eliminar
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Diálogo Nueva Promoción */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nueva Promoción</DialogTitle></DialogHeader>
          <NuevaPromocionForm onSuccess={() => { setDialogOpen(false); loadData(); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NuevaPromocionForm({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState({
    nombre: "", descripcion: "", tipo: "porcentaje", valor: 10,
    fechaInicio: "", fechaFin: "", codigoCupon: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.nombre || !form.fechaInicio || !form.fechaFin) {
      return toast.error("Completa los campos requeridos");
    }
    setLoading(true);
    try {
      await api.post("/promotions", {
        ...form,
        fechaInicio: new Date(form.fechaInicio).toISOString(),
        fechaFin: new Date(form.fechaFin).toISOString(),
      });
      toast.success("Promoción creada");
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error");
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Nombre *</Label><Input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} /></div>
        <div>
          <Label>Tipo</Label>
          <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})} className="w-full h-12 rounded-xl border-3 border-foreground bg-white px-4 font-bold">
            <option value="porcentaje">Porcentaje (%)</option>
            <option value="monto_fijo">Monto Fijo (Bs.)</option>
          </select>
        </div>
      </div>
      <div><Label>Descripción</Label><Input value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Valor ({form.tipo === 'porcentaje' ? '%' : 'Bs.'})</Label><Input type="number" value={form.valor} onChange={e => setForm({...form, valor: parseFloat(e.target.value)})} /></div>
        <div><Label>Código Cupón</Label><Input value={form.codigoCupon} onChange={e => setForm({...form, codigoCupon: e.target.value.toUpperCase()})} placeholder="VERANO2026" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Inicio *</Label><Input type="date" value={form.fechaInicio} onChange={e => setForm({...form, fechaInicio: e.target.value})} /></div>
        <div><Label>Fin *</Label><Input type="date" value={form.fechaFin} onChange={e => setForm({...form, fechaFin: e.target.value})} /></div>
      </div>
      <DialogFooter>
        <Button onClick={handleSubmit} disabled={loading}>{loading ? "Creando..." : "Crear Promoción"}</Button>
      </DialogFooter>
    </div>
  );
}