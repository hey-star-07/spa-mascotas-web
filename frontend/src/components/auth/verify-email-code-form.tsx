"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, ArrowRight, RefreshCw } from "lucide-react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const codeSchema = z.object({
  code: z.string().length(6, "El código debe tener 6 dígitos"),
});

type CodeFormData = z.infer<typeof codeSchema>;

interface VerifyEmailCodeFormProps {
  email: string;
  nombre: string;
  onVerified: () => void;
}

export function VerifyEmailCodeForm({ email, nombre, onVerified }: VerifyEmailCodeFormProps) {
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CodeFormData>({
    resolver: zodResolver(codeSchema),
  });

  const onSubmit = async (data: CodeFormData) => {
    setLoading(true);
    try {
      const response = await api.post("/auth/verify-email-code", {
        email,
        code: data.code,
      });

      if (response.data.data.valid) {
        toast.success("Email verificado exitosamente");
        onVerified();
      } else {
        toast.error(response.data.data.message || "Código inválido");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al verificar");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await api.post("/auth/resend-verification-code", { email });
      toast.success("Nuevo código enviado a tu email");
    } catch (error: any) {
      toast.error("Error al reenviar código");
    } finally {
      setResending(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <span className="flex items-center justify-center w-8 h-8 rounded-full border-3 border-foreground bg-secondary text-sm font-extrabold">
            2
          </span>
          <span className="text-sm font-bold text-foreground/50">de 4 pasos</span>
        </div>
        <div className="flex justify-center mb-3">
          <div className="rounded-full border-3 border-foreground bg-primary/30 p-4">
            <Mail className="h-10 w-10" strokeWidth={3} />
          </div>
        </div>
        <CardTitle>Verifica tu Email</CardTitle>
        <CardDescription>
          Hemos enviado un código de 6 dígitos a <strong>{email}</strong>
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="bg-secondary rounded-xl border-2 border-foreground p-3 text-xs font-semibold text-center">
            <p>Revisa tu bandeja de entrada (y spam). El código expira en 15 minutos.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="code">Código de verificación</Label>
            <Input
              id="code"
              placeholder="000000"
              className="text-center text-2xl tracking-widest"
              maxLength={6}
              autoFocus
              {...register("code")}
            />
            {errors.code && (
              <p className="text-xs font-semibold text-rose">{errors.code.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Verificando..." : "Verificar Email"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="text-sm font-bold text-info hover:underline flex items-center gap-1"
          >
            <RefreshCw size={14} className={resending ? "animate-spin" : ""} />
            {resending ? "Reenviando..." : "Reenviar código"}
          </button>
        </CardFooter>
      </form>
    </Card>
  );
}