import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { adminOnly } from '../../shared/middleware/authorize';
import { validate } from '../../shared/middleware/validate';
import { loginRateLimiter, emailVerificationLimiter } from '../../shared/middleware/rateLimiter';
import {
  registerClientSchema,
  registerStaffSchema,
  loginSchema,
  changePasswordSchema,
  resetPasswordSchema,
  forgotPasswordSchema,
} from './auth.validators';

const router = Router();

// ============================================
// RUTAS PÚBLICAS (sin autenticación)
// ============================================

// Registro de clientes (auto-registro)
router.post(
  '/register/client',
  loginRateLimiter,
  validate(registerClientSchema),
  AuthController.registerClient
);

// Login
router.post(
  '/login',
  loginRateLimiter,
  validate(loginSchema),
  AuthController.login
);
// Verificar email con código
router.post('/verify-email-code', AuthController.verifyEmailWithCode);

// Reenviar código de verificación
router.post('/resend-verification-code', emailVerificationLimiter, AuthController.resendVerificationCode);

// Verificación de email
router.get(
  '/verify-email/:token',
  AuthController.verifyEmail
);

// Reenviar verificación de email
router.post(
  '/resend-verification',
  emailVerificationLimiter,
  AuthController.resendVerification
);

// Recuperación de contraseña
router.post(
  '/forgot-password',
  emailVerificationLimiter,
  validate(forgotPasswordSchema),
  AuthController.forgotPassword
);

// Reset de contraseña
router.post(
  '/reset-password/:token',
  validate(resetPasswordSchema),
  AuthController.resetPassword
);

// Renovar access token
router.post(
  '/refresh-token',
  AuthController.refreshToken
);

// Verificar fortaleza de contraseña (útil para frontend)
router.post(
  '/password-strength',
  AuthController.checkPasswordStrength
);

// ============================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ============================================

// Perfil del usuario autenticado
router.get(
  '/me',
  authenticate,
  AuthController.getProfile
);

// Cambiar contraseña
router.post(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  AuthController.changePassword
);

// Cerrar sesión
router.post(
  '/logout',
  authenticate,
  AuthController.logout
);

// Obtener sesiones activas
router.get(
  '/sessions',
  authenticate,
  AuthController.getActiveSessions
);

// Configurar 2FA
router.post(
  '/setup-2fa',
  authenticate,
  AuthController.setupTwoFactor
);

// Activar 2FA
router.post(
  '/enable-2fa',
  authenticate,
  AuthController.enableTwoFactor
);

// Desactivar 2FA
router.post(
  '/disable-2fa',
  authenticate,
  AuthController.disableTwoFactor
);

// ============================================
// RUTAS DE ADMIN (requieren rol Admin)
// ============================================

// Registrar personal (Recepcion o Groomer)
router.post(
  '/register/staff',
  authenticate,
  adminOnly,
  validate(registerStaffSchema),
  AuthController.registerStaff
);

// Cambiar contraseña temporal (primer inicio)
router.post(
  '/change-password-temporal',
  authenticate,
  AuthController.changePasswordTemporal
);
// Registro de cliente con Google (sin verificación de email)
router.post(
  '/register/google',
  AuthController.registerGoogleClient
);
// Google OAuth
router.get('/google', AuthController.googleAuth);
router.get('/google/callback', AuthController.googleCallback);
export default router;