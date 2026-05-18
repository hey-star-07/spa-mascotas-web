"use client";

import { Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8" strokeWidth={3} />
        <h1 className="text-3xl font-extrabold">Configuración</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Preferencias</CardTitle>
          <CardDescription>Próximamente: Configuración de notificaciones, 2FA y más</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold text-foreground/50">Módulo en desarrollo...</p>
        </CardContent>
      </Card>
    </div>
  );
}