"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import api from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Scissors, Plus, Clock, DollarSign, Edit, Power, PowerOff } from "lucide-react";
import { toast } from "sonner";

interface Service {
  id: number;
  nombre: string;
  descripcion: string | null;
  duracionBaseMinutos: number;
  precioBase: number;
  factorTamanoRaza: number;
  activo: boolean;
}

export default function ServicesPage() {
  const { user } = useAuthStore();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    nombre: "", descripcion: "", duracionBaseMinutos: 30, precioBase: 0, factorTamanoRaza: 0.15,
  });

  const loadServices = async () => {
    try {
      const { data } = await api.get("/services");
      setServices(data.data);
    } catch { toast.error("Error al cargar servicios"); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadServices(); }, []);

  const handleSubmit = async () => {
    try {
      if (editingService) {
        await api.put(`/services/${editingService.id}`, formData);
        toast.success("Servicio actualizado");
      } else {
        await api.post("/services", formData);
        toast.success("Servicio creado");
      }
      setDialogOpen(false);
      setEditingService(null);
      loadServices();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error");
    }
  };

  const toggleActive = async (service: Service) => {
    try {
      await api.put(`/services/${service.id}`, { activo: !service.activo });
      toast.success(service.activo ? "Servicio desactivado" : "Servicio activado");
      loadServices();
    } catch { toast.error("Error"); }
  };

  if (loading) return <LoadingSpinner text="Cargando servicios..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Scissors className="h-8 w-8" strokeWidth={3} />
          <h1 className="text-3xl font-extrabold">Servicios</h1>
        </div>
        {user?.rol === "Admin" && (
          <Button onClick={() => { setEditingService(null); setFormData({ nombre: "", descripcion: "", duracionBaseMinutos: 30, precioBase: 0, factorTamanoRaza: 0.15 }); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo Servicio
          </Button>
        )}
      </div>

      {services.length === 0 ? (
        <EmptyState icon={<Scissors className="h-12 w-12" />} title="No hay servicios" description="Crea tu primer servicio" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((s) => (
            <Card key={s.id} className={!s.activo ? "opacity-60" : ""}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">{s.nombre}</CardTitle>
                <Badge variant={s.activo ? "default" : "destructive"}>{s.activo ? "Activo" : "Inactivo"}</Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                {s.descripcion && <p className="text-sm text-foreground/70">{s.descripcion}</p>}
                <div className="flex items-center gap-2 text-sm font-bold"><Clock className="h-4 w-4" /> {s.duracionBaseMinutos} min</div>
                <div className="flex items-center gap-2 text-sm font-bold"><DollarSign className="h-4 w-4" /> Bs. {s.precioBase}</div>
                <div className="text-xs text-foreground/50">Ajuste por tamaño: {(s.factorTamanoRaza * 100).toFixed(0)}%</div>
                {user?.rol === "Admin" && (
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" onClick={() => { setEditingService(s); setFormData({ nombre: s.nombre, descripcion: s.descripcion || "", duracionBaseMinutos: s.duracionBaseMinutos, precioBase: s.precioBase, factorTamanoRaza: s.factorTamanoRaza }); setDialogOpen(true); }}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant={s.activo ? "destructive" : "default"} onClick={() => toggleActive(s)}>
                      {s.activo ? <PowerOff className="h-3 w-3" /> : <Power className="h-3 w-3" />}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingService ? "Editar Servicio" : "Nuevo Servicio"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Nombre</Label><Input value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} /></div>
            <div><Label>Descripción</Label><Input value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Duración (min)</Label><Input type="number" value={formData.duracionBaseMinutos} onChange={e => setFormData({...formData, duracionBaseMinutos: parseInt(e.target.value)})} /></div>
              <div><Label>Precio (Bs.)</Label><Input type="number" value={formData.precioBase} onChange={e => setFormData({...formData, precioBase: parseFloat(e.target.value)})} /></div>
            </div>
            <div><Label>Ajuste por tamaño (%)</Label><Input type="number" step="0.05" value={formData.factorTamanoRaza} onChange={e => setFormData({...formData, factorTamanoRaza: parseFloat(e.target.value)})} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit}>{editingService ? "Guardar" : "Crear"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}