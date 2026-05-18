import rateLimit from 'express-rate-limit';
import { AppError } from '../errors/AppError';
import { ErrorCodes } from '../errors/errorCodes';

/**
 * Rate limiter general para todas las rutas
 */
export const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutos por defecto
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'), // 100 peticiones por ventana
  message: {
    status: 'error',
    code: ErrorCodes.TOO_MANY_REQUESTS,
    message: 'Demasiadas solicitudes. Intenta de nuevo más tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter estricto para login (previene fuerza bruta)
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 intentos de login por IP
  message: {
    status: 'error',
    code: ErrorCodes.TOO_MANY_LOGIN_ATTEMPTS,
    message: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // No contar logins exitosos
});

/**
 * Rate limiter para verificación de email (previene spam)
 */
export const emailVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // 5 reenvíos por hora
  message: {
    status: 'error',
    code: ErrorCodes.TOO_MANY_REQUESTS,
    message: 'Has solicitado demasiados reenvíos. Intenta de nuevo en 1 hora.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});