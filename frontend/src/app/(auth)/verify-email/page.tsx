"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Mail, ArrowRight } from "lucide-react";
import api from "@/lib/axios";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { PawPrintIcon } from "@/components/shared/paw-print-icon";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (token) verifyEmail(token);
    else {
      setStatus("error");
      setMessage("Token no proporcionado");
    }
  }, [token]);

  const verifyEmail = async (t: string) => {
    try {
      const { data } = await api.get(`/auth/verify-email/${t}`);
      setStatus("success");
      setMessage(data.message);
    } catch (error: any) {
      setStatus("error");
      setMessage(error.response?.data?.message || "Error al verificar email");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="flex flex-col items-center gap-6">
        {status === "loading" ? (
          <LoadingSpinner size="lg" text="Verificando tu email..." />
        ) : (
          <Card className="w-full max-w-md text-center">
            <CardContent className="pt-8 pb-6">
              {/* Icono animado */}
              <div className="mb-6">
                {status === "success" ? (
                  <div className="inline-flex rounded-full border-3 border-foreground bg-primary p-6 shadow-cartoon animate-bounce">
                    <CheckCircle className="h-16 w-16 text-foreground" strokeWidth={3} />
                  </div>
                ) : (
                  <div className="inline-flex rounded-full border-3 border-foreground bg-rose/30 p-6 shadow-cartoon">
                    <XCircle className="h-16 w-16 text-foreground" strokeWidth={3} />
                  </div>
                )}
              </div>

              <CardTitle className="text-2xl mb-2">
                {status === "success" ? "¡Email Verificado!" : "Error de Verificación"}
              </CardTitle>

              <CardDescription className="text-base mb-2">
                {message}
              </CardDescription>

              {status === "success" && (
                <div className="flex justify-center gap-2 my-4">
                  {[1, 2, 3].map((i) => (
                    <PawPrintIcon key={i} size={16} variant={i === 1 ? "primary" : i === 2 ? "secondary" : "accent"} />
                  ))}
                </div>
              )}

              <Link href="/login">
                <Button size="lg" className="mt-4">
                  <ArrowRight className="mr-2 h-5 w-5" />
                  Ir al inicio de sesión
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}