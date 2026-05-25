"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "@/lib/axios";
import { getImageUrl } from "@/lib/images";  // 👈 NUEVO
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/shared/image-upload";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { ArrowLeft, Dog, Calendar, Clock, Scissors, Save, Edit, FileText } from "lucide-react";
import { toast } from "sonner";

const updatePetSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido"),
  especie: z.string().optional(),
  raza: z.string().optional(),
  tamanio: z.string().optional(),
  fechaNacimiento: z.string().optional(),
  pesoKg: z.string().optional(),
  temperamento: z.string().optional(),
  alergiasConocidas: z.string().optional(),
  restriccionesMedicas: z.string().optional(),
});

type UpdatePetFormData = z.infer<typeof updatePetSchema>;

interface PetDetail {
  id: number;
  nombre: string;
  especie: string;
  raza: string | null;
  tamanio: string | null;
  temperamento: string | null;
  fechaNacimiento: string | null;
  alergiasConocidas: string | null;
  restriccionesMedicas: string | null;
  imagen: string | null;
  carnetVacunas: string | null;
  citas: Array<{
    id: number;
    fechaHoraInicio: string;
    estado: string;
    servicio: { nombre: string };
    groomer: { usuario: { nombre: string } } | null;
    fichaGrooming: {
      id: number;
      fechaCierre: string | null;
      fotos: Array<{ tipo: string; urlFoto: string }>;
    } | null;
  }>;
}

export default function PetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [pet, setPet] = useState<PetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imagenUrl, setImagenUrl] = useState("");
  const [carnetUrl, setCarnetUrl] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<UpdatePetFormData>({
    resolver: zodResolver(updatePetSchema),
  });

  useEffect(() => {
    api.get(`/pets/${params.id}`)
      .then(({ data }) => {
        setPet(data.data);
        setImagenUrl(data.data.imagen || "");
        setCarnetUrl(data.data.carnetVacunas || "");
      })
      .catch(() => { toast.error("Error al cargar mascota"); router.push("/my-pets"); })
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleUpdate = async (data: UpdatePetFormData) => {
    setSaving(true);
    try {
      await api.put(`/pets/${params.id}`, {
        ...data,
        pesoKg: data.pesoKg ? parseFloat(data.pesoKg) : undefined,
        imagen: imagenUrl,
        carnetVacunas: carnetUrl,
      });
      toast.success("Mascota actualizada");
      setEditing(false);
      const { data: newData } = await api.get(`/pets/${params.id}`);
      setPet(newData.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al actualizar");
    } finally { setSaving(false); }
  };

  if (loading) return <LoadingSpinner text="Cargando..." />;
  if (!pet) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push("/my-pets")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Mis Mascotas
        </Button>
        {!editing && (
          <Button variant="outline" onClick={() => setEditing(true)}>
            <Edit className="mr-2 h-4 w-4" /> Editar Datos
          </Button>
        )}
      </div>

      {editing ? (
        <Card>
          <CardHeader><CardTitle>Editar {pet.nombre}</CardTitle></CardHeader>
          <form onSubmit={handleSubmit(handleUpdate)}>
            <CardContent className="space-y-4">
              <div>
                <Label>Foto</Label>
                <ImageUpload label="Cambiar foto" currentImage={imagenUrl} onUpload={(url) => setImagenUrl(url)} />
              </div>
              <div>
                <Label>Carnet de Vacunas</Label>
                <ImageUpload label="Subir carnet" currentImage={carnetUrl} onUpload={(url) => setCarnetUrl(url)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Nombre *</Label><Input {...register("nombre")} defaultValue={pet.nombre} /></div>
                <div>
                  <Label>Especie</Label>
                  <select {...register("especie")} defaultValue={pet.especie} className="w-full h-12 rounded-xl border-3 border-foreground bg-white px-4 font-bold">
                    <option value="Canino">Perro</option>
                    <option value="Felino">Gato</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Raza</Label><Input {...register("raza")} defaultValue={pet.raza || ""} /></div>
                <div>
                  <Label>Tamaño</Label>
                  <select {...register("tamanio")} defaultValue={pet.tamanio || ""} className="w-full h-12 rounded-xl border-3 border-foreground bg-white px-4 font-bold">
                    <option value="">Seleccionar</option>
                    <option value="Pequeño">Pequeño</option>
                    <option value="Mediano">Mediano</option>
                    <option value="Grande">Grande</option>
                    <option value="Gigante">Gigante</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Fecha Nacimiento</Label><Input type="date" {...register("fechaNacimiento")} defaultValue={pet.fechaNacimiento?.split('T')[0] || ""} /></div>
                <div>
                  <Label>Temperamento</Label>
                  <select {...register("temperamento")} defaultValue={pet.temperamento || ""} className="w-full h-12 rounded-xl border-3 border-foreground bg-white px-4 font-bold">
                    <option value="">Seleccionar</option>
                    <option value="Tranquilo">Tranquilo</option>
                    <option value="Jugueton">Juguetón</option>
                    <option value="Agresivo">Agresivo</option>
                    <option value="Nervioso">Nervioso</option>
                    <option value="Timido">Tímido</option>
                  </select>
                </div>
              </div>
              <div><Label>Alergias</Label><Input {...register("alergiasConocidas")} defaultValue={pet.alergiasConocidas || ""} /></div>
              <div><Label>Restricciones Médicas</Label><Input {...register("restriccionesMedicas")} defaultValue={pet.restriccionesMedicas || ""} /></div>
            </CardContent>
            <CardContent>
              <div className="flex gap-3">
                <Button type="submit" disabled={saving}><Save className="mr-2 h-4 w-4" />{saving ? "Guardando..." : "Guardar Cambios"}</Button>
                <Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
              </div>
            </CardContent>
          </form>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                {pet.imagen ? (
                  <img src={getImageUrl(pet.imagen) || '/paw-print.svg'} alt={pet.nombre} className="w-24 h-24 object-cover rounded-xl border-3 border-foreground" />
                ) : (
                  <div className="w-24 h-24 rounded-xl border-3 border-foreground bg-primary flex items-center justify-center">
                    <Dog className="h-12 w-12" />
                  </div>
                )}
                <div>
                  <CardTitle className="text-2xl">{pet.nombre}</CardTitle>
                  <p className="text-sm font-semibold text-foreground/70">{pet.especie} {pet.raza && `• ${pet.raza}`}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div><strong>Tamaño:</strong> {pet.tamanio || "N/A"}</div>
                <div><strong>Temperamento:</strong> {pet.temperamento || "N/A"}</div>
                <div><strong>Nacimiento:</strong> {pet.fechaNacimiento ? new Date(pet.fechaNacimiento).toLocaleDateString() : "N/A"}</div>
                <div><strong>Alergias:</strong> {pet.alergiasConocidas || "Ninguna"}</div>
              </div>
              {pet.carnetVacunas && (
                <div className="mt-4 p-3 bg-secondary/50 rounded-xl border-2 border-foreground">
                  <p className="text-sm font-extrabold flex items-center gap-2"><FileText className="h-4 w-4" /> Carnet de Vacunas</p>
                  <a href={getImageUrl(pet.carnetVacunas) || '#'} target="_blank" className="text-xs text-info font-bold hover:underline">Ver documento</a>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Historial de Servicios ({pet.citas?.length || 0})</CardTitle></CardHeader>
            <CardContent>
              {!pet.citas || pet.citas.length === 0 ? (
                <p className="text-sm text-foreground/50">Sin servicios registrados</p>
              ) : (
                <div className="space-y-3">
                  {pet.citas.map((cita) => (
                    <div key={cita.id} className="p-4 border-2 border-foreground rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span className="font-extrabold">{new Date(cita.fechaHoraInicio).toLocaleDateString()}</span>
                          <Clock className="h-4 w-4 ml-2" />
                          <span>{new Date(cita.fechaHoraInicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <Badge>{cita.estado}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Scissors className="h-4 w-4" />
                        <span>{cita.servicio.nombre}</span>
                      </div>
                      {cita.fichaGrooming?.fotos && cita.fichaGrooming.fotos.length > 0 && (
                        <div className="flex gap-2 mt-3">
                          {cita.fichaGrooming.fotos.map((foto, i) => (
                            <img key={i} src={getImageUrl(foto.urlFoto) || ''} alt={foto.tipo} className="w-20 h-20 object-cover rounded-xl border-2 border-foreground" />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}