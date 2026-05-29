"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, UserPlus, Shield } from "lucide-react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordStrengthMeter } from "./password-strength-meter";
import { toast } from "sonner";

const registerUserSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  nombre: z.string().min(2, "Mínimo 2 caracteres"),
  apellido: z.string().optional(),
  telefono: z.string().min(1, "Teléfono requerido"),
  ci: z.string().min(1, "CI requerido"),
  direccion: z.string().min(1, "Dirección requerida"),
  rol: z.enum(["Admin", "Recepcion", "Groomer", "Cliente"], {
    errorMap: () => ({ message: "Selecciona un rol" }),
  }),
  especialidad: z.string().optional(),
  turno: z.enum(["Mañana", "Tarde", "Completo"]).optional(),
  capacidadDiaria: z.number().int().min(1).max(20).optional(),
});

type RegisterUserFormData = z.infer<typeof registerUserSchema>;

export function RegisterStaffForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<RegisterUserFormData>({
    resolver: zodResolver(registerUserSchema),
    defaultValues: { rol: "Cliente", turno: "Completo" },
  });

  const password = watch("password", "");
  const selectedRol = watch("rol", "Cliente");

  const onSubmit = async (data: RegisterUserFormData) => {
    setLoading(true);
    try {
      if (data.rol === "Cliente") {
        // Registrar como cliente
        await api.post("/auth/register/client", {
          email: data.email,
          password: data.password,
          nombre: data.nombre,
          apellido: data.apellido,
          telefono: data.telefono,
          ci: data.ci,
          direccion: data.direccion,
        });
        toast.success("Cliente registrado exitosamente");
      } else {
        // Registrar como personal (Admin, Recepcion, Groomer)
        await api.post("/auth/register/staff", {
          email: data.email,
          password: data.password,
          nombre: data.nombre,
          apellido: data.apellido,
          telefono: data.telefono,
          ci: data.ci,
          direccion: data.direccion,
          rol: data.rol,
          especialidad: data.rol === "Groomer" ? data.especialidad : undefined,
          turno: ["Admin", "Recepcion", "Groomer"].includes(data.rol) ? data.turno : undefined,
          capacidadDiaria: data.rol === "Groomer" ? data.capacidadDiaria : undefined,
        });
        toast.success(`${data.rol} registrado exitosamente. Se envió un email con sus credenciales.`);
      }
      reset();
    } catch (error: any) {
      const message = error.response?.data?.errors?.[0]?.mensaje ||
        error.response?.data?.message ||
        "Error al registrar usuario";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const isStaff = selectedRol === "Admin" || selectedRol === "Recepcion" || selectedRol === "Groomer";

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-xl border-3 border-foreground bg-lavender p-2">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <CardTitle>Registrar Usuario</CardTitle>
            <CardDescription>
              {isStaff
                ? "Registra un nuevo miembro del personal. Recibirá un email con sus credenciales."
                : "Registra un nuevo cliente en el sistema."}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {/* Rol */}
          <div className="space-y-2">
            <Label htmlFor="rol">Rol *</Label>
            <select
              id="rol"
              {...register("rol")}
              className="w-full h-12 rounded-xl border-3 border-foreground bg-white px-4 font-bold shadow-cartoon-sm focus:outline-none focus:ring-4 focus:ring-primary/50"
            >
              <option value="Cliente">Cliente</option>
              <option value="Recepcion">Recepcionista</option>
              <option value="Groomer">Groomer</option>
              <option value="Admin">Administrador</option>
            </select>
            {errors.rol && <p className="text-sm font-semibold text-rose">{errors.rol.message}</p>}
          </div>

          {/* Nombre y Apellido */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input id="nombre" placeholder="Ana" {...register("nombre")} />
              {errors.nombre && <p className="text-sm font-semibold text-rose">{errors.nombre.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="apellido">Apellido</Label>
              <Input id="apellido" placeholder="García" {...register("apellido")} />
            </div>
          </div>

          {/* Email y Teléfono */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" placeholder="usuario@email.com" {...register("email")} />
              {errors.email && <p className="text-sm font-semibold text-rose">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono *</Label>
              <Input id="telefono" placeholder="+59177777777" {...register("telefono")} />
              {errors.telefono && <p className="text-sm font-semibold text-rose">{errors.telefono.message}</p>}
            </div>
          </div>

          {/* CI y Dirección */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ci">CI *</Label>
              <Input id="ci" placeholder="12345678 LP" {...register("ci")} />
              {errors.ci && <p className="text-sm font-semibold text-rose">{errors.ci.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="direccion">Dirección *</Label>
              <Input id="direccion" placeholder="Calle Los Pinos #123" {...register("direccion")} />
              {errors.direccion && <p className="text-sm font-semibold text-rose">{errors.direccion.message}</p>}
            </div>
          </div>

          {/* Campos solo para personal */}
          {isStaff && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="turno">Turno</Label>
                <select
                  id="turno"
                  {...register("turno")}
                  className="w-full h-12 rounded-xl border-3 border-foreground bg-white px-4 font-bold shadow-cartoon-sm focus:outline-none focus:ring-4 focus:ring-primary/50"
                >
                  <option value="Mañana">Mañana (08:00 - 13:00)</option>
                  <option value="Tarde">Tarde (14:00 - 18:00)</option>
                  <option value="Completo">Completo (08:00 - 18:00)</option>
                </select>
                </div>
                {selectedRol === "Groomer" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="especialidad">Especialidad</Label>
                      <Input id="especialidad" placeholder="Corte fino, estilizado" {...register("especialidad")} />
                    </div>
                    {/* 👇 NUEVO: Capacidad diaria */}
                    <div className="space-y-2 mt-4">
                      <Label htmlFor="capacidadDiaria">Capacidad máxima de citas por día</Label>
                      <Input
                        id="capacidadDiaria"
                        type="number"
                        min="1"
                        max="20"
                        placeholder="6"
                        defaultValue="6"
                        {...register("capacidadDiaria", { valueAsNumber: true })}
                      />
                      <p className="text-xs text-foreground/50">
                        Número máximo de servicios que puede realizar al día (por defecto 6)
                      </p>
                    </div>
                  </>
                )}
            </div>
          )}

          {/* Contraseña */}
          <div className="space-y-2">
            <Label htmlFor="password">
              {isStaff ? "Contraseña Temporal *" : "Contraseña *"}
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <PasswordStrengthMeter password={password} />
            {errors.password && <p className="text-sm font-semibold text-rose">{errors.password.message}</p>}
            {isStaff && (
              <p className="text-xs text-foreground/50 font-semibold">
                Esta contraseña será enviada al email. Deberá cambiarla en 3 días.
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter>
          <Button type="submit" className="w-full" disabled={loading}>
            <UserPlus className="mr-2 h-5 w-5" />
            {loading ? "Registrando..." : `Crear ${selectedRol}`}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

 