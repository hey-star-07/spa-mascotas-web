"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";  // 👈 ASEGURAR ESTA IMPORTACIÓN
import { useAuthStore } from "@/store/auth-store";
import api from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { UserProfile } from "@/types/user.types";
import { formatDate } from "@/lib/utils";
import { Mail, Phone, Shield, Clock, KeyRound, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Contraseña actual requerida"),
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

type PasswordFormData = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const router = useRouter();  // 👈 DE next/navigation

  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const loadProfile = async () => {
    setLoading(true);
    setError(false);
    try {
      const { data } = await api.get("/auth/me");
      setProfile(data.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProfile(); }, []);

  const onChangePassword = async (data: PasswordFormData) => {
    setChangingPassword(true);
    try {
      await api.post("/auth/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success("Contraseña cambiada exitosamente");
      setShowChangePassword(false);
      reset();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al cambiar contraseña");
    } finally {
      setChangingPassword(false);
    }
  };

  const goToSetup2FA = () => {
    router.push("/profile/setup-2fa");  // 👈 Esto funciona con next/navigation
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-12 w-64" /><Skeleton className="h-32 w-full" /></div>;
  if (error) return <ErrorState onRetry={loadProfile} />;
  if (!profile) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold">Mi Perfil</h1>

      {/* Datos personales */}
      <Card>
        <CardHeader>
          <CardTitle>Información Personal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border-3 border-foreground bg-accent p-3">
              <span className="text-2xl font-extrabold">{profile.nombre.charAt(0)}{profile.apellido?.charAt(0)}</span>
            </div>
            <div>
              <h3 className="text-xl font-extrabold">{profile.nombre} {profile.apellido}</h3>
              <Badge variant="info">{profile.rol}</Badge>
            </div>
          </div>
          <div className="grid gap-3">
            <div className="flex items-center gap-2 text-base font-semibold"><Mail className="h-5 w-5" />{profile.email}</div>
            {profile.telefono && <div className="flex items-center gap-2 text-base font-semibold"><Phone className="h-5 w-5" />{profile.telefono}</div>}
            <div className="flex items-center gap-2 text-base font-semibold"><Shield className="h-5 w-5" />{profile.twoFactorEnabled ? "2FA Activado" : "2FA Desactivado"}</div>
            <div className="flex items-center gap-2 text-base font-semibold"><Clock className="h-5 w-5" />Creado: {formatDate(profile.createdAt)}</div>
          </div>
        </CardContent>
      </Card>

      {/* Activar 2FA - Solo Cliente sin 2FA */}
      {profile.rol === "Cliente" && !profile.twoFactorEnabled && (
        <Card>
          <CardHeader>
            <CardTitle>Seguridad Avanzada</CardTitle>
            <CardDescription>Protege tu cuenta con autenticación de dos factores (2FA)</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={goToSetup2FA}>
              <Shield className="mr-2 h-4 w-4" />
              Activar 2FA
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 2FA ya activado */}
      {profile.twoFactorEnabled && (
        <Card>
          <CardHeader>
            <CardTitle>Autenticación de Dos Factores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-base font-semibold text-primary">
              <Shield className="h-5 w-5" />
              2FA Activado - Tu cuenta está protegida
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cambiar contraseña */}
      <Card>
        <CardHeader>
          <CardTitle>Seguridad</CardTitle>
          <CardDescription>Cambia tu contraseña periódicamente</CardDescription>
        </CardHeader>
        <CardContent>
          {!showChangePassword ? (
            <Button onClick={() => setShowChangePassword(true)} variant="outline">
              <KeyRound className="mr-2 h-4 w-4" />
              Cambiar Contraseña
            </Button>
          ) : (
            <form onSubmit={handleSubmit(onChangePassword)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="currentPassword">Contraseña Actual</Label>
                <Input id="currentPassword" type="password" {...register("currentPassword")} />
                {errors.currentPassword && <p className="text-xs font-semibold text-rose">{errors.currentPassword.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="newPassword">Nueva Contraseña</Label>
                <div className="relative">
                  <Input id="newPassword" type={showPass ? "text" : "password"} {...register("newPassword")} />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2">
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.newPassword && <p className="text-xs font-semibold text-rose">{errors.newPassword.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Repetir Nueva Contraseña</Label>
                <Input id="confirmPassword" type="password" {...register("confirmPassword")} />
                {errors.confirmPassword && <p className="text-xs font-semibold text-rose">{errors.confirmPassword.message}</p>}
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={changingPassword}>
                  {changingPassword ? "Cambiando..." : "Guardar Nueva Contraseña"}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setShowChangePassword(false); reset(); }}>
                  Cancelar
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}