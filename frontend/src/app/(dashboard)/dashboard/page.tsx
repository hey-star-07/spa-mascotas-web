"use client";

import { useAuthStore } from "@/store/auth-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PawPrintIcon } from "@/components/shared/paw-print-icon";
import { Calendar, Users, ShoppingBag, TrendingUp } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuthStore();

  const stats = [
    { label: "Citas Hoy", value: "12", icon: Calendar, color: "primary" as const },
    { label: "Clientes", value: "156", icon: Users, color: "secondary" as const },
    { label: "Productos", value: "45", icon: ShoppingBag, color: "accent" as const },
    { label: "Ingresos", value: "Bs. 2,450", icon: TrendingUp, color: "lavender" as const },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <PawPrintIcon size={36} variant="primary" />
        <div>
          <h1 className="text-3xl font-extrabold">
            Bienvenido, {user?.nombre}
          </h1>
          <p className="text-base font-semibold text-foreground/70">
            <Badge variant="info">{user?.rol}</Badge>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="hover:shadow-cartoon-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
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
    </div>
  );
}