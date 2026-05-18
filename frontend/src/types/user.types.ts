export interface UserProfile {
  id: number;
  email: string;
  nombre: string;
  apellido: string | null;
  telefono: string | null;
  rol: string;
  activo: boolean;
  emailVerificado: boolean;
  twoFactorEnabled: boolean;
  ultimoAcceso: string | null;
  createdAt: string;
}

export interface UserListResponse {
  users: UserProfile[];
  total: number;
  page: number;
  limit: number;
}