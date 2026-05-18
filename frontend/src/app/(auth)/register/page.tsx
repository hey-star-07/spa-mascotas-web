"use client";

import { useState } from "react";
import { RegisterForm } from "@/components/auth/register-form";
import { VerifyEmailCodeForm } from "@/components/auth/verify-email-code-form";
import { RegisterStep2Form } from "@/components/auth/register-step2-form";
import { PawPrintIcon } from "@/components/shared/paw-print-icon";
import { RegisterStep1Data, RegisterStep2Data } from "@/lib/validators";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "sonner";
import api from "@/lib/axios";

type Step = 1 | 2 | 3;

export default function RegisterPage() {
  const [step, setStep] = useState<Step>(1);
  const [step1Data, setStep1Data] = useState<RegisterStep1Data | null>(null);
  const [step2Data, setStep2Data] = useState<RegisterStep2Data | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const handleRegistrationComplete = async (step1: RegisterStep1Data, step2: RegisterStep2Data) => {
    setLoading(true);
    try {
      // 1. PRIMERO hacer login para obtener el token
      const loginResponse = await api.post("/auth/login", {
        email: step1.email,
        password: step1.password,
      });

      const { user, accessToken, refreshToken } = loginResponse.data.data;
      
      // 2. Guardar token
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);

      // 3. AHORA actualizar perfil (ya tenemos token)
      await api.put("/users/profile", {
        telefono: step2.telefono,
      }).catch((err) => {
        // No es crítico si falla, el usuario puede actualizar después
        console.log("Actualización de perfil pendiente:", err.message);
      });

      // 4. Guardar en el store
      setAuth(user, accessToken, refreshToken);

      toast.success("¡Registro completado exitosamente!");
      router.push("/dashboard");
    } catch (error: any) {
      const message = error.response?.data?.message || "Error al completar el registro";
      
      // Si el email no está verificado, el login fallará
      if (error.response?.data?.code === "EMAIL_NOT_VERIFIED") {
        toast.error("Debes verificar tu email primero. Revisa tu bandeja de entrada.");
        setStep(2); // Volver al paso de verificación
        return;
      }
      
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="flex flex-col items-center gap-6">
        <PawPrintIcon
          size={48}
          variant={
            step === 1 ? "primary" :
            step === 2 ? "secondary" : "accent"
          }
        />

        {/* Paso 1: Email, nombre, contraseña */}
        {step === 1 && (
          <RegisterForm
            onComplete={(data) => {
              setStep1Data(data);
              setStep(2);
            }}
          />
        )}

        {/* Paso 2: Verificar email con código */}
        {step === 2 && step1Data && (
          <VerifyEmailCodeForm
            email={step1Data.email}
            nombre={step1Data.nombre}
            onVerified={() => setStep(3)}
          />
        )}

        {/* Paso 3: Datos personales y finalizar */}
        {step === 3 && step1Data && (
          <RegisterStep2Form
            onComplete={(data) => {
              if (step1Data) {
                handleRegistrationComplete(step1Data, data);
              }
            }}
            onBack={() => setStep(2)}
            isLastStep={true}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
}