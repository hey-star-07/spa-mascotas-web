"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Dog, Scissors, Camera, CheckCircle, XCircle, Lock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface FichaDetail {
  id: number;
  citaId: number;
  razaTamanoMomento: string;
  temperaturaAnimal: number | null;
  notasInternas: string | null;
  fechaCierre: string | null;
  cita: {
    mascota: { nombre: string; raza: string; tamanio: string; alergiasConocidas: string };
    servicio: { nombre: string };
    groomer: { usuario: { nombre: string } };
  };
  checklist: Array<{ id: number; completado: boolean; observacion: string | null; plantillaChecklist: { item: string; requiereObservacion: boolean } }>;
  fotos: Array<{ id: number; tipo: string; urlFoto: string }>;
  consumoInsumos: Array<{ id: number; producto: { nombre: string }; cantidad: number; merma: boolean; devuelto: boolean }>;
}

export default function FichaTecnicaPage() {
  const params = useParams();
  const router = useRouter();
  const [ficha, setFicha] = useState<FichaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [fotoUrl, setFotoUrl] = useState("");
  const [fotoTipo, setFotoTipo] = useState<"antes" | "despues">("antes");

  const loadFicha = async () => {
    try {
      const { data } = await api.get(`/grooming/fichas/${params.id}`);
      setFicha(data.data);
    } catch { toast.error("Error al cargar ficha"); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadFicha(); }, [params.id]);

  const toggleChecklist = async (itemId: number, currentValue: boolean) => {
    try {
      await api.put(`/grooming/checklist/${itemId}`, { completado: !currentValue });
      loadFicha();
    } catch { toast.error("Error"); }
  };

  const addFoto = async () => {
    if (!fotoUrl) return toast.error("Ingresa URL de la foto");
    try {
      await api.post("/grooming/fotos", { fichaGroomingId: ficha?.id, tipo: fotoTipo, urlFoto: fotoUrl });
      toast.success("Foto agregada");
      setFotoUrl("");
      loadFicha();
    } catch { toast.error("Error al agregar foto"); }
  };

  const cerrarFicha = async () => {
    const completados = ficha?.checklist.filter(c => c.completado).length || 0;
    if (completados < 5) return toast.error("Completa al menos 5 items del checklist");
    if (!confirm("¿Cerrar esta ficha? Se descontarán los insumos del inventario.")) return;
    try {
      await api.put(`/grooming/fichas/${ficha?.id}/cerrar`);
      toast.success("Ficha cerrada exitosamente");
      router.push("/groomer-dashboard");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al cerrar");
    }
  };

  if (loading) return <LoadingSpinner text="Cargando ficha..." />;
  if (!ficha) return <p>Ficha no encontrada</p>;

  const completados = ficha.checklist.filter(c => c.completado).length;
  const total = ficha.checklist.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Scissors className="h-8 w-8" strokeWidth={3} />
          <div>
            <h1 className="text-3xl font-extrabold">Ficha Técnica</h1>
            <p className="text-sm font-semibold">
              <Dog className="inline h-4 w-4" /> {ficha.cita.mascota.nombre} - {ficha.cita.servicio.nombre}
            </p>
          </div>
        </div>
        {!ficha.fechaCierre && (
          <Button onClick={cerrarFicha} variant="accent" size="lg">
            <Lock className="mr-2 h-5 w-5" /> Cerrar Servicio
          </Button>
        )}
      </div>

      {/* Info de mascota */}
      <Card>
        <CardHeader><CardTitle>Datos de la Mascota</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><strong>Raza:</strong> {ficha.cita.mascota.raza}</div>
            <div><strong>Tamaño:</strong> {ficha.cita.mascota.tamanio || 'N/A'}</div>
            <div><strong>Groomer:</strong> {ficha.cita.groomer.usuario.nombre}</div>
            <div><strong>Estado:</strong> {ficha.fechaCierre ? <Badge variant="default">Cerrada</Badge> : <Badge variant="secondary">En Progreso</Badge>}</div>
          </div>
          {ficha.cita.mascota.alergiasConocidas && (
            <div className="bg-rose/10 border-2 border-rose rounded-xl p-2 mt-3 text-xs flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-rose" /> Alergias: {ficha.cita.mascota.alergiasConocidas}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Checklist ({completados}/{total})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {ficha.checklist.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 border-2 border-foreground rounded-xl">
                <div className="flex items-center gap-2">
                  <button onClick={() => !ficha.fechaCierre && toggleChecklist(item.id, item.completado)}>
                    {item.completado ? (
                      <CheckCircle className="h-6 w-6 text-primary" />
                    ) : (
                      <XCircle className="h-6 w-6 text-foreground/30" />
                    )}
                  </button>
                  <span className={`font-semibold ${item.completado ? "line-through text-foreground/50" : ""}`}>
                    {item.plantillaChecklist.item}
                  </span>
                </div>
                {item.plantillaChecklist.requiereObservacion && item.completado && (
                  <Input placeholder="Observación..." className="w-48 text-xs" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Fotos */}
      <Card>
        <CardHeader><CardTitle>Fotos Antes/Después</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
            {ficha.fotos.map((foto) => (
              <div key={foto.id} className="relative">
                <Badge className="absolute top-2 left-2 z-10">{foto.tipo}</Badge>
                <img src={foto.urlFoto} alt={foto.tipo} className="w-32 h-32 object-cover rounded-xl border-3 border-foreground" />
              </div>
            ))}
          </div>
          {!ficha.fechaCierre && (
            <div className="flex gap-3 items-end">
              <div>
                <Label>Tipo</Label>
                <select value={fotoTipo} onChange={e => setFotoTipo(e.target.value as any)} className="h-12 rounded-xl border-3 border-foreground bg-white px-4 font-bold">
                  <option value="antes">Antes</option>
                  <option value="despues">Después</option>
                </select>
              </div>
              <div className="flex-1">
                <Label>URL de la foto</Label>
                <Input value={fotoUrl} onChange={e => setFotoUrl(e.target.value)} placeholder="https://..." />
              </div>
              <Button onClick={addFoto}><Camera className="mr-2 h-4 w-4" /> Agregar</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insumos */}
      <Card>
        <CardHeader><CardTitle>Insumos Utilizados</CardTitle></CardHeader>
        <CardContent>
          {ficha.consumoInsumos.length === 0 ? (
            <p className="text-sm text-foreground/50">No se han registrado insumos</p>
          ) : (
            <div className="space-y-2">
              {ficha.consumoInsumos.map((insumo) => (
                <div key={insumo.id} className="flex items-center justify-between p-2 border-2 border-foreground rounded-xl text-sm">
                  <span className="font-bold">{insumo.producto.nombre}</span>
                  <span>{insumo.cantidad} uds.</span>
                  {insumo.devuelto && <Badge variant="secondary">Devuelto</Badge>}
                  {insumo.merma && <Badge variant="destructive">Merma</Badge>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}