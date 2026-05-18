"use client";

import { useAuthStore } from "@/store/auth-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PawPrintIcon } from "@/components/shared/paw-print-icon";
import { Calendar, Scissors, Clock, Star } from "lucide-react";

export default function GroomerDashboardPage() {
  const { user } = useAuthStore();

  const stats = [
    { label: "Citas Hoy", value: "0", icon: Calendar, color: "primary" as const },
    { label: "Servicios Realizados", value: "0", icon: Scissors, color: "secondary" as const },
    { label: "Horas Trabajadas", value: "0h", icon: Clock, color: "accent" as const },
    { label: "Calificación", value: "N/A", icon: Star, color: "lavender" as const },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <PawPrintIcon size={36} variant="primary" />
        <div>
          <h1 className="text-3xl font-extrabold">Panel de Groomer</h1>
          <p className="text-base font-semibold text-foreground/70">
            Bienvenido/a, {user?.nombre} <Badge variant="info">Groomer</Badge>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-extrabold">{stat.label}</CardTitle>
              <div className={`rounded-xl border-3 border-foreground bg-${stat.color} p-2 shadow-cartoon-sm`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-extrabold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Próximas Citas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-base font-semibold text-foreground/50">No hay citas programadas para hoy</p>
        </CardContent>
      </Card>
    </div>
  );
}