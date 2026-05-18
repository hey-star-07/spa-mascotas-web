"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import { useUsers } from "@/hooks/use-users";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { RegisterStaffForm } from "@/components/auth/register-staff-form";
import { UserProfile } from "@/types/user.types";
import { getRoleBadgeColor } from "@/lib/utils";
import { Search, UserX, UserCheck, Users, UserPlus, List } from "lucide-react";

export default function UsersPage() {
  const { user } = useAuthStore();
  const { getUsers, deactivateUser, reactivateUser, loading } = useUsers();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<"list" | "add">("list");

  useEffect(() => {
    if (activeTab === "list") loadUsers();
  }, [page, search, activeTab]);

  const loadUsers = async () => {
    try {
      const data = await getUsers({ page, limit: 20, search: search || undefined });
      setUsers(data.users);
    } catch {}
  };

  const handleDeactivate = async () => {
    if (!selectedUser) return;
    await deactivateUser(selectedUser.id);
    setConfirmOpen(false);
    loadUsers();
  };

  if (user?.rol !== "Admin") {
    return (
      <EmptyState
        icon={<Users className="h-12 w-12" />}
        title="Acceso Restringido"
        description="Solo los administradores pueden ver esta página"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-8 w-8" strokeWidth={3} />
        <h1 className="text-3xl font-extrabold">Gestión de Personal</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b-3 border-foreground pb-0">
        <button
          onClick={() => setActiveTab("list")}
          className={`px-4 py-2 rounded-t-xl font-extrabold border-3 border-b-0 transition-all ${
            activeTab === "list"
              ? "bg-primary border-foreground translate-y-[3px]"
              : "bg-white/50 border-transparent hover:bg-primary/20"
          }`}
        >
          <List className="inline h-4 w-4 mr-1" />
          Lista de Personal
        </button>
        <button
          onClick={() => setActiveTab("add")}
          className={`px-4 py-2 rounded-t-xl font-extrabold border-3 border-b-0 transition-all ${
            activeTab === "add"
              ? "bg-lavender border-foreground translate-y-[3px]"
              : "bg-white/50 border-transparent hover:bg-lavender/20"
          }`}
        >
          <UserPlus className="inline h-4 w-4 mr-1" />
          Agregar Personal
        </button>
      </div>

      {activeTab === "add" ? (
        <RegisterStaffForm />
      ) : (
        <>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/50" />
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-10"
            />
          </div>

          {loading ? (
            <LoadingSpinner text="Cargando..." />
          ) : users.length === 0 ? (
            <EmptyState icon={<Users className="h-12 w-12" />} title="No hay usuarios" />
          ) : (
            <div className="space-y-4">
              {users.map((u) => (
                <Card key={u.id} className="hover:shadow-cartoon-hover transition-all">
                  <CardContent className="flex items-center justify-between py-4 flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl border-3 border-foreground bg-primary p-2">
                        <span className="text-lg font-extrabold">{u.nombre.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-extrabold">{u.nombre} {u.apellido}</p>
                        <p className="text-sm font-semibold text-foreground/70">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getRoleBadgeColor(u.rol)}>{u.rol}</Badge>
                      {u.activo ? (
                        <Badge variant="default">Activo</Badge>
                      ) : (
                        <Badge variant="destructive">Inactivo</Badge>
                      )}
                      {u.id !== user.id && (
                        u.activo ? (
                          <Button variant="destructive" size="sm" onClick={() => { setSelectedUser(u); setConfirmOpen(true); }}>
                            <UserX className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button variant="secondary" size="sm" onClick={() => handleReactivate(u.id)}>
                            <UserCheck className="h-4 w-4" />
                          </Button>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Desactivar usuario"
        description={`¿Desactivar a ${selectedUser?.nombre}?`}
        confirmText="Desactivar"
        variant="destructive"
        onConfirm={handleDeactivate}
      />
    </div>
  );
}