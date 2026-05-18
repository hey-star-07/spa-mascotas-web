"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

export default function Setup2FAPage() {
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingSetup, setLoadingSetup] = useState(true);
  const router = useRouter();
  const { setAuth, user } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CodeFormData>({
    resolver: zodResolver(codeSchema),
  });

  useEffect(() => {
    const tempToken = localStorage.getItem("tempToken");
    if (!tempToken) {
      toast.error("Sesión no válida. Inicia sesión de nuevo.");
      router.push("/login");
      return;
    }

    // Usar el token temporal para configurar 2FA
    api.defaults.headers.common["Authorization"] = `Bearer ${tempToken}`;
    setupTwoFactor();
  }, []);

  const setupTwoFactor = async () => {
    try {
      const response = await api.post("/auth/setup-2fa");
      setQrCode(response.data.data.qrCode);
      setSecret(response.data.data.secret);
      setLoadingSetup(false);
    } catch (error: any) {
      toast.error("Error al configurar 2FA. Inicia sesión de nuevo.");
      router.push("/login");
    }
  };

  const onSubmit = async (data: CodeFormData) => {
    setLoading(true);
    try {
      // Activar 2FA
      await api.post("/auth/enable-2fa", { secret, code: data.code });

      // Ahora hacer login completo
      const loginData = JSON.parse(localStorage.getItem("tempLoginData") || "{}");
      if (loginData.email && loginData.password) {
        const loginResponse = await api.post("/auth/login", {
          email: loginData.email,
          password: loginData.password,
        });

        const { user, accessToken, refreshToken } = loginResponse.data.data;
        setAuth(user, accessToken, refreshToken);
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        localStorage.removeItem("tempToken");
        localStorage.removeItem("tempLoginData");
      }

      toast.success("2FA configurado exitosamente");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error("Código inválido. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (loadingSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="Configurando seguridad..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center justify-center w-10 h-10 rounded-full border-3 border-foreground bg-rose text-sm font-extrabold">
              !
            </span>
          </div>
          <CardTitle>Configuración de Seguridad Obligatoria</CardTitle>
          <CardDescription>
            Como miembro del personal, debes activar la autenticación de dos factores (2FA) para continuar.
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
                    <li>Abre Google Authenticator en tu teléfono</li>
                    <li>Toca el botón + para agregar una cuenta</li>
                    <li>Escanea el código QR</li>
                    <li>Ingresa el código de 6 dígitos</li>
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
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading || !qrCode}>
              <Shield className="mr-2 h-5 w-5" />
              {loading ? "Verificando..." : "Activar 2FA y Continuar"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}