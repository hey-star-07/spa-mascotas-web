import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
}

export function LoadingSpinner({ size = "md", className, text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-4 py-12", className)}>
      <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} strokeWidth={3} />
      {text && <p className="text-lg font-bold text-foreground/70">{text}</p>}
    </div>
  );
}