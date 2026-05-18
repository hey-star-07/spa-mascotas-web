"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { QrCode, Key, Shield, Copy, Check } from "lucide-react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { toast } from "sonner";

const twoFactorCodeSchema = z.object({
  code: z.string().length(6, "El código debe tener 6 dígitos"),
});

type TwoFactorCodeForm = z.infer<typeof twoFactorCodeSchema>;

export function TwoFactorSetup() {
  const [step, setStep] = useState<"loading" | "setup" | "verify">("loading");
  const [secret, setSecret] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TwoFactorCodeForm>({
    resolver: zodResolver(twoFactorCodeSchema),
  });

  useEffect(() => {
    loadSetup();
  }, []);

  const loadSetup = async () => {
    try {
      const { data } = await api.post("/auth/setup-2fa");
      setSecret(data.data.secret);
      setQrCode(data.data.qrCode);
      setRecoveryCodes(data.data.recoveryCodes);
      setStep("setup");
    } catch (error: any) {
      toast.error("Error al configurar 2FA");
    }
  };

  const onSubmit = async (formData: TwoFactorCodeForm) => {
    try {
      await api.post("/auth/enable-2fa", {
        secret,
        code: formData.code,
      });
      toast.success("2FA activado exitosamente");
      setStep("verify");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Código inválido");
    }
  };

  const copyToClipboard = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    toast.success("Código copiado");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (step === "loading") {
    return <LoadingSpinner text="Configurando 2FA..." />;
  }

  if (step === "verify") {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center">
          <div className="rounded-full border-3 border-foreground bg-primary p-4 inline-flex mb-4">
            <Shield className="h-12 w-12" strokeWidth={3} />
          </div>
          <CardTitle className="mb-2">2FA Activado</CardTitle>
          <CardDescription>
            La autenticación de dos factores está activa. Guarda tus códigos de recuperación.
          </CardDescription>
          <div className="mt-4 p-4 rounded-xl border-3 border-foreground bg-secondary">
            <p className="text-sm font-extrabold mb-2">Códigos de recuperación:</p>
            <div className="grid grid-cols-2 gap-2">
              {recoveryCodes.map((code, i) => (
                <code key={i} className="text-sm font-mono font-bold bg-white px-2 py-1 rounded border-2 border-foreground">
                  {code}
                </code>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Configurar 2FA</CardTitle>
        <CardDescription>
          Escanea el código QR con Google Authenticator
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <div className="rounded-2xl border-3 border-foreground bg-white p-4 shadow-cartoon">
              <img src={qrCode} alt="QR Code 2FA" className="w-48 h-48" />
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm font-semibold mb-2">O ingresa el código manualmente:</p>
            <code className="text-lg font-mono font-bold bg-secondary px-4 py-2 rounded-xl border-3 border-foreground inline-block">
              {secret}
            </code>
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Código de verificación</Label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/50" />
              <Input
                id="code"
                placeholder="000000"
                className="pl-10 text-center text-2xl tracking-widest"
                maxLength={6}
                {...register("code")}
              />
            </div>
            {errors.code && (
              <p className="text-sm font-semibold text-rose">{errors.code.message}</p>
            )}
          </div>
        </CardContent>

        <CardFooter>
          <Button type="submit" className="w-full">
            <Shield className="mr-2 h-5 w-5" />
            Activar 2FA
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}