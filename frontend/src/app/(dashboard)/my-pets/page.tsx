"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { PawPrintIcon } from "@/components/shared/paw-print-icon";
import { getImageUrl } from "@/lib/images";
import { Plus, Edit, Trash2, Calendar, Dog } from "lucide-react";
import { toast } from "sonner";

interface Pet {
  id: number;
  nombre: string;
  especie: string;
  raza: string | null;
  tamanio: string | null;
  temperamento: string | null;
  fechaNacimiento: string | null;
  imagen: string | null;
}

export default function MyPetsPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPets = async () => {
    try {
      const { data } = await api.get("/pets");
      setPets(data.data || []);
    } catch { toast.error("Error al cargar mascotas"); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadPets(); }, []);

  const handleDelete = async (id: number, nombre: string) => {
    if (!confirm(`¿Eliminar a ${nombre}?`)) return;
    try {
      await api.delete(`/pets/${id}`);
      toast.success("Mascota eliminada");
      loadPets();
    } catch { toast.error("Error al eliminar"); }
  };

  if (loading) return <LoadingSpinner text="Cargando mascotas..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PawPrintIcon size={32} variant="primary" />
          <h1 className="text-3xl font-extrabold">Mis Mascotas</h1>
        </div>
        <Link href="/my-pets/new">
          <Button><Plus className="mr-2 h-4 w-4" /> Nueva Mascota</Button>
        </Link>
      </div>

      {pets.length === 0 ? (
        <EmptyState
          icon={<Dog className="h-16 w-16" />}
          title="No tienes mascotas"
          description="Registra tu primera mascota para comenzar"
          action={
            <Link href="/my-pets/new">
              <Button><Plus className="mr-2 h-4 w-4" /> Registrar Mascota</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pets.map((pet) => (
            <Card key={pet.id} className="hover:shadow-cartoon-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all overflow-hidden">
              {/* Foto de la mascota */}
              <div className="h-48 bg-secondary flex items-center justify-center border-b-3 border-foreground">
                {pet.imagen ? (
                  <img src={getImageUrl(pet.imagen) || '/paw-print.svg'} alt={pet.nombre} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-foreground/40">
                    <Dog className="h-16 w-16" strokeWidth={2} />
                    <span className="text-xs font-semibold">Sin foto</span>
                  </div>
                )}
              </div>
              
              <CardContent className="pt-4 space-y-3">
                {/* Nombre y datos */}
                <div>
                  <h3 className="text-xl font-extrabold">{pet.nombre}</h3>
                  <p className="text-sm font-semibold text-foreground/70">
                    {pet.especie} {pet.raza && `• ${pet.raza}`}
                  </p>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  {pet.tamanio && <Badge variant="secondary">{pet.tamanio}</Badge>}
                  {pet.temperamento && <Badge variant="outline">{pet.temperamento}</Badge>}
                  {pet.fechaNacimiento && (
                    <Badge variant="default">{new Date(pet.fechaNacimiento).toLocaleDateString()}</Badge>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex gap-2 pt-2 border-t-2 border-foreground/20">
                  <Link href={`/my-pets/${pet.id}`} className="flex-1">
                    <Button size="sm" variant="outline" className="w-full">
                      <Edit className="h-3 w-3 mr-1" /> Detalle
                    </Button>
                  </Link>
                  <Link href={`/my-appointments/new?petId=${pet.id}`} className="flex-1">
                    <Button size="sm" variant="secondary" className="w-full">
                      <Calendar className="h-3 w-3 mr-1" /> Cita
                    </Button>
                  </Link>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(pet.id, pet.nombre)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}