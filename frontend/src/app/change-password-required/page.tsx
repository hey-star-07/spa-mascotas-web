"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { KeyRound, Eye, EyeOff } from "lucide-react";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordStrengthMeter } from "@/components/auth/password-strength-meter";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { toast } from "sonner";

const schema = z.object({
  newPassword: z.string().min(8, "Mínimo 8 caracteres")
    .regex(/[A-Z]/, "Debe contener mayúscula")
    .regex(/[a-z]/, "Debe contener minúscula")
    .regex(/[0-9]/, "Debe contener número")
    .regex(/[!@#$%^&*]/, "Debe contener símbolo"),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

export default function ChangePasswordRequiredPage() {
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const password = watch("newPassword", "");

  useEffect(() => {
    // Verificar que hay un token temporal
    const tempToken = localStorage.getItem("tempToken");
    if (!tempToken) {
      toast.error("No tienes permisos para acceder a esta página");
      router.push("/login");
      return;
    }
    setChecking(false);
  }, []);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const tempToken = localStorage.getItem("tempToken");
      
      // Cambiar contraseña usando el token temporal
      await api.post("/auth/change-password-temporal", {
        newPassword: data.newPassword,
      }, {
        headers: { Authorization: `Bearer ${tempToken}` }
      });

      // Limpiar token temporal
      localStorage.removeItem("tempToken");
      
      toast.success("¡Contraseña cambiada exitosamente! Ahora inicia sesión con tu nueva contraseña.");
      router.push("/login");
    } catch (error: any) {
      const message = error.response?.data?.message || "Error al cambiar contraseña";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner text="Verificando..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center justify-center w-10 h-10 rounded-full border-3 border-foreground bg-accent text-sm font-extrabold">!</span>
          </div>
          <CardTitle>Cambio de Contraseña Obligatorio</CardTitle>
          <CardDescription>
            Debes cambiar tu contraseña temporal, de lo contrario tu cuenta será bloqueada.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">Nueva Contraseña</Label>
              <div className="relative">
                <Input id="newPassword" type={showPass ? "text" : "password"} placeholder="••••••••" {...register("newPassword")} />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <PasswordStrengthMeter password={password} />
              {errors.newPassword && <p className="text-xs font-semibold text-rose">{errors.newPassword.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Repetir Nueva Contraseña</Label>
              <Input id="confirmPassword" type="password" placeholder="••••••••" {...register("confirmPassword")} />
              {errors.confirmPassword && <p className="text-xs font-semibold text-rose">{errors.confirmPassword.message}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              <KeyRound className="mr-2 h-5 w-5" />
              {loading ? "Cambiando..." : "Cambiar Contraseña"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}