"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/shared/image-upload";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

const petSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido"),
  especie: z.string().default("Canino"),
  raza: z.string().optional(),
  tamanio: z.enum(["", "Pequeño", "Mediano", "Grande", "Gigante"]).optional(),
  fechaNacimiento: z.string().optional(),
  pesoKg: z.string().optional(),
  temperamento: z.enum(["", "Tranquilo", "Jugueton", "Agresivo", "Timido", "Indiferente", "Nervioso"]).optional(),
  alergiasConocidas: z.string().optional(),
  restriccionesMedicas: z.string().optional(),
  imagen: z.string().optional(),
});

type PetFormData = z.infer<typeof petSchema>;

export default function NewPetPage() {
  const [loading, setLoading] = useState(false);
  const [imagenUrl, setImagenUrl] = useState("");
  const [carnetVacunasUrl, setCarnetVacunasUrl] = useState("");
  const router = useRouter();
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<PetFormData>({
    resolver: zodResolver(petSchema),
  });

  const onSubmit = async (data: PetFormData) => {
    setLoading(true);
    try {
      await api.post("/pets", {
        ...data,
        pesoKg: data.pesoKg ? parseFloat(data.pesoKg) : undefined,
        imagen: imagenUrl,  // 👈 Incluir imagen
        carnetVacunas: carnetVacunasUrl,
      });
      toast.success("Mascota registrada exitosamente");
      router.push("/my-pets");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al registrar");
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" /> Volver</Button>
      <Card>
        <CardHeader>
          <CardTitle>Registrar Nueva Mascota</CardTitle>
          <CardDescription>Completa los datos de tu mascota</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {/* Foto */}
            <div>
              <Label>Foto de la mascota</Label>
              <ImageUpload
                label="Subir foto"
                onUpload={(url) => setImagenUrl(url)}  // 👈 Usar estado local
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nombre *</Label>
                <Input {...register("nombre")} placeholder="Luna" />
                {errors.nombre && <p className="text-xs text-rose font-semibold">{errors.nombre.message}</p>}
              </div>
              <div>
                <Label>Especie</Label>
                <select {...register("especie")} className="w-full h-12 rounded-xl border-3 border-foreground bg-white px-4 font-bold">
                  <option value="Canino">Perro</option>
                  <option value="Felino">Gato</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Raza</Label><Input {...register("raza")} placeholder="Golden Retriever" /></div>
              <div>
                <Label>Tamaño</Label>
                <select {...register("tamanio")} className="w-full h-12 rounded-xl border-3 border-foreground bg-white px-4 font-bold">
                  <option value="">Seleccionar</option>
                  <option value="Pequeño">Pequeño</option>
                  <option value="Mediano">Mediano</option>
                  <option value="Grande">Grande</option>
                  <option value="Gigante">Gigante</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Fecha de Nacimiento</Label><Input type="date" {...register("fechaNacimiento")} /></div>
              <div><Label>Peso (kg)</Label><Input type="number" step="0.1" {...register("pesoKg")} placeholder="25.5" /></div>
            </div>
            <div>
              <Label>Temperamento</Label>
              <select {...register("temperamento")} className="w-full h-12 rounded-xl border-3 border-foreground bg-white px-4 font-bold">
                <option value="">Seleccionar</option>
                <option value="Tranquilo">Tranquilo</option>
                <option value="Jugueton">Juguetón</option>
                <option value="Agresivo">Agresivo</option>
                <option value="Nervioso">Nervioso</option>
                <option value="Timido">Tímido</option>
                <option value="Indiferente">Indiferente</option>
              </select>
            </div>
            <div><Label>Alergias conocidas</Label><Input {...register("alergiasConocidas")} placeholder="Alergia a ciertos shampoos..." /></div>
            <div><Label>Restricciones médicas</Label><Input {...register("restriccionesMedicas")} placeholder="Problemas de cadera..." /></div>
            {/* Carnet de Vacunas */}
            <div>
              <Label>Carnet de Vacunas (PDF o imagen)</Label>
              <ImageUpload
                label="Subir carnet"
                onUpload={(url) => setCarnetVacunasUrl(url)}
              />
              {carnetVacunasUrl && (
                <p className="text-xs text-primary mt-1 font-semibold">✅ Documento cargado</p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? "Guardando..." : "Registrar Mascota"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}