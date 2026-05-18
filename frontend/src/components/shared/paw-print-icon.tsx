import { PawPrint } from "lucide-react";
import { cn } from "@/lib/utils";

interface PawPrintIconProps {
  size?: number;
  className?: string;
  variant?: "primary" | "secondary" | "accent" | "rose" | "lavender";
}

export function PawPrintIcon({ size = 24, className, variant = "primary" }: PawPrintIconProps) {
  const variantClasses = {
    primary: "bg-primary",
    secondary: "bg-secondary",
    accent: "bg-accent",
    rose: "bg-rose",
    lavender: "bg-lavender",
  };

  return (
    <div
      className={cn(
        "rounded-xl border-3 border-foreground p-2 shadow-cartoon-sm inline-flex",
        variantClasses[variant],
        className
      )}
    >
      <PawPrint size={size} className="text-foreground" strokeWidth={3} />
    </div>
  );
}