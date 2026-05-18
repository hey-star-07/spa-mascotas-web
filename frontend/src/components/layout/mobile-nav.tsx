"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  User,
  Users,
  Settings,
  ScrollText,
  Calendar,
  ShoppingBag,
  UserPlus,
} from "lucide-react";

const menuItems = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard, roles: ["Admin", "Recepcion", "Groomer", "Cliente"] },
  { href: "/users", label: "Personal", icon: UserPlus, roles: ["Admin"] },
  { href: "/audit-logs", label: "Logs", icon: ScrollText, roles: ["Admin"] },  // 👈 NUEVO
  { href: "/profile", label: "Perfil", icon: User, roles: ["Admin", "Recepcion", "Groomer", "Cliente"] },
  { href: "/settings", label: "Ajustes", icon: Settings, roles: ["Admin", "Recepcion", "Groomer", "Cliente"] },
];

export function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const filteredMenu = menuItems.filter((item) =>
    item.roles.includes(user?.rol as string)
  );

  // Mostrar máximo 5 items en móvil
  const visibleItems = filteredMenu.slice(0, 5);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t-3 border-foreground bg-white lg:hidden">
      <div className="flex items-center justify-around h-16">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-2 py-1 rounded-xl transition-all",
                isActive
                  ? "bg-primary border-2 border-foreground shadow-cartoon-sm translate-y-[-4px]"
                  : "hover:bg-primary/20"
              )}
            >
              <item.icon
                className={cn("h-5 w-5", isActive ? "text-foreground" : "text-foreground/60")}
                strokeWidth={isActive ? 3 : 2}
              />
              <span className={cn("text-[10px] font-bold", isActive ? "text-foreground" : "text-foreground/60")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}