"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { forgotPasswordSchema, ForgotPasswordFormData } from "@/lib/validators";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", data);
      setSent(true);
      toast.success("Instrucciones enviadas a tu email");
    } catch (error: any) {
      toast.error("Error al enviar instrucciones");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-primary mb-4" strokeWidth={3} />
          <CardTitle className="mb-2">Email Enviado</CardTitle>
          <CardDescription>
            Si el email existe, recibirás instrucciones para restablecer tu contraseña.
          </CardDescription>
          <Link href="/login" className="mt-4 inline-block text-info font-bold hover:underline">
            Volver al inicio de sesión
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Recuperar Contraseña</CardTitle>
        <CardDescription>Ingresa tu email y te enviaremos instrucciones</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="tu@email.com" {...register("email")} />
            {errors.email && (
              <p className="text-sm font-semibold text-rose">{errors.email.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-4">
          <Button type="submit" className="w-full" disabled={loading}>
            <Mail className="mr-2 h-5 w-5" />
            {loading ? "Enviando..." : "Enviar Instrucciones"}
          </Button>
          <Link href="/login" className="text-sm font-bold text-info hover:underline flex items-center gap-1">
            <ArrowLeft size={16} />
            Volver al inicio de sesión
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}