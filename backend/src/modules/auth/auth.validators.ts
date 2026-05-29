import { z } from 'zod';

// Validación de registro de cliente
export const registerClientSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email('Email inválido')
      .min(5, 'Email demasiado corto')
      .max(255, 'Email demasiado largo')
      .transform((val) => val.toLowerCase().trim()),
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .max(128, 'La contraseña es demasiado larga'),
    nombre: z
      .string()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(100, 'Nombre demasiado largo')
      .trim(),
    apellido: z
      .string()
      .max(100, 'Apellido demasiado largo')
      .trim()
      .optional(),
    telefono: z
      .string()
      .max(20, 'Teléfono demasiado largo')
      .optional(),
    ci: z              // 👈 AGREGADO
      .string()
      .max(10)
      .optional(),
    direccion: z
      .string()
      .max(255, 'Dirección demasiado larga')
      .optional(),
  }),
});

// Validación de registro de personal (solo Admin)
export const registerStaffSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email('Email inválido')
      .transform((val) => val.toLowerCase().trim()),
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres'),
    nombre: z
      .string()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .trim(),
    apellido: z
      .string()
      .max(100)
      .trim()
      .optional(),
    telefono: z
      .string()
      .min(1, 'Teléfono requerido'),    // 👈 Ahora requerido
    ci: z                               // 👈 AGREGADO
      .string()
      .min(1, 'CI requerido'),
    direccion: z                         // 👈 AGREGADO
      .string()
      .min(1, 'Dirección requerida'),
    rol: z.enum(['Recepcion', 'Groomer'], {
      errorMap: () => ({ message: 'Rol inválido. Debe ser Recepcion o Groomer' }),
    }),
    especialidad: z
      .string()
      .max(100)
      .optional(),
    turno: z                             // 👈 AGREGADO
      .enum(['Mañana', 'Tarde', 'Completo'], {
        errorMap: () => ({ message: 'Turno inválido' }),
      }),
    capacidadDiaria: z.number().int().min(1).max(20).optional(),
  }),
});

// Validación de login
export const loginSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email('Email inválido')
      .transform((val) => val.toLowerCase().trim()),
    password: z
      .string()
      .min(1, 'La contraseña es requerida'),
    twoFactorCode: z
      .string()
      .length(6, 'El código 2FA debe tener 6 dígitos')
      .optional(),
  }),
});

// Validación de cambio de contraseña
export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z
      .string()
      .min(1, 'La contraseña actual es requerida'),
    newPassword: z
      .string()
      .min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
  }),
});

// Validación de reset de contraseña
export const resetPasswordSchema = z.object({
  body: z.object({
    newPassword: z
      .string()
      .min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
  }),
  params: z.object({
    token: z.string().min(1, 'Token requerido'),
  }),
});

// Validación de email para recuperación
export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email('Email inválido')
      .transform((val) => val.toLowerCase().trim()),
  }),
});

// Validación de código 2FA
export const verify2FASchema = z.object({
  body: z.object({
    code: z
      .string()
      .length(6, 'El código debe tener 6 dígitos'),
  }),
});

// Validación de refresh token
export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z
      .string()
      .min(1, 'Refresh token requerido'),
  }),
});