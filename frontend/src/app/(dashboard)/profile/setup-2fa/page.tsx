"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Shield, ArrowLeft } from "lucide-react";
import api from "@/lib/axios";
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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CodeFormData>({
    resolver: zodResolver(codeSchema),
  });

  useEffect(() => {
    setupTwoFactor();
  }, []);

  const setupTwoFactor = async () => {
    try {
      const response = await api.post("/auth/setup-2fa");
      setQrCode(response.data.data.qrCode);
      setSecret(response.data.data.secret);
      setLoadingSetup(false);
    } catch (error: any) {
      toast.error("Error al configurar 2FA");
      router.push("/profile");
    }
  };

  const onSubmit = async (data: CodeFormData) => {
    setLoading(true);
    try {
      await api.post("/auth/enable-2fa", { secret, code: data.code });
      toast.success("2FA activado exitosamente");
      router.push("/profile");
    } catch (error: any) {
      toast.error("Código inválido");
    } finally {
      setLoading(false);
    }
  };

  if (loadingSetup) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" text="Generando QR..." />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <Button variant="ghost" onClick={() => router.push("/profile")} className="mb-2">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver al perfil
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Activar 2FA</CardTitle>
          <CardDescription>
            Escanea el QR con Google Authenticator
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {qrCode && (
              <>
                <div className="flex justify-center">
                  <div className="rounded-2xl border-3 border-foreground bg-white p-4 shadow-cartoon">
                    <img src={qrCode} alt="QR 2FA" className="w-48 h-48" />
                  </div>
                </div>
                <div className="bg-secondary rounded-xl border-2 border-foreground p-3 text-xs font-semibold">
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Abre Google Authenticator</li>
                    <li>Toca + para agregar cuenta</li>
                    <li>Escanea el código QR</li>
                    <li>Ingresa los 6 dígitos</li>
                  </ol>
                </div>
              </>
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
              {errors.code && <p className="text-xs font-semibold text-rose">{errors.code.message}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              <Shield className="mr-2 h-5 w-5" />
              {loading ? "Verificando..." : "Activar 2FA"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}