export interface User {
  id: number;
  email: string;
  nombre: string;
  apellido: string | null;
  rol: 'Admin' | 'Recepcion' | 'Groomer' | 'Cliente';
}

export interface LoginRequest {
  email: string;
  password: string;
  twoFactorCode?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  nombre: string;
  apellido?: string;
  telefono?: string;
  ci?: string;
  direccion?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  requires2FA?: boolean;
  setupRequired?: boolean;
  tempToken?: string;
  requiresPasswordChange?: boolean;  // 👈 AGREGAR
}

export interface ApiResponse<T> {
  status: string;
  data?: T;
  message?: string;
  code?: string;
  errors?: Array<{ campo: string; mensaje: string }>;
}