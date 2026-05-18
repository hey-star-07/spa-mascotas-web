"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
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

interface RegisterStep32FAProps {
  step1Data: { email: string; password: string; nombre: string; apellido?: string };
  step2Data: { ci: string; telefono: string; direccion: string };
  onBack: () => void;
  isGoogleAuth?: boolean;  // 👈 NUEVO
}

export function RegisterStep32FA({ step1Data, step2Data, onBack, isGoogleAuth = false }: RegisterStep32FAProps) {
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingSetup, setLoadingSetup] = useState(true);
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CodeFormData>({
    resolver: zodResolver(codeSchema),
  });

  useEffect(() => {
    setup2FA();
  }, []);

  const setup2FA = async () => {
    try {
      if (!isGoogleAuth) {
        // FLUJO NORMAL: actualizar datos + login
        await api.put("/users/profile", {
          telefono: step2Data.telefono,
        });

        const loginResponse = await api.post("/auth/login", {
          email: step1Data.email,
          password: step1Data.password,
        });

        const { accessToken, user } = loginResponse.data.data;
        localStorage.setItem("accessToken", accessToken);

        if (user && !user.emailVerificado) {
          toast.error("Debes verificar tu email antes de continuar");
          onBack();
          setLoadingSetup(false);
          return;
        }
      } else {
        // FLUJO GOOGLE: ya tenemos token guardado, solo actualizar perfil
        await api.put("/users/profile", {
          telefono: step2Data.telefono,
        });
      }

      // Configurar 2FA (obtener QR)
      const twoFAResponse = await api.post("/auth/setup-2fa");
      setQrCode(twoFAResponse.data.data.qrCode);
      setSecret(twoFAResponse.data.data.secret);
      setLoadingSetup(false);
    } catch (error: any) {
      const message = error.response?.data?.message || "Error al configurar 2FA";
      toast.error(message);
      setLoadingSetup(false);
    }
  };

  const onSubmit = async (data: CodeFormData) => {
    setLoading(true);
    try {
      await api.post("/auth/enable-2fa", { secret, code: data.code });

      const meResponse = await api.get("/auth/me");
      const accessToken = localStorage.getItem("accessToken") || "";
      const refreshToken = localStorage.getItem("refreshToken") || "";
      setAuth(meResponse.data.data, accessToken, refreshToken);

      toast.success(isGoogleAuth ? "¡Registro completado!" : "¡Registro completado exitosamente!");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error("Código inválido. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (loadingSetup) {
    return (
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" text={isGoogleAuth ? "Configurando seguridad..." : "Verificando email y configurando..."} />
        {!isGoogleAuth && (
          <p className="text-sm text-foreground/50 font-semibold">
            Asegúrate de haber verificado tu email (revisa tu bandeja de entrada)
          </p>
        )}
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <span className="flex items-center justify-center w-8 h-8 rounded-full border-3 border-foreground bg-lavender text-sm font-extrabold">
            {isGoogleAuth ? "2" : "4"}
          </span>
          <span className="text-sm font-bold text-foreground/50">
            de {isGoogleAuth ? "2" : "4"} pasos
          </span>
        </div>
        <CardTitle>Activar Seguridad</CardTitle>
        <CardDescription>
          Escanea el QR con Google Authenticator e ingresa el código de 6 dígitos
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {qrCode ? (
            <>
              <div className="flex justify-center">
                <div className="rounded-2xl border-3 border-foreground bg-white p-4 shadow-cartoon">
                  <img src={qrCode} alt="QR 2FA" className="w-48 h-48" />
                </div>
              </div>
              <div className="bg-secondary rounded-xl border-2 border-foreground p-3 text-xs font-semibold">
                <p className="font-extrabold mb-1">Instrucciones:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Abre Google Authenticator</li>
                  <li>Toca + para agregar cuenta</li>
                  <li>Escanea el código QR</li>
                  <li>Ingresa los 6 dígitos</li>
                </ol>
              </div>
            </>
          ) : (
            <div className="flex justify-center py-8">
              <LoadingSpinner text="Generando QR..." />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="code">Código de verificación</Label>
            <Input
              id="code"
              placeholder="000000"
              className="text-center text-2xl tracking-widest"
              maxLength={6}
              {...register("code")}
            />
            {errors.code && (
              <p className="text-xs font-semibold text-rose">{errors.code.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex gap-3">
          <Button type="button" variant="outline" onClick={onBack}>
            Atrás
          </Button>
          <Button type="submit" className="flex-1" disabled={loading || !qrCode}>
            <Shield className="mr-2 h-5 w-5" />
            {loading ? "Verificando..." : "Activar y Finalizar"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}