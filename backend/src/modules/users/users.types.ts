import { RolUsuario } from '@prisma/client';

export interface UpdateUserDTO {
  nombre?: string;
  apellido?: string;
  telefono?: string;
}

export interface UpdateUserAsAdminDTO extends UpdateUserDTO {
  rol?: RolUsuario;
  activo?: boolean;
}

export interface UserResponse {
  id: number;
  email: string;
  nombre: string;
  apellido: string | null;
  telefono: string | null;
  rol: RolUsuario;
  activo: boolean;
  emailVerificado: boolean;
  twoFactorEnabled: boolean;
  ultimoAcceso: Date | null;
  createdAt: Date;
}

export interface UserListResponse {
  users: UserResponse[];
  total: number;
  page: number;
  limit: number;
}