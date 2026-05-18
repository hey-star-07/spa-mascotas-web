import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Algo salió mal",
  message = "Ocurrió un error inesperado. Por favor intenta de nuevo.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="rounded-full border-3 border-foreground bg-rose/30 p-6 mb-4">
        <AlertCircle className="h-12 w-12 text-foreground" strokeWidth={3} />
      </div>
      <h3 className="text-xl font-extrabold mb-2">{title}</h3>
      <p className="text-base text-foreground/70 mb-6 text-center max-w-md">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          Intentar de nuevo
        </Button>
      )}
    </div>
  );
}