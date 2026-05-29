import prisma from '../../config/database';
import { PasswordUtils } from '../../shared/utils/password';
import { TokenUtils, TokenPayload } from '../../shared/utils/tokens';
import { TOTPUtils } from '../../shared/utils/totp';
import { EmailUtils } from '../../shared/utils/email';
import { AppError } from '../../shared/errors/AppError';
import { ErrorCodes } from '../../shared/errors/errorCodes';
import { logger } from '../../config/logger';
import {
  RegisterClientDTO,
  RegisterStaffDTO,
  LoginDTO,
  AuthResponse,
  TwoFactorSetupResponse,
  SessionInfo,
} from './auth.types';

export class AuthService {
  /**
   * Registro de clientes (auto-registro)
   */
  static async registerClient(data: RegisterClientDTO): Promise<{ message: string }> {
    const existingUser = await prisma.usuario.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError(ErrorCodes.EMAIL_ALREADY_EXISTS, 409);
    }

    const passwordValidation = PasswordUtils.validateStrength(data.password);
    if (!passwordValidation.isValid) {
      throw new AppError(
        ErrorCodes.PASSWORD_TOO_WEAK,
        422,
        `Contraseña débil: ${passwordValidation.errors.join('. ')}`
      );
    }

    const passwordHash = await PasswordUtils.hash(data.password);

    // 👇 GENERAR CÓDIGO NUMÉRICO DE 6 DÍGITOS
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const codeExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    console.log('🔑 Código de verificación generado:', verificationCode, 'para', data.email); // 👈 DEBUG

    const result = await prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: {
          email: data.email,
          passwordHash,
          nombre: data.nombre,
          apellido: data.apellido,
          telefono: data.telefono,
          rol: 'Cliente',
          verificationToken: verificationCode,  // 👈 Guardar código numérico
          codeExpiresAt: codeExpiresAt,          // 👈 Fecha de expiración
        },
      });

      await tx.cliente.create({
        data: {
          usuarioId: usuario.id,
          direccionFisica: data.direccion,
        },
      });

      return usuario;
    });

    // 👇 ENVIAR EMAIL CON EL CÓDIGO
    EmailUtils.sendVerificationEmail(data.email, data.nombre, verificationCode)
      .then(() => {
        console.log('✅ Email enviado a:', data.email); // 👈 DEBUG
      })
      .catch((error) => {
        console.error('❌ Error al enviar email:', error); // 👈 DEBUG
        logger.error('Error al enviar email de verificación:', error);
      });

    return {
      message: 'Registro exitoso. Revisa tu email para obtener el código de verificación.',
    };
  }

  /**
   * Registro de personal (solo Admin)
   */
  static async registerStaff(data: RegisterStaffDTO): Promise<{ message: string }> {
    const existingUser = await prisma.usuario.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError(ErrorCodes.EMAIL_ALREADY_EXISTS, 409);
    }

    const passwordValidation = PasswordUtils.validateStrength(data.password);
    if (!passwordValidation.isValid) {
      throw new AppError(
        ErrorCodes.PASSWORD_TOO_WEAK,
        422,
        `Contraseña débil: ${passwordValidation.errors.join('. ')}`
      );
    }

    const passwordHash = await PasswordUtils.hash(data.password);

    // Fecha de expiración de contraseña temporal: 3 días
    const fechaExpiracionPass = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    await prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: {
          email: data.email,
          passwordHash,
          nombre: data.nombre,
          apellido: data.apellido,
          telefono: data.telefono,
          rol: data.rol,
          emailVerificado: true,
          passwordTemporal: true,           // 👈 Marcar como contraseña temporal
          fechaExpiracionPass: fechaExpiracionPass, // 👈 3 días para cambiar
        },
      });

      if (data.rol === 'Groomer') {
        await tx.groomer.create({
          data: {
            usuarioId: usuario.id,
            especialidad: data.especialidad,
            capacidadDiaria: data.capacidadDiaria || 6,
            horarioTrabajo: data.horarioTrabajo || {
              Lunes: { inicio: '08:00', fin: '18:00' },
              Martes: { inicio: '08:00', fin: '18:00' },
              Miercoles: { inicio: '08:00', fin: '18:00' },
              Jueves: { inicio: '08:00', fin: '18:00' },
              Viernes: { inicio: '08:00', fin: '18:00' },
            },
          },
        });
      }
    });

    // 👇 ENVIAR EMAIL DE BIENVENIDA CON CONTRASEÑA TEMPORAL
    EmailUtils.sendWelcomeEmail(data.email, data.nombre, data.rol, data.password)
      .catch((error) => logger.error('Error enviando email de bienvenida:', error));

    return { message: `Personal (${data.rol}) registrado exitosamente. Se ha enviado un email con sus credenciales.` };
  }

  /**
   * Login de usuario
   */
  static async login(
    data: LoginDTO,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuthResponse> {
    const usuario = await prisma.usuario.findUnique({
      where: { email: data.email },
    });

    // ✅ CÓDIGO CORREGIDO (incluye remainingAttempts aunque el usuario no exista)
    if (!usuario) {
      // Usuario no existe - no podemos contar intentos, pero igual enviamos los campos
      throw new AppError(
        ErrorCodes.INVALID_CREDENTIALS, 
        401,
        'Email o contraseña incorrectos',
        true,
        { remainingAttempts: null, maxAttempts: 5, userExists: false }
      );
    }

    // Verificar si la cuenta está bloqueada
    if (usuario.lockedUntil && usuario.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil(
        (usuario.lockedUntil.getTime() - Date.now()) / 60000
      );
      throw new AppError(
        ErrorCodes.ACCOUNT_LOCKED,
        423,
        `Cuenta bloqueada. Intenta de nuevo en ${minutesLeft} minutos`
      );
    }

    // Verificar si la cuenta está activa
    if (!usuario.activo) {
      throw new AppError(ErrorCodes.ACCOUNT_INACTIVE, 403);
    }

    // Verificar contraseña
    const isPasswordValid = await PasswordUtils.compare(
      data.password,
      usuario.passwordHash
    );

    if (!isPasswordValid) {
      const loginAttempts = usuario.loginAttempts + 1;
      const MAX_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5');

      if (loginAttempts >= MAX_ATTEMPTS) {
        const lockoutDuration = parseInt(process.env.LOCKOUT_DURATION_MINUTES || '15');
        const lockedUntil = new Date(Date.now() + lockoutDuration * 60000);

        await prisma.usuario.update({
          where: { id: usuario.id },
          data: { loginAttempts: 0, lockedUntil },
        });

        // 👇 Registrar auditoría: CUENTA BLOQUEADA
        await prisma.auditLog.create({
          data: {
            tablaAfectada: 'usuarios',
            registroId: usuario.id,
            accion: 'ACCOUNT_LOCKED',
            usuarioId: usuario.id,
            datosNuevos: {
              reason: 'Demasiados intentos fallidos',
              totalAttempts: loginAttempts,
              lockedUntil: lockedUntil,
              lockoutDurationMinutes: lockoutDuration,
            },
            ipAddress: ipAddress || null,
            userAgent: userAgent || null,
          },
        });

        EmailUtils.sendAccountLockedEmail(usuario.email, usuario.nombre)
          .catch((error) => logger.error('Error enviando email de bloqueo:', error));

        throw new AppError(
          ErrorCodes.ACCOUNT_LOCKED,
          423,
          `Cuenta bloqueada por ${lockoutDuration} minutos`,
          true,
          { remainingAttempts: 0, maxAttempts: MAX_ATTEMPTS, locked: true }
        );
      }

      // Actualizar intentos fallidos
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: { loginAttempts },
      });

      // 👇 Registrar auditoría: INTENTO FALLIDO
      await prisma.auditLog.create({
        data: {
          tablaAfectada: 'usuarios',
          registroId: usuario.id,
          accion: 'LOGIN_FAILED',
          usuarioId: usuario.id,
          datosNuevos: {
            attempt: loginAttempts,
            maxAttempts: MAX_ATTEMPTS,
            remaining: MAX_ATTEMPTS - loginAttempts,
          },
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
        },
      });
      // ✅ Verificar que remaining tenga valor
      const remaining = MAX_ATTEMPTS - loginAttempts;

      throw new AppError(
        ErrorCodes.INVALID_CREDENTIALS,
        401,
        `Email o contraseña incorrectos`,
        true,
        { 
          remainingAttempts: remaining, 
          maxAttempts: MAX_ATTEMPTS,
          userExists: true 
        }
      );
    }

    // ============================================
    // 🔐 VERIFICAR CONTRASEÑA TEMPORAL
    // ============================================
    if (usuario.passwordTemporal && usuario.fechaExpiracionPass) {
      if (new Date() > usuario.fechaExpiracionPass) {
        // Cuenta expirada, bloquear
        await prisma.usuario.update({
          where: { id: usuario.id },
          data: { activo: false },
        });
        throw new AppError(
          ErrorCodes.ACCOUNT_LOCKED,
          423,
          'Tu cuenta ha sido bloqueada. No cambiaste la contraseña temporal en el timepo establecido.Contacta al administrador.'
        );
      }

      // Si aún está en plazo, forzar cambio de contraseña
      const tempToken = TokenUtils.generateAccessToken({
        userId: usuario.id,
        email: usuario.email,
        rol: usuario.rol,
      });

      return {
        user: {
          id: usuario.id,
          email: usuario.email,
          nombre: usuario.nombre,
          apellido: usuario.apellido || undefined,
          rol: usuario.rol,
        },
        accessToken: '',
        refreshToken: '',
        requiresPasswordChange: true,  // 👈 FLAG PARA FORZAR CAMBIO
        tempToken,
      };
    }

    // Verificar email si es cliente
    if (usuario.rol === 'Cliente' && !usuario.emailVerificado) {
      throw new AppError(ErrorCodes.EMAIL_NOT_VERIFIED, 403);
    }

    // ============================================
    // 🔐 LÓGICA 2FA
    // ============================================

    // Si es Admin/Recepcion/Groomer y NO tiene 2FA → OBLIGAR a configurar
    if (
      (usuario.rol === 'Admin' || usuario.rol === 'Recepcion' || usuario.rol === 'Groomer') &&
      !usuario.twoFactorEnabled
    ) {
      const tempToken = TokenUtils.generateAccessToken({
        userId: usuario.id,
        email: usuario.email,
        rol: usuario.rol,
      });

      return {
        user: {
          id: usuario.id,
          email: usuario.email,
          nombre: usuario.nombre,
          apellido: usuario.apellido || undefined,
          rol: usuario.rol,
        },
        accessToken: '',
        refreshToken: '',
        requires2FA: true,
        setupRequired: true,
        tempToken,
      };
    }

    // Si tiene 2FA activado, pedir código
    if (usuario.twoFactorEnabled && usuario.twoFactorSecret) {
      if (!data.twoFactorCode) {
        return {
          user: {
            id: usuario.id,
            email: usuario.email,
            nombre: usuario.nombre,
            apellido: usuario.apellido || undefined,
            rol: usuario.rol,
          },
          accessToken: '',
          refreshToken: '',
          requires2FA: true,
          setupRequired: false,
        };
      }

      const is2FAValid = TOTPUtils.verifyToken(usuario.twoFactorSecret, data.twoFactorCode);
      if (!is2FAValid) {
        throw new AppError(ErrorCodes.INVALID_2FA_CODE, 401);
      }
    }

    // ============================================

    // Resetear intentos fallidos y actualizar último acceso
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
        ultimoAcceso: new Date(),
      },
    });

    // Generar tokens
    const tokenPayload: TokenPayload = {
      userId: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
    };

    const accessToken = TokenUtils.generateAccessToken(tokenPayload);
    const refreshToken = TokenUtils.generateRefreshToken(tokenPayload);

    // Crear sesión
    const session = await prisma.sesionUsuario.create({
      data: {
        usuarioId: usuario.id,
        tokenJwt: accessToken,
        refreshToken,
        ipAddress,
        userAgent,
        fechaExpiracion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const accessTokenWithSession = TokenUtils.generateAccessToken({
      ...tokenPayload,
      sessionId: session.id,
    });

    // Registrar auditoría
    await prisma.auditLog.create({
      data: {
        tablaAfectada: 'usuarios',
        registroId: usuario.id,
        accion: 'LOGIN',
        usuarioId: usuario.id,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    });

    return {
      user: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        apellido: usuario.apellido || undefined,
        rol: usuario.rol,
      },
      accessToken: accessTokenWithSession,
      refreshToken,
    };
  }

    /**
     * Verificar email
     */
    static async verifyEmail(token: string): Promise<{ message: string }> {
      const { userId } = TokenUtils.verifyEmailToken(token);
      const usuario = await prisma.usuario.findUnique({ where: { id: userId } });

      if (!usuario) throw new AppError(ErrorCodes.USER_NOT_FOUND, 404);
      if (usuario.emailVerificado) return { message: 'El email ya estaba verificado' };

      await prisma.usuario.update({
        where: { id: userId },
        data: { emailVerificado: true, verificationToken: null },
      });

      return { message: 'Email verificado exitosamente. Ya puedes iniciar sesión' };
    }

    /**
   * Verificar email con código de 6 dígitos
   */
  static async verifyEmailWithCode(email: string, code: string): Promise<{ message: string; valid: boolean }> {
    const usuario = await prisma.usuario.findUnique({ where: { email } });

    if (!usuario) {
      throw new AppError(ErrorCodes.USER_NOT_FOUND, 404);
    }

    if (usuario.emailVerificado) {
      return { message: 'El email ya estaba verificado', valid: true };
    }

    // Verificar código
    if (usuario.verificationToken !== code) {
      return { message: 'Código de verificación incorrecto', valid: false };
    }

    // Verificar expiración
    if (usuario.codeExpiresAt && new Date() > usuario.codeExpiresAt) {
      return { message: 'El código ha expirado. Solicita uno nuevo.', valid: false };
    }

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        emailVerificado: true,
        verificationToken: null,
        codeExpiresAt: null,
      },
    });

    return { message: 'Email verificado exitosamente', valid: true };
  }

  /**
   * Reenviar email de verificación
   */
  static async resendVerification(email: string): Promise<{ message: string }> {
    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario) throw new AppError(ErrorCodes.USER_NOT_FOUND, 404);
    if (usuario.emailVerificado) return { message: 'El email ya está verificado' };

    const verificationToken = TokenUtils.generateEmailVerificationToken(usuario.id);
    await prisma.usuario.update({ where: { id: usuario.id }, data: { verificationToken } });
    await EmailUtils.sendVerificationEmail(email, usuario.nombre, verificationToken);

    return { message: 'Email de verificación reenviado' };
  }

  /**
   * Solicitar recuperación de contraseña
   */
  static async forgotPassword(email: string): Promise<{ message: string }> {
    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario || !usuario.activo) {
      return { message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña' };
    }
    const resetToken = TokenUtils.generatePasswordResetToken(usuario.id);
    await EmailUtils.sendPasswordResetEmail(email, usuario.nombre, resetToken);
    return { message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña' };
  }

  /**
   * Resetear contraseña
   */
  static async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const { userId } = TokenUtils.verifyPasswordResetToken(token);
    const passwordValidation = PasswordUtils.validateStrength(newPassword);
    if (!passwordValidation.isValid) {
      throw new AppError(ErrorCodes.PASSWORD_TOO_WEAK, 422, `Contraseña débil: ${passwordValidation.errors.join('. ')}`);
    }
    const passwordHash = await PasswordUtils.hash(newPassword);
    await prisma.usuario.update({
      where: { id: userId },
      data: { passwordHash, loginAttempts: 0, lockedUntil: null },
    });
    await prisma.sesionUsuario.updateMany({
      where: { usuarioId: userId, activa: true },
      data: { activa: false },
    });
    return { message: 'Contraseña restablecida exitosamente' };
  }

  /**
   * Cambiar contraseña (usuario autenticado o con token temporal)
   */
  static async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
    isTemporalChange: boolean = false  // 👈 Si es cambio obligatorio
  ): Promise<{ message: string }> {
    const usuario = await prisma.usuario.findUnique({ where: { id: userId } });
    if (!usuario) throw new AppError(ErrorCodes.USER_NOT_FOUND, 404);

    // Si NO es cambio temporal, verificar contraseña actual
    if (!isTemporalChange) {
      const isPasswordValid = await PasswordUtils.compare(currentPassword, usuario.passwordHash);
      if (!isPasswordValid) {
        throw new AppError(ErrorCodes.INVALID_CREDENTIALS, 401, 'Contraseña actual incorrecta');
      }
    }

    const passwordValidation = PasswordUtils.validateStrength(newPassword);
    if (!passwordValidation.isValid) {
      throw new AppError(ErrorCodes.PASSWORD_TOO_WEAK, 422, `Contraseña débil: ${passwordValidation.errors.join('. ')}`);
    }

    const passwordHash = await PasswordUtils.hash(newPassword);

    // Actualizar contraseña y quitar flag de temporal
    await prisma.usuario.update({
      where: { id: userId },
      data: {
        passwordHash,
        passwordTemporal: false,        // 👈 Ya no es temporal
        fechaExpiracionPass: null,      // 👈 Limpiar fecha de expiración
      },
    });

    return { message: 'Contraseña cambiada exitosamente' };
  }

  /**
   * Configurar 2FA
   */
  static async setupTwoFactor(userId: number): Promise<TwoFactorSetupResponse> {
    const usuario = await prisma.usuario.findUnique({ where: { id: userId } });
    if (!usuario) throw new AppError(ErrorCodes.USER_NOT_FOUND, 404);
    const { secret, otpauthUrl } = TOTPUtils.generateSecret(usuario.email);
    const qrCode = await TOTPUtils.generateQRCode(otpauthUrl);
    return {
      secret,
      qrCode,
      recoveryCodes: Array.from({ length: 5 }, () => TOTPUtils.generateRecoveryCode()),
    };
  }

  /**
   * Verificar y activar 2FA
   */
  static async verifyAndEnable2FA(userId: number, secret: string, code: string): Promise<{ message: string }> {
    const isValid = TOTPUtils.verifyToken(secret, code);
    if (!isValid) throw new AppError(ErrorCodes.INVALID_2FA_CODE, 400);
    await prisma.usuario.update({
      where: { id: userId },
      data: { twoFactorSecret: secret, twoFactorEnabled: true },
    });
    return { message: 'Autenticación de dos factores activada exitosamente' };
  }

  /**
   * Desactivar 2FA
   */
  static async disableTwoFactor(userId: number, code: string): Promise<{ message: string }> {
    const usuario = await prisma.usuario.findUnique({ where: { id: userId } });
    if (!usuario || !usuario.twoFactorSecret) throw new AppError(ErrorCodes.USER_NOT_FOUND, 404);
    const isValid = TOTPUtils.verifyToken(usuario.twoFactorSecret, code);
    if (!isValid) throw new AppError(ErrorCodes.INVALID_2FA_CODE, 400);
    await prisma.usuario.update({
      where: { id: userId },
      data: { twoFactorSecret: null, twoFactorEnabled: false },
    });
    return { message: 'Autenticación de dos factores desactivada' };
  }

  /**
   * Renovar access token
   */
  static async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = TokenUtils.verifyRefreshToken(refreshToken);
    const session = await prisma.sesionUsuario.findFirst({
      where: { usuarioId: payload.userId, refreshToken, activa: true },
    });
    if (!session) throw new AppError(ErrorCodes.INVALID_TOKEN, 401, 'Sesión no encontrada');
    const usuario = await prisma.usuario.findUnique({ where: { id: payload.userId } });
    if (!usuario || !usuario.activo) throw new AppError(ErrorCodes.ACCOUNT_INACTIVE, 403);
    const newPayload: TokenPayload = { userId: usuario.id, email: usuario.email, rol: usuario.rol, sessionId: session.id };
    const newAccessToken = TokenUtils.generateAccessToken(newPayload);
    const newRefreshToken = TokenUtils.generateRefreshToken(newPayload);
    await prisma.sesionUsuario.update({
      where: { id: session.id },
      data: { tokenJwt: newAccessToken, refreshToken: newRefreshToken },
    });
    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  /**
   * Cerrar sesión
   */
  static async logout(userId: number, sessionId: number): Promise<{ message: string }> {
    await prisma.sesionUsuario.update({ where: { id: sessionId }, data: { activa: false } });
    await prisma.auditLog.create({
      data: {
        tablaAfectada: 'sesiones_usuario',
        registroId: sessionId,
        accion: 'LOGOUT',
        usuarioId: userId,
      },
    });
    return { message: 'Sesión cerrada exitosamente' };
  }

  /**
   * Obtener sesiones activas
   */
  static async getActiveSessions(userId: number): Promise<SessionInfo[]> {
    const sessions = await prisma.sesionUsuario.findMany({
      where: { usuarioId: userId, activa: true, fechaExpiracion: { gt: new Date() } },
      select: { id: true, ipAddress: true, userAgent: true, createdAt: true, fechaExpiracion: true },
      orderBy: { createdAt: 'desc' },
    });
    return sessions.map((s) => ({
      id: s.id,
      ipAddress: s.ipAddress || undefined,
      userAgent: s.userAgent || undefined,
      createdAt: s.createdAt,
      expiresAt: s.fechaExpiracion,
    }));
  }
}