"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import api from "@/lib/axios";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { PawPrintIcon } from "@/components/shared/paw-print-icon";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle, Loader2 } from "lucide-react";

const completeProfileSchema = z.object({
  nombre: z.string().min(2, "Mínimo 2 caracteres"),
  apellido: z.string().optional(),
  telefono: z.string().min(1, "Teléfono requerido"),
  ci: z.string().min(1, "CI requerido"),
  direccion: z.string().min(1, "Dirección requerida"),
});

type CompleteProfileFormData = z.infer<typeof completeProfileSchema>;

function CompleteProfileContent() {
  const searchParams = useSearchParams();
  const googleDataParam = searchParams.get("googleData");
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [googleData, setGoogleData] = useState<{ email: string; nombre: string; apellido: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompleteProfileFormData>({
    resolver: zodResolver(completeProfileSchema),
    defaultValues: {
      nombre: "",
      apellido: "",
      telefono: "",
      ci: "",
      direccion: "",
    },
  });

  useEffect(() => {
    if (!googleDataParam) {
      router.push("/login");
      return;
    }

    try {
      const decoded = JSON.parse(atob(googleDataParam));
      setGoogleData(decoded);
    } catch {
      router.push("/login");
    }
  }, [googleDataParam]);

  // 👇 CORREGIDO: Usar nuevo endpoint /auth/register/google
  const onSubmit = async (data: CompleteProfileFormData) => {
    if (!googleData) return;
    
    setLoading(true);
    try {
      // Usar el nuevo endpoint de Google que registra y loguea en un solo paso
      const response = await api.post("/auth/register/google", {
        email: googleData.email,
        nombre: data.nombre || googleData.nombre,
        apellido: data.apellido || googleData.apellido,
        telefono: data.telefono,
        ci: data.ci,
        direccion: data.direccion,
      });

      const { user, accessToken, refreshToken } = response.data.data;
      
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      setAuth(user, accessToken, refreshToken);

      toast.success("¡Registro completado exitosamente!");
      router.push("/dashboard");
    } catch (error: any) {
      const message = error.response?.data?.message || "Error al completar el registro";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!googleData) {
    return <LoadingSpinner text="Cargando datos..." />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="flex flex-col items-center gap-6">
        <PawPrintIcon size={48} variant="primary" />

        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Completar Registro</CardTitle>
            <CardDescription>
              Verifica y completa tus datos para finalizar
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-3">
              {/* Email (no editable) */}
              <div className="space-y-1.5">
                <Label>Email (Google)</Label>
                <Input value={googleData.email} disabled className="bg-secondary/50" />
              </div>

              {/* Nombre (pre-llenado de Google) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input id="nombre" defaultValue={googleData.nombre} {...register("nombre")} />
                  {errors.nombre && <p className="text-xs font-semibold text-rose">{errors.nombre.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="apellido">Apellido</Label>
                  <Input id="apellido" defaultValue={googleData.apellido} {...register("apellido")} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="telefono">Teléfono *</Label>
                <Input id="telefono" placeholder="+591 77777777" {...register("telefono")} />
                {errors.telefono && <p className="text-xs font-semibold text-rose">{errors.telefono.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="ci">CI *</Label>
                  <Input id="ci" placeholder="12345678 LP" {...register("ci")} />
                  {errors.ci && <p className="text-xs font-semibold text-rose">{errors.ci.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="direccion">Dirección *</Label>
                  <Input id="direccion" placeholder="Calle Los Pinos #123" {...register("direccion")} />
                  {errors.direccion && <p className="text-xs font-semibold text-rose">{errors.direccion.message}</p>}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando cuenta...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Finalizar Registro
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default function CompleteProfilePage() {
  return (
    <Suspense fallback={<LoadingSpinner text="Cargando..." />}>
      <CompleteProfileContent />
    </Suspense>
  );
}