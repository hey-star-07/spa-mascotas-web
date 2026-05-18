export const ErrorCodes = {
  // Errores de autenticación (400)
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  ACCOUNT_INACTIVE: 'ACCOUNT_INACTIVE',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_ALREADY_USED: 'TOKEN_ALREADY_USED',
  INVALID_2FA_CODE: 'INVALID_2FA_CODE',
  PASSWORD_TOO_WEAK: 'PASSWORD_TOO_WEAK',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  
  // Errores de autorización (403)
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  ADMIN_ONLY: 'ADMIN_ONLY',
  
  // Errores de recursos (404)
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  ROLE_NOT_FOUND: 'ROLE_NOT_FOUND',
  
  // Errores de validación (422)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  
  // Errores de rate limiting (429)
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
  TOO_MANY_LOGIN_ATTEMPTS: 'TOO_MANY_LOGIN_ATTEMPTS',
  
  // Errores del servidor (500)
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EMAIL_SEND_ERROR: 'EMAIL_SEND_ERROR',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

export const ErrorMessages: Record<ErrorCode, string> = {
  INVALID_CREDENTIALS: 'Email o contraseña incorrectos',
  EMAIL_NOT_VERIFIED: 'Por favor verifica tu email antes de iniciar sesión',
  ACCOUNT_LOCKED: 'Cuenta bloqueada temporalmente. Intenta de nuevo en 15 minutos',
  ACCOUNT_INACTIVE: 'Esta cuenta ha sido desactivada',
  INVALID_TOKEN: 'Token inválido o mal formado',
  TOKEN_EXPIRED: 'El token ha expirado. Solicita uno nuevo',
  TOKEN_ALREADY_USED: 'Este token ya ha sido utilizado',
  INVALID_2FA_CODE: 'Código de autenticación de dos factores inválido',
  PASSWORD_TOO_WEAK: 'La contraseña no cumple con los requisitos de seguridad',
  EMAIL_ALREADY_EXISTS: 'Ya existe una cuenta con este email',
  INSUFFICIENT_PERMISSIONS: 'No tienes permisos para realizar esta acción',
  ADMIN_ONLY: 'Esta acción solo puede ser realizada por un administrador',
  USER_NOT_FOUND: 'Usuario no encontrado',
  ROLE_NOT_FOUND: 'Rol no encontrado',
  VALIDATION_ERROR: 'Error de validación en los datos enviados',
  INVALID_INPUT: 'Datos de entrada inválidos',
  TOO_MANY_REQUESTS: 'Demasiadas solicitudes. Intenta de nuevo más tarde',
  TOO_MANY_LOGIN_ATTEMPTS: 'Demasiados intentos de inicio de sesión',
  INTERNAL_SERVER_ERROR: 'Error interno del servidor',
  DATABASE_ERROR: 'Error al acceder a la base de datos',
  EMAIL_SEND_ERROR: 'Error al enviar el email de verificación',
};