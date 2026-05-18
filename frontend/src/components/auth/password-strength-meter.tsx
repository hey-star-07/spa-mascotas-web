"use client";

import { calculatePasswordStrength } from "@/lib/utils";

interface PasswordStrengthMeterProps {
  password: string;
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  // Validaciones individuales
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  if (!password) {
    return (
      <div className="space-y-2">
        <p className="text-xs font-bold text-foreground/60">Tu contraseña debe incluir:</p>
        <div className="grid grid-cols-1 gap-0.5">
          {[
            { check: false, text: "Mínimo 8 caracteres" },
            { check: false, text: "Al menos una mayúscula (A-Z)" },
            { check: false, text: "Al menos una minúscula (a-z)" },
            { check: false, text: "Al menos un número (0-9)" },
            { check: false, text: "Al menos un símbolo (!@#$%^&*)" },
          ].map((item, i) => (
            <span key={i} className="text-[10px] font-semibold text-foreground/40 flex items-center gap-1">
              <span className="w-4 h-4 rounded-full border-2 border-foreground/30 flex items-center justify-center text-[8px]">○</span>
              {item.text}
            </span>
          ))}
        </div>
      </div>
    );
  }

  const { score, label, color } = calculatePasswordStrength(password);
  const segments = 5;
  const filledSegments = Math.round((score / 100) * segments);

  return (
    <div className="space-y-2">
      {/* Barras de fuerza */}
      <div className="flex gap-1">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className="h-2 flex-1 rounded-full border-2 border-foreground transition-all duration-300"
            style={{
              backgroundColor: i < filledSegments ? color : "#E5E7EB",
            }}
          />
        ))}
      </div>

      {/* Label y porcentaje */}
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold" style={{ color }}>
          {label}
        </span>
        <span className="text-xs font-semibold text-foreground/50">{score}%</span>
      </div>

      {/* 👇 CHECKLIST DE REQUISITOS SIEMPRE VISIBLE */}
      <div className="grid grid-cols-1 gap-0.5">
        {[
          { check: checks.length, text: "Mínimo 8 caracteres" },
          { check: checks.uppercase, text: "Al menos una mayúscula (A-Z)" },
          { check: checks.lowercase, text: "Al menos una minúscula (a-z)" },
          { check: checks.number, text: "Al menos un número (0-9)" },
          { check: checks.symbol, text: "Al menos un símbolo (!@#$%^&*)" },
        ].map((item, i) => (
          <span
            key={i}
            className={`text-[10px] font-semibold flex items-center gap-1 transition-colors ${
              item.check ? "text-primary" : "text-foreground/40"
            }`}
          >
            <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center text-[8px] transition-all ${
              item.check ? "border-primary bg-primary/30 text-primary" : "border-foreground/30 text-foreground/30"
            }`}>
              {item.check ? "✓" : "○"}
            </span>
            {item.text}
          </span>
        ))}
      </div>
    </div>
  );
}