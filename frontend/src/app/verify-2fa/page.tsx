"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Shield } from "lucide-react";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { toast } from "sonner";

const codeSchema = z.object({
  code: z.string().length(6, "El código debe tener 6 dígitos"),
});

type CodeFormData = z.infer<typeof codeSchema>;

function Verify2FAContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CodeFormData>({
    resolver: zodResolver(codeSchema),
  });

  useEffect(() => {
    if (!token) {
      router.push("/login");
    }
  }, [token]);

  const onSubmit = async (data: CodeFormData) => {
    setLoading(true);
    try {
      // Verificar 2FA usando el token temporal
      const response = await api.post("/auth/verify-2fa-token", {
        token,
        code: data.code,
      });

      const { user, accessToken, refreshToken } = response.data.data;
      setAuth(user, accessToken, refreshToken);
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);

      toast.success("Inicio de sesión exitoso");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Código inválido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="rounded-xl border-3 border-foreground bg-lavender p-2">
              <Shield className="h-6 w-6" strokeWidth={3} />
            </div>
          </div>
          <CardTitle>Verificación de Dos Factores</CardTitle>
          <CardDescription>
            Ingresa el código de Google Authenticator para continuar con tu inicio de sesión.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="bg-secondary rounded-xl border-2 border-foreground p-3 text-xs font-semibold text-center">
              Abre tu app de autenticación y busca el código para Pet Spa.
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="code">Código de 6 dígitos</Label>
              <Input
                id="code"
                placeholder="000000"
                className="text-center text-2xl tracking-widest"
                maxLength={6}
                {...register("code")}
                autoFocus
              />
              {errors.code && <p className="text-xs font-semibold text-rose">{errors.code.message}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              <Shield className="mr-2 h-5 w-5" />
              {loading ? "Verificando..." : "Verificar e Iniciar Sesión"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function Verify2FAPage() {
  return (
    <Suspense fallback={<LoadingSpinner text="Cargando..." />}>
      <Verify2FAContent />
    </Suspense>
  );
}