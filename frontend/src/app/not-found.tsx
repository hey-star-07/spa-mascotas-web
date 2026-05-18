import Link from "next/link";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-8xl font-extrabold mb-4">404</h1>
        <h2 className="text-2xl font-extrabold mb-4">Página no encontrada</h2>
        <p className="text-base font-semibold text-foreground/70 mb-8">
          La página que buscas no existe o fue movida
        </p>
        <Link href="/">
          <Button variant="primary">
            <Home className="mr-2 h-5 w-5" />
            Volver al inicio
          </Button>
        </Link>
      </div>
    </div>
  );
}