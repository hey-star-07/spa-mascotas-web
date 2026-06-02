"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { ArrowLeft, Plus, Trash2, Save, GripVertical, Scissors } from "lucide-react";
import { toast } from "sonner";

interface ChecklistItem {
  id: number;
  item: string;
  orden: number;
  requiereObservacion: boolean;
}

interface Servicio {
  id: number;
  nombre: string;
}

export default function ChecklistConfigPage() {
  const params = useParams();
  const router = useRouter();
  const [servicio, setServicio] = useState<Servicio | null>(null);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState("");
  const [newRequiereObs, setNewRequiereObs] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      const { data } = await api.get(`/services/${params.id}`);
      setServicio(data.data);
      // Cargar plantillas del servicio
      const checklistRes = await api.get(`/services/${params.id}/checklist`);
      setItems(checklistRes.data.data || []);
    } catch { toast.error("Error al cargar"); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [params.id]);

  const addItem = async () => {
    if (!newItem.trim()) return toast.error("Ingresa un nombre");
    setSaving(true);
    try {
      await api.post(`/services/${params.id}/checklist`, {
        item: newItem,
        orden: items.length + 1,
        requiereObservacion: newRequiereObs,
      });
      toast.success("Item agregado");
      setNewItem("");
      setNewRequiereObs(false);
      loadData();
    } catch { toast.error("Error"); }
    finally { setSaving(false); }
  };

  const deleteItem = async (itemId: number) => {
    try {
      await api.delete(`/services/${params.id}/checklist/${itemId}`);
      toast.success("Item eliminado");
      loadData();
    } catch { toast.error("Error"); }
  };

  if (loading) return <LoadingSpinner text="Cargando..." />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => router.push("/services")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Servicios
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Scissors className="h-8 w-8" strokeWidth={3} />
            <div>
              <CardTitle>Checklist: {servicio?.nombre}</CardTitle>
              <CardDescription>
                {items.length} item{items.length !== 1 && "s"} configurado{items.length !== 1 && "s"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Lista de items */}
          {items.length === 0 ? (
            <EmptyState icon={<Scissors className="h-12 w-12" />} title="Sin items" description="Agrega los items del checklist para este servicio" />
          ) : (
            <div className="space-y-2">
              {items.sort((a, b) => a.orden - b.orden).map((item, index) => (
                <div key={item.id} className="flex items-center justify-between p-3 border-2 border-foreground rounded-xl">
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-foreground/30" />
                    <span className="text-xs font-bold text-foreground/40 w-5">{index + 1}.</span>
                    <div>
                      <p className="font-bold text-sm">{item.item}</p>
                      {item.requiereObservacion && (
                        <Badge variant="outline" className="text-[10px]">Requiere observación</Badge>
                      )}
                    </div>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => deleteItem(item.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Agregar nuevo item */}
          <div className="border-t-3 border-foreground pt-4 space-y-3">
            <p className="font-extrabold text-sm">Agregar nuevo item</p>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Label>Nombre del item</Label>
                <Input
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder="Ej: Baño con shampoo"
                  onKeyDown={(e) => e.key === "Enter" && addItem()}
                />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={newRequiereObs}
                  onChange={(e) => setNewRequiereObs(e.target.checked)}
                  className="h-5 w-5 rounded border-2 border-foreground accent-primary"
                  id="reqObs"
                />
                <Label htmlFor="reqObs" className="text-xs">Requiere observación</Label>
              </div>
              <Button onClick={addItem} disabled={saving}>
                <Plus className="mr-2 h-4 w-4" /> Agregar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}