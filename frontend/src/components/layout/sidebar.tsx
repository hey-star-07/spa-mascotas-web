"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { useUIStore } from "@/store/ui-store";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Scissors, Calendar } from "lucide-react";
import { PawPrint } from "lucide-react";
import { CalendarPlus, XCircle } from "lucide-react";
import { ClipboardList } from "lucide-react";
import { Box } from "lucide-react";
import { Receipt } from "lucide-react";
import {
  LayoutDashboard,
  User,
  Users,
  Settings,
  ScrollText,
  UserPlus,
  X,
} from "lucide-react";

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["Admin", "Recepcion", "Groomer", "Cliente"] },
  { href: "/profile", label: "Mi Perfil", icon: User, roles: ["Admin", "Recepcion", "Groomer", "Cliente"] },
  { href: "/my-pets", label: "Mis Mascotas", icon: PawPrint, roles: ["Cliente"] },
  { href: "/users", label: "Gestionar Personal", icon: UserPlus, roles: ["Admin"] },  
  { href: "/services", label: "Servicios", icon: Scissors, roles: ["Admin"] },
  { href: "/availability", label: "Disponibilidad", icon: Calendar, roles: ["Admin", "Recepcion"] },
  { href: "/appointments", label: "Citas", icon: Calendar, roles: ["Admin", "Recepcion"]},
  { href: "/my-appointments", label: "Mis Citas", icon: Calendar, roles: ["Cliente"] },
  { href: "/groomer-dashboard", label: "Mi Agenda", icon: Calendar, roles: ["Groomer"] },
  { href: "/grooming", label: "Fichas Técnicas", icon: ClipboardList, roles: ["Groomer"] },
  { href: "/inventory", label: "Inventario", icon: Box, roles: ["Admin", "Recepcion"] },
  { href: "/billing", label: "Facturación", icon: Receipt, roles: ["Admin", "Recepcion", "Cliente"] },
  { href: "/settings", label: "Configuración", icon: Settings, roles: ["Admin", "Recepcion", "Groomer", "Cliente"] },
  { href: "/audit-logs", label: "Auditoría", icon: ScrollText, roles: ["Admin"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  const filteredMenu = menuItems.filter((item) =>
    item.roles.includes(user?.rol as string)
  );

  return (
    <>
      {/* Overlay móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-white border-r-3 border-foreground shadow-cartoon transition-transform duration-300 lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b-3 border-foreground">
          <Logo size="sm" />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="p-3 space-y-1">
          {filteredMenu.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all border-3",
                  isActive
                    ? "bg-primary border-foreground shadow-cartoon-sm translate-x-[2px] translate-y-[2px]"
                    : "border-transparent hover:bg-primary/20 hover:border-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

      </aside>
    </>
  );
}