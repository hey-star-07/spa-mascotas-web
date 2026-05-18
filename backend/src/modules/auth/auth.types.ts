import { RolUsuario } from '@prisma/client';

// DTOs para registro
export interface RegisterClientDTO {
  email: string;
  password: string;
  nombre: string;
  apellido?: string;
  telefono?: string;
  ci?: string;         // 👈 AGREGADO
  direccion?: string;
}

export interface RegisterStaffDTO {
  email: string;
  password: string;
  nombre: string;
  apellido?: string;
  telefono: string;
  ci: string;           // 👈 AGREGADO
  direccion: string;    // 👈 AGREGADO
  rol: 'Recepcion' | 'Groomer';
  especialidad?: string;
  turno: 'Mañana' | 'Tarde' | 'Completo';
  horarioTrabajo?: any;  // 👈 AGREGADO
}

// DTO para login
export interface LoginDTO {
  email: string;
  password: string;
  twoFactorCode?: string;
}

// DTO para Google OAuth
export interface GoogleAuthDTO {
  idToken: string;
}

// DTO para cambio de contraseña
export interface ChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
}

// DTO para reset de contraseña
export interface ResetPasswordDTO {
  token: string;
  newPassword: string;
}

// Respuesta de autenticación
export interface AuthResponse {
  user: {
    id: number;
    email: string;
    nombre: string;
    apellido?: string;
    rol: string;
  };
  accessToken: string;
  refreshToken: string;
  requires2FA?: boolean;
  setupRequired?: boolean;
  requiresPasswordChange?: boolean;
  tempToken?: string;
}

// Respuesta de verificación 2FA
export interface TwoFactorSetupResponse {
  secret: string;
  qrCode: string;
  recoveryCodes: string[];
}

// Sesión
export interface SessionInfo {
  id: number;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  expiresAt: Date;
}