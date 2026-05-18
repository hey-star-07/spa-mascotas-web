"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Lock, Timer } from "lucide-react";

interface LoginAttemptTrackerProps {
  /**
   * Número de intento fallido actual (1-5)
   * 0 = sin intentos, 5 = bloqueado
   */
  attempt: number;
  /**
   * Tiempo restante de bloqueo en segundos (0 = no bloqueado)
   */
  lockoutSeconds?: number;
}

export function LoginAttemptTracker({ attempt, lockoutSeconds = 0 }: LoginAttemptTrackerProps) {
  const [countdown, setCountdown] = useState(lockoutSeconds);

  useEffect(() => {
    setCountdown(lockoutSeconds);
  }, [lockoutSeconds]);

  useEffect(() => {
    if (countdown <= 0) return;
    
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  // Formatear tiempo restante
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Sin intentos = no mostrar nada
  if (attempt === 0 && lockoutSeconds === 0) return null;

  const MAX_ATTEMPTS = 5;
  const remaining = MAX_ATTEMPTS - attempt;

  return (
    <div className="w-full max-w-md">
      {/* BLOQUEADO */}
      {(attempt >= MAX_ATTEMPTS || countdown > 0) ? (
        <div className="bg-rose/20 border-3 border-foreground rounded-xl p-4 shadow-cartoon animate-pulse">
          <div className="flex items-start gap-3">
            <div className="rounded-full border-3 border-foreground bg-rose p-2">
              <Lock className="h-5 w-5" strokeWidth={3} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-extrabold text-rose">Cuenta Bloqueada</p>
              <p className="text-xs font-semibold mb-2">
                Demasiados intentos fallidos. La cuenta está bloqueada temporalmente.
              </p>
              
              {/* Contador regresivo */}
              {countdown > 0 ? (
                <div className="bg-white border-2 border-foreground rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Timer className="h-4 w-4" />
                    <span className="text-sm font-extrabold">Tiempo restante</span>
                  </div>
                  <span className="text-3xl font-extrabold font-mono tracking-widest">
                    {formatTime(countdown)}
                  </span>
                  <p className="text-[10px] font-semibold text-foreground/50 mt-1">
                    Podrás intentar de nuevo cuando el contador llegue a 0:00
                  </p>
                </div>
              ) : (
                <p className="text-xs font-semibold text-primary">
                  ✅ El bloqueo ha terminado. Puedes intentar de nuevo.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* INTENTOS FALLIDOS (1-4) */
        <div className="bg-accent/30 border-3 border-foreground rounded-xl p-4 shadow-cartoon">
          <div className="flex items-start gap-3">
            <div className="rounded-full border-3 border-foreground bg-accent p-2">
              <AlertTriangle className="h-5 w-5" strokeWidth={3} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-extrabold">
                Intento {attempt} de {MAX_ATTEMPTS}
              </p>
              <p className="text-xs font-semibold mb-3">
                {remaining === 1 
                  ? "¡Último intento! Si fallas, tu cuenta será bloqueada por 15 minutos."
                  : `Te ${remaining === 1 ? "queda" : "quedan"} ${remaining} intento${remaining !== 1 ? "s" : ""} antes del bloqueo.`
                }
              </p>

              {/* Barras visuales */}
              <div className="space-y-1.5">
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <div
                      key={num}
                      className={`h-3 flex-1 rounded-full border-2 border-foreground transition-all duration-300 ${
                        num <= attempt 
                          ? num === 5 
                            ? "bg-rose" 
                            : "bg-accent"
                          : num === 5 && remaining <= 2
                            ? "bg-rose/30"
                            : "bg-white/50"
                      }`}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-[9px] font-extrabold text-foreground/50">
                  <span>Intento {attempt}</span>
                  <span>Bloqueo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}