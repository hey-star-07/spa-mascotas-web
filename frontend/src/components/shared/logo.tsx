import Link from "next/link";
import { PawPrint } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  href?: string;
}

export function Logo({ size = "md", href = "/" }: LogoProps) {
  const sizeClasses = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-4xl",
  };

  const iconSizes = {
    sm: 24,
    md: 32,
    lg: 48,
  };

  return (
    <Link href={href} className="flex items-center gap-2 font-extrabold">
      <div className="rounded-xl border-3 border-foreground bg-primary p-2 shadow-cartoon-sm">
        <PawPrint size={iconSizes[size]} className="text-foreground" strokeWidth={3} />
      </div>
      <span className={sizeClasses[size]}>Pet Spa</span>
    </Link>
  );
}