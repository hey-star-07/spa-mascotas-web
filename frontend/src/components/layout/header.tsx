"use client";

import { useAuthStore } from "@/store/auth-store";
import { useUIStore } from "@/store/ui-store";
import { useAuth } from "@/hooks/use-auth";
import { Logo } from "@/components/shared/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, User, Settings, LogOut, LayoutDashboard } from "lucide-react";
import Link from "next/link";

export function Header() {
  const { user } = useAuthStore();
  const { toggleSidebar } = useUIStore();
  const { logout } = useAuth();

  const initials = `${user?.nombre?.charAt(0) || ""}${user?.apellido?.charAt(0) || ""}`;

  return (
    <header className="sticky top-0 z-40 h-16 border-b-3 border-foreground bg-white/80 backdrop-blur-sm">
      <div className="flex items-center justify-between h-full px-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="lg:hidden">
            <Menu className="h-6 w-6" />
          </Button>
          <Logo size="sm" href="/dashboard" />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 rounded-xl border-3 border-foreground p-1 pr-3 shadow-cartoon-sm hover:shadow-cartoon-hover hover:translate-x-[1px] hover:translate-y-[1px] transition-all">
              <Avatar>
                <AvatarFallback className="bg-accent">{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-extrabold leading-tight">{user?.nombre}</p>
                <p className="text-xs font-semibold text-foreground/70">{user?.rol}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-3 py-2">
              <p className="text-sm font-extrabold">{user?.nombre} {user?.apellido}</p>
              <p className="text-xs text-foreground/70">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <Link href="/dashboard">
              <DropdownMenuItem>
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </DropdownMenuItem>
            </Link>
            <Link href="/profile">
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Mi Perfil
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-rose">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}