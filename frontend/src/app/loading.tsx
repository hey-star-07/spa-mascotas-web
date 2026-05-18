import { LoadingSpinner } from "@/components/shared/loading-spinner";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <LoadingSpinner size="lg" text="Cargando..." />
    </div>
  );
}