"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { registerStep1Schema, RegisterStep1Data } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordStrengthMeter } from "./password-strength-meter";
import { toast } from "sonner";
import api from "@/lib/axios"; // 👈 AGREGAR

interface RegisterFormProps {
  onComplete: (data: RegisterStep1Data) => void;
}

export function RegisterForm({ onComplete }: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);  // 👈 AGREGAR

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterStep1Data>({
    resolver: zodResolver(registerStep1Schema),
  });

  const password = watch("password", "");

  const onSubmit = async (data: RegisterStep1Data) => {  // 👈 HACER ASYNC
    setLoading(true);  // 👈 AGREGAR
    try {
      // 👇 REGISTRAR AL CLIENTE EN EL BACKEND (envía el código al email)
      await api.post("/auth/register/client", {
        email: data.email,
        password: data.password,
        nombre: data.nombre,
        apellido: data.apellido,
      });

      toast.success("Código de verificación enviado a tu email");
      onComplete(data);  // 👈 Avanzar al paso 2 (verificar código)
    } catch (error: any) {
      const message = error.response?.data?.message || "Error al registrarse";
      toast.error(message);
    } finally {
      setLoading(false);  // 👈 AGREGAR
    }
  };

  const handleGoogleRegister = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <span className="flex items-center justify-center w-8 h-8 rounded-full border-3 border-foreground bg-primary text-sm font-extrabold">
            1
          </span>
          <span className="text-sm font-bold text-foreground/50">de 3 pasos</span>
        </div>
        <CardTitle>Crear Cuenta</CardTitle>
        <CardDescription>Paso 1: Datos de acceso</CardDescription>
      </CardHeader>

      {/* Botón Google */}
      <Button
        type="button"
        variant="outline"
        className="w-full mb-2 mx-6"
        onClick={handleGoogleRegister}
      >
        <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Acceder con Google
      </Button>

      <div className="relative mx-6">
        <Separator className="my-1" />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xs font-bold text-foreground/50">
          o con email
        </span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-3 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" placeholder="Juan" {...register("nombre")} disabled={loading} />
              {errors.nombre && <p className="text-xs font-semibold text-rose">{errors.nombre.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="apellido">Apellido</Label>
              <Input id="apellido" placeholder="Pérez" {...register("apellido")} disabled={loading} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="tu@email.com" {...register("email")} disabled={loading} />
            {errors.email && <p className="text-xs font-semibold text-rose">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" {...register("password")} disabled={loading} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" tabIndex={-1}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <PasswordStrengthMeter password={password} />
            {errors.password && <p className="text-xs font-semibold text-rose">{errors.password.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Repetir Contraseña</Label>
            <div className="relative">
              <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" {...register("confirmPassword")} disabled={loading} />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" tabIndex={-1}>
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>
            {errors.confirmPassword && <p className="text-xs font-semibold text-rose">{errors.confirmPassword.message}</p>}
          </div>
        </CardContent>

        <CardFooter>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Registrando..." : "Siguiente"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}