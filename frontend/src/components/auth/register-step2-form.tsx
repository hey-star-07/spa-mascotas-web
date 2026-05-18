"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { registerStep2Schema, RegisterStep2Data } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface RegisterStep2FormProps {
  onComplete: (data: RegisterStep2Data) => void;
  onBack: () => void;
  isLastStep?: boolean;
  loading?: boolean; 
}

export function RegisterStep2Form({ onComplete, onBack }: RegisterStep2FormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterStep2Data>({
    resolver: zodResolver(registerStep2Schema),
  });

  const onSubmit = (data: RegisterStep2Data) => {
    onComplete(data);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <span className="flex items-center justify-center w-8 h-8 rounded-full border-3 border-foreground bg-secondary text-sm font-extrabold">
            2
          </span>
          <span className="text-sm font-bold text-foreground/50">de 3 pasos</span>
        </div>
        <CardTitle>Datos Personales</CardTitle>
        <CardDescription>Paso 2: Información de contacto</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="ci">CI (Cédula de Identidad) *</Label>
            <Input id="ci" placeholder="12345678 LP" {...register("ci")} />
            {errors.ci && <p className="text-xs font-semibold text-rose">{errors.ci.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="telefono">Teléfono *</Label>
            <Input id="telefono" placeholder="+591 77777777" {...register("telefono")} />
            {errors.telefono && <p className="text-xs font-semibold text-rose">{errors.telefono.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="direccion">Dirección *</Label>
            <Input id="direccion" placeholder="Calle Los Pinos #123, La Paz" {...register("direccion")} />
            {errors.direccion && <p className="text-xs font-semibold text-rose">{errors.direccion.message}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex gap-3">
          <Button type="button" variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Atrás
          </Button>
          <Button type="submit" className="flex-1">
            Siguiente
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}