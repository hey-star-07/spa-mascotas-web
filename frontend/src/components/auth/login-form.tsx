"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Eye, EyeOff, LogIn, Shield, AlertTriangle, ArrowLeft, Lock, Timer } from "lucide-react";
import { loginSchema, LoginFormData } from "@/lib/validators";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
 
// Variables globales para persistir
let globalRemainingAttempts: number | null = null;
let globalMaxAttempts: number = 5;
let globalLockedUntil: number | null = null; // timestamp de desbloqueo

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(globalRemainingAttempts);
  const [maxAttempts] = useState<number>(globalMaxAttempts);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(0); // segundos restantes
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const { login, verify2FA, loading, requires2FA, loginEmail } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Calcular tiempo restante al cargar
  useEffect(() => {
    if (globalLockedUntil) {
      const now = Date.now();
      if (globalLockedUntil > now) {
        const secondsLeft = Math.ceil((globalLockedUntil - now) / 1000);
        setIsLocked(true);
        setCountdown(secondsLeft);
        startCountdown(secondsLeft);
      } else {
        resetAll();
      }
    }
    if (globalRemainingAttempts !== null && globalRemainingAttempts > 0) {
      setRemainingAttempts(globalRemainingAttempts);
    }
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const startCountdown = (seconds: number) => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setCountdown(seconds);
    
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          resetAll();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const resetAll = useCallback(() => {
    globalRemainingAttempts = null;
    globalLockedUntil = null;
    setRemainingAttempts(null);
    setIsLocked(false);
    setCountdown(0);
    setLoginError("");
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  const formatCountdown = (seconds: number): string => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const onSubmit = async (data: LoginFormData) => {
    setLoginError("");
    
    if (requires2FA) {
      try {
        await verify2FA(data.twoFactorCode || "");
        resetAll();
      } catch (error: any) {
        setLoginError(error.message || "Código inválido");
      }
    } else {
      try {
        await login(data);
        resetAll();
      } catch (error: any) {
      // 👇 DEBUG: Ver qué datos llegan
        console.log('🔴 ERROR RECIBIDO:', {
          message: error.message,
          remainingAttempts: error.remainingAttempts,
          maxAttempts: error.maxAttempts,
          code: error.code,
        });
        
        const message = error.message || "Error al iniciar sesión";
        setLoginError(message);
        
        // 👇 Verificar que remainingAttempts NO sea null/undefined
        if (error.remainingAttempts !== undefined && error.remainingAttempts !== null) {
          const remaining = error.remainingAttempts;
          const max = error.maxAttempts || 5;
          
          console.log('🟡 GUARDANDO:', { remaining, max }); // DEBUG
          
          globalRemainingAttempts = remaining;
          globalMaxAttempts = max;
          setRemainingAttempts(remaining);
          
          if (remaining <= 0) {
            const lockedUntil = Date.now() + 15 * 60 * 1000;
            globalLockedUntil = lockedUntil;
            globalRemainingAttempts = 0;
            setIsLocked(true);
            setRemainingAttempts(0);
            startCountdown(15 * 60);
          }
        } else {
          console.log('🟠 remainingAttempts es null/undefined'); // DEBUG
        }
      }
    }
  };

  const handleGoogleLogin = () => {
    if (isLocked) return; // 👈 BLOQUEAR TAMBIÉN GOOGLE
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
  };

  const usedAttempts = remainingAttempts !== null ? maxAttempts - remainingAttempts : 0;

  // ============================================
  // MODO 2FA
  // ============================================
  if (requires2FA) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="rounded-xl border-3 border-foreground bg-lavender p-2">
              <Shield className="h-6 w-6" strokeWidth={3} />
            </div>
          </div>
          <CardTitle>Verificación de Dos Factores</CardTitle>
          <CardDescription>Ingresa el código para <strong>{loginEmail}</strong></CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="bg-secondary rounded-xl border-2 border-foreground p-3 text-xs font-semibold text-center">
              Abre Google Authenticator y busca el código para Pet Spa.
            </div>
            {loginError && (
              <div className="bg-rose/20 border-2 border-foreground rounded-xl p-3 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-rose flex-shrink-0" />
                <p className="text-xs font-semibold">{loginError}</p>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="twoFactorCode">Código de 6 dígitos</Label>
              <Input id="twoFactorCode" placeholder="000000" className="text-center text-2xl tracking-widest" maxLength={6} {...register("twoFactorCode")} autoFocus />
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              <Shield className="mr-2 h-5 w-5" />
              {loading ? "Verificando..." : "Verificar Código"}
            </Button>
            <button type="button" onClick={() => window.location.reload()} className="text-sm font-bold text-info hover:underline flex items-center gap-1">
              <ArrowLeft size={16} /> Volver
            </button>
          </CardFooter>
        </form>
      </Card>
    );
  }

  // ============================================
  // MODO NORMAL
  // ============================================
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Iniciar Sesión</CardTitle>
        <CardDescription>Ingresa tus credenciales para acceder</CardDescription>
      </CardHeader>

      {/* Google - BLOQUEADO SI isLocked */}
      <Button 
        type="button" 
        variant="outline" 
        className={`w-full mb-2 mx-6 ${isLocked ? 'opacity-50 pointer-events-none' : ''}`}
        onClick={handleGoogleLogin}
        disabled={isLocked}
      >
        <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continuar con Google
      </Button>

      <div className="relative mx-6">
        <Separator className="my-1" />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xs font-bold text-foreground/50">o con email</span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4 pt-2">
          {/* 🔒 BLOQUEO CON CRONÓMETRO */}
          {isLocked && (
            <div className="bg-rose/10 border-3 border-rose rounded-xl p-4 text-center animate-pulse">
              <Lock className="h-10 w-10 text-rose mx-auto mb-2" strokeWidth={3} />
              <p className="text-base font-extrabold text-rose mb-1">Cuenta Bloqueada</p>
              <p className="text-xs font-semibold mb-1">Demasiados intentos fallidos</p>
              
              {/* CRONÓMETRO */}
              <div className="inline-flex items-center gap-2 bg-rose/20 border-2 border-rose rounded-xl px-4 py-2 my-2">
                <Timer className="h-5 w-5 text-rose animate-pulse" />
                <span className="text-2xl font-extrabold text-rose font-mono tracking-wider">
                  {formatCountdown(countdown)}
                </span>
              </div>
              <p className="text-[10px] font-semibold text-rose/70">minutos restantes para desbloqueo</p>
              
              {/* Barras */}
              <div className="flex justify-center gap-1.5 max-w-[200px] mx-auto mt-3">
                {Array.from({ length: maxAttempts }).map((_, i) => (
                  <div key={i} className="h-2.5 flex-1 rounded-full border-2 border-foreground bg-rose/60" />
                ))}
              </div>
            </div>
          )}

          {/* ⚠️ INTENTOS RESTANTES */}
          {remainingAttempts !== null && remainingAttempts > 0 && !isLocked && (
            <div className="bg-accent/10 border-3 border-accent rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangle className="h-8 w-8 text-accent flex-shrink-0" strokeWidth={3} />
                <div>
                  <p className="text-sm font-extrabold">Credenciales incorrectas</p>
                  <p className="text-xs font-semibold">
                    <strong className="text-lg">{remainingAttempts}</strong> de <strong>{maxAttempts}</strong> intentos restantes
                  </p>
                </div>
              </div>
              <div className="flex gap-1.5">
                {Array.from({ length: maxAttempts }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-3 flex-1 rounded-full border-2 border-foreground transition-all duration-500 ${
                      i < remainingAttempts 
                        ? "bg-primary shadow-[0_0_8px_rgba(168,213,186,0.5)]" 
                        : "bg-rose/50"
                    }`}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-1.5 text-[10px] font-bold">
                <span className="text-primary">✓ {remainingAttempts} disponible{remainingAttempts !== 1 && "s"}</span>
                <span className="text-rose">✗ {usedAttempts} usado{usedAttempts !== 1 && "s"}</span>
              </div>
            </div>
          )}

          {/* Aviso preventivo */}
          {remainingAttempts === null && !isLocked && (
            <div className="bg-secondary/40 rounded-xl border-2 border-foreground/20 p-2.5 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-foreground/40 flex-shrink-0" />
              <p className="text-[11px] font-semibold text-foreground/50">
                Tras <strong>5 intentos fallidos</strong>, bloqueo por <strong>15 minutos</strong>.
              </p>
            </div>
          )}

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="tu@email.com" {...register("email")} disabled={loading || isLocked} />
          </div>

          {/* Contraseña */}
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" {...register("password")} disabled={loading || isLocked} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" tabIndex={-1}>
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="text-right">
            <Link href="/forgot-password" className="text-sm font-bold text-info hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </CardContent>

        <CardFooter>
          <Button type="submit" className="w-full" disabled={loading || isLocked}>
            <LogIn className="mr-2 h-5 w-5" />
            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}