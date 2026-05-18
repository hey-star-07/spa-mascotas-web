"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import api from "@/lib/axios";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { toast } from "sonner";

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth, user } = useAuthStore();

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");
    const error = searchParams.get("error");

    if (error || !accessToken || !refreshToken) {
      toast.error("Error al iniciar sesión con Google");
      router.push("/login");
      return;
    }

    // Guardar tokens
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);

    // Obtener datos del usuario
    api.get("/auth/me")
      .then((response) => {
        const userData = response.data.data;
        setAuth(userData, accessToken, refreshToken);
        toast.success("Inicio de sesión con Google exitoso");
        router.push("/dashboard");
      })
      .catch(() => {
        toast.error("Error al obtener datos del usuario");
        router.push("/login");
      });
  }, [searchParams, router, setAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <LoadingSpinner size="lg" text="Iniciando sesión con Google..." />
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="Cargando..." />
      </div>
    }>
      <GoogleCallbackContent />
    </Suspense>
  );
}