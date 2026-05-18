import { z } from 'zod';

// Paso 1: Registro básico
export const registerStep1Schema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres').max(100),
  apellido: z.string().max(100).optional(),
  email: z.string().email('Email inválido'),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener mayúscula')
    .regex(/[a-z]/, 'Debe contener minúscula')
    .regex(/[0-9]/, 'Debe contener número')
    .regex(/[!@#$%^&*]/, 'Debe contener símbolo'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

// Paso 2: Datos adicionales
export const registerStep2Schema = z.object({
  ci: z.string().min(1, 'CI requerido'),
  telefono: z.string().min(1, 'Teléfono requerido'),
  direccion: z.string().min(1, 'Dirección requerida'),
});

export type RegisterStep1Data = z.infer<typeof registerStep1Schema>;
export type RegisterStep2Data = z.infer<typeof registerStep2Schema>;

// Login
export const loginSchema = z.object({
  email: z.string().email('Email inválido').min(1, 'Email requerido'),
  password: z.string().min(1, 'Contraseña requerida'),
  twoFactorCode: z.string().length(6, 'Código de 6 dígitos').optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

export const resetPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener mayúscula')
    .regex(/[a-z]/, 'Debe contener minúscula')
    .regex(/[0-9]/, 'Debe contener número')
    .regex(/[!@#$%^&*]/, 'Debe contener símbolo'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Contraseña actual requerida'),
  newPassword: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener mayúscula')
    .regex(/[a-z]/, 'Debe contener minúscula')
    .regex(/[0-9]/, 'Debe contener número')
    .regex(/[!@#$%^&*]/, 'Debe contener símbolo'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;