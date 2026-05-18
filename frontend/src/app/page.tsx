import Link from "next/link";
import { PawPrint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex rounded-2xl border-3 border-foreground bg-primary p-4 shadow-cartoon mb-6">
            <PawPrint size={64} className="text-foreground" strokeWidth={3} />
          </div>
          <h1 className="text-6xl font-extrabold mb-4">
            Pet Spa
          </h1>
          <p className="text-xl font-bold text-foreground/70 max-w-2xl mx-auto">
            Sistema de gestión integral para tu Pet Spa & Grooming.
            Administra citas, clientes, productos y mucho más.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
          {[
            { title: "Gestión de Citas", description: "Agenda y controla todas las citas de grooming" },
            { title: "Clientes y Mascotas", description: "Registra clientes y sus mascotas con historial completo" },
            { title: "Venta de Productos", description: "Catálogo de productos con carrito y facturación" },
          ].map((feature) => (
            <Card key={feature.title} className="text-center">
              <CardContent className="pt-6">
                <h3 className="text-lg font-extrabold mb-2">{feature.title}</h3>
                <p className="text-sm font-semibold text-foreground/70">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/login">
            <Button size="lg" className="w-full sm:w-auto">
              Iniciar Sesión
            </Button>
          </Link>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="w-full sm:w-auto">
              Registrarse
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}