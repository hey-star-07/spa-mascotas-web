"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import api from "@/lib/axios";
import { LoginRequest, RegisterRequest, AuthResponse } from "@/types/auth.types";
import { toast } from "sonner";

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const router = useRouter();
  const { setAuth, logout: storeLogout } = useAuthStore();

  const login = async (data: LoginRequest) => {
    setLoading(true);
    setRequires2FA(false);
    try {
      const response = await api.post("/auth/login", data);
      const authData = response.data.data as AuthResponse;

      if (authData.requiresPasswordChange) {
        localStorage.setItem("tempToken", authData.tempToken || "");
        toast.warning("Debes cambiar tu contraseña temporal");
        router.push("/change-password-required");
        return;
      }

      if (authData.setupRequired) {
        localStorage.setItem("tempToken", authData.tempToken || "");
        localStorage.setItem("tempLoginData", JSON.stringify({ email: data.email, password: data.password }));
        setLoginEmail(data.email);
        setLoginPassword(data.password);
        toast.warning("Debes configurar 2FA antes de continuar");
        router.push("/setup-2fa");
        return;
      }

      if (authData.requires2FA) {
        setRequires2FA(true);
        setLoginEmail(data.email);
        setLoginPassword(data.password);
        return;
      }

      const { user, accessToken, refreshToken } = authData;
      setAuth(user, accessToken, refreshToken);
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      toast.success("Inicio de sesión exitoso");
      router.push("/dashboard");
    } catch (error: any) {
      // 👇 LEER DIRECTAMENTE DE response.data (axios)
      const responseData = error.response?.data;
      
      const enhancedError: any = new Error(
        responseData?.message || "Error al iniciar sesión"
      );
      
      // 👇 COPIAR TODOS LOS CAMPOS EXTRA
      enhancedError.remainingAttempts = responseData?.remainingAttempts;
      enhancedError.maxAttempts = responseData?.maxAttempts;
      enhancedError.userExists = responseData?.userExists;
      enhancedError.code = responseData?.code;
      
      throw enhancedError;
    } finally {
      setLoading(false);
    }
  };

  const verify2FA = async (code: string) => {
    if (!loginEmail || !loginPassword) {
      toast.error("Error de sesión. Vuelve a iniciar sesión");
      router.push("/login");
      return;
    }
    setLoading(true);
    try {
      const response = await api.post("/auth/login", {
        email: loginEmail,
        password: loginPassword,
        twoFactorCode: code,
      });
      const { user, accessToken, refreshToken } = response.data.data as AuthResponse;
      setAuth(user, accessToken, refreshToken);
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      setRequires2FA(false);
      setLoginEmail("");
      setLoginPassword("");
      toast.success("Inicio de sesión exitoso");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error("Código 2FA inválido");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterRequest) => {
    setLoading(true);
    try {
      await api.post("/auth/register/client", data);
      toast.success("Registro exitoso. Revisa tu email para verificar tu cuenta.");
      router.push("/login");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al registrarse");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try { await api.post("/auth/logout"); } catch {}
    storeLogout();
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("tempToken");
    localStorage.removeItem("tempLoginData");
    toast.success("Sesión cerrada");
    router.push("/login");
  };

  return { login, verify2FA, register, logout, loading, requires2FA, loginEmail };
}