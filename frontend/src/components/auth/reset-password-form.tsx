"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { resetPasswordSchema, ResetPasswordFormData } from "@/lib/validators";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordStrengthMeter } from "./password-strength-meter";
import { toast } from "sonner";

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const password = watch("newPassword", "");

  const onSubmit = async (data: ResetPasswordFormData) => {
    setLoading(true);
    try {
      await api.post(`/auth/reset-password/${token}`, {
        newPassword: data.newPassword,
      });
      toast.success("Contraseña restablecida exitosamente");
      router.push("/login");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al restablecer contraseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Nueva Contraseña</CardTitle>
        <CardDescription>Elige una contraseña segura</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nueva Contraseña</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                {...register("newPassword")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <PasswordStrengthMeter password={password} />
            {errors.newPassword && (
              <p className="text-sm font-semibold text-rose">{errors.newPassword.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-sm font-semibold text-rose">{errors.confirmPassword.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={loading}>
            <KeyRound className="mr-2 h-5 w-5" />
            {loading ? "Restableciendo..." : "Restablecer Contraseña"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}