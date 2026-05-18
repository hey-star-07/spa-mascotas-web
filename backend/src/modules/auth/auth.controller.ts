import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { PasswordUtils } from '../../shared/utils/password';
import { EmailUtils } from '../../shared/utils/email';
import { logger } from '../../config/logger';
import prisma from '../../config/database';
import { OAuth2Client } from 'google-auth-library';
import { TokenUtils } from '../../shared/utils/tokens';


export class AuthController {
  /**
   * POST /api/auth/register/client
   * Registro de cliente (auto-registro)
   */
  static async registerClient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, nombre, apellido, telefono, direccion } = req.body;
      
      const result = await AuthService.registerClient({
        email,
        password,
        nombre,
        apellido,
        telefono,
        direccion,
      });

      logger.info(`Nuevo cliente registrado: ${email}`);
      
      res.status(201).json({
        status: 'success',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/register/staff
   * Registro de personal (solo Admin)
   */
  static async registerStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, nombre, apellido, telefono, ci, direccion, rol, especialidad, turno } = req.body;
      
      const result = await AuthService.registerStaff({
        email,
        password,
        nombre,
        apellido,
        telefono,
        ci,
        direccion,
        rol,
        especialidad,
        turno,
      });

      logger.info(`Nuevo personal registrado: ${email} (${rol})`);
      
      res.status(201).json({
        status: 'success',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   * Inicio de sesión
   */
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, twoFactorCode } = req.body;
      
      const result = await AuthService.login(
        { email, password, twoFactorCode },
        req.ip,
        req.headers['user-agent']
      );

      logger.info(`Login exitoso: ${email}`);
      
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/verify-email/:token
   * Verificación de email (link antiguo - mantener compatibilidad)
   */
  static async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.params;
      
      const result = await AuthService.verifyEmail(token);

      logger.info('Email verificado exitosamente');
      
      res.status(200).json({
        status: 'success',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/verify-email-code
   * Verificar email con código de 6 dígitos
   */
  static async verifyEmailWithCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, code } = req.body;
      
      const result = await AuthService.verifyEmailWithCode(email, code);

      res.status(200).json({
        status: 'success',
        data: result,  // 👈 Incluir result en data para que el frontend acceda a result.valid
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/resend-verification-code
   * Reenviar código de verificación
   */
  static async resendVerificationCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      
      const usuario = await prisma.usuario.findUnique({ where: { email } });
      if (!usuario || usuario.emailVerificado) {
        res.status(200).json({
          status: 'success',
          message: 'Si el email existe y no está verificado, recibirás un nuevo código.',
        });
        return;
      }

      // Generar nuevo código
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const codeExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await prisma.usuario.update({
        where: { id: usuario.id },
        data: { verificationToken: verificationCode, codeExpiresAt },
      });

      await EmailUtils.sendVerificationEmail(email, usuario.nombre, verificationCode);

      res.status(200).json({
        status: 'success',
        message: 'Nuevo código enviado. Revisa tu email.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/resend-verification
   * Reenviar email de verificación (link antiguo)
   */
  static async resendVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      
      const result = await AuthService.resendVerification(email);

      res.status(200).json({
        status: 'success',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/forgot-password
   * Solicitar recuperación de contraseña
   */
  static async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      
      const result = await AuthService.forgotPassword(email);

      res.status(200).json({
        status: 'success',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/reset-password/:token
   * Resetear contraseña
   */
  static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.params;
      const { newPassword } = req.body;
      
      const result = await AuthService.resetPassword(token, newPassword);

      res.status(200).json({
        status: 'success',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/change-password
   * Cambiar contraseña (usuario autenticado)
   */
  static async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { currentPassword, newPassword } = req.body;
      
      const result = await AuthService.changePassword(userId, currentPassword, newPassword);

      res.status(200).json({
        status: 'success',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/change-password-temporal
   * Cambiar contraseña temporal (primer inicio de sesión)
   */
  static async changePasswordTemporal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { newPassword } = req.body;
      
      const result = await AuthService.changePassword(userId, '', newPassword, true);
      
      res.status(200).json({
        status: 'success',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/refresh-token
   * Renovar access token
   */
  static async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      
      const result = await AuthService.refreshAccessToken(refreshToken);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/logout
   * Cerrar sesión
   */
  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const sessionId = req.user!.sessionId;
      
      if (!sessionId) {
        res.status(400).json({
          status: 'error',
          message: 'No se pudo identificar la sesión',
        });
        return;
      }
      
      const result = await AuthService.logout(userId, sessionId);

      res.status(200).json({
        status: 'success',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/setup-2fa
   * Configurar autenticación de dos factores
   */
  static async setupTwoFactor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      
      const result = await AuthService.setupTwoFactor(userId);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/enable-2fa
   * Activar 2FA
   */
  static async enableTwoFactor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { secret, code } = req.body;
      
      const result = await AuthService.verifyAndEnable2FA(userId, secret, code);

      res.status(200).json({
        status: 'success',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/disable-2fa
   * Desactivar 2FA
   */
  static async disableTwoFactor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { code } = req.body;
      
      const result = await AuthService.disableTwoFactor(userId, code);

      res.status(200).json({
        status: 'success',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/sessions
   * Obtener sesiones activas
   */
  static async getActiveSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      
      const sessions = await AuthService.getActiveSessions(userId);

      res.status(200).json({
        status: 'success',
        data: sessions,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/me
   * Obtener perfil del usuario autenticado
   */
  static async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      
      const usuario = await prisma.usuario.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          nombre: true,
          apellido: true,
          telefono: true,
          rol: true,
          twoFactorEnabled: true,
          emailVerificado: true,
          ultimoAcceso: true,
          createdAt: true,
          cliente: {
            select: {
              direccionFisica: true,
              canalNotificacionPreferido: true,
            },
          },
          groomer: {
            select: {
              especialidad: true,
              capacidadSimultanea: true,
              activo: true,
            },
          },
        },
      });

      if (!usuario) {
        res.status(404).json({
          status: 'error',
          message: 'Usuario no encontrado',
        });
        return;
      }

      res.status(200).json({
        status: 'success',
        data: usuario,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/password-strength
   * Verificar fortaleza de contraseña
   */
  static async checkPasswordStrength(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { password } = req.body;
      
      const validation = PasswordUtils.validateStrength(password);
      const strength = PasswordUtils.calculateStrength(password);

      res.status(200).json({
        status: 'success',
        data: {
          isValid: validation.isValid,
          errors: validation.errors,
          strength,
          strengthLabel: 
            strength < 30 ? 'Débil' :
            strength < 60 ? 'Regular' :
            strength < 80 ? 'Buena' : 'Excelente',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/google
   */
  static async googleAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const oauth2Client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.APP_URL}/api/auth/google/callback`
      );

      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['profile', 'email'],
        prompt: 'select_account',
      });

      res.redirect(authUrl);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/google/callback
   */
  static async googleCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code } = req.query;

      if (!code) {
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?error=google_auth_failed`);
        return;
      }

      const oauth2Client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.APP_URL}/api/auth/google/callback`
      );

      const { tokens } = await oauth2Client.getToken(code as string);
      oauth2Client.setCredentials(tokens);

      const ticket = await oauth2Client.verifyIdToken({
        idToken: tokens.id_token as string,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?error=google_auth_failed`);
        return;
      }

      const email = payload.email;
      const nombre = payload.given_name || payload.name?.split(' ')[0] || 'Usuario';
      const apellido = payload.family_name || '';

      // Buscar si ya existe
      let usuario = await prisma.usuario.findUnique({ where: { email } });

      if (usuario) {
        // ============================================
        // USUARIO YA EXISTE - LOGIN DIRECTO
        // ============================================
        
        // Si es Admin/Recepcion/Groomer y no tiene 2FA → obligar
        if (
          (usuario.rol === 'Admin' || usuario.rol === 'Recepcion' || usuario.rol === 'Groomer') &&
          !usuario.twoFactorEnabled
        ) {
          const tempToken = TokenUtils.generateAccessToken({
            userId: usuario.id,
            email: usuario.email,
            rol: usuario.rol,
          });

          res.redirect(
            `${process.env.FRONTEND_URL || 'http://localhost:3001'}/setup-2fa?token=${tempToken}`
          );
          return;
        }

        // Login normal
        const tokenPayload = { userId: usuario.id, email: usuario.email, rol: usuario.rol };
        const accessToken = TokenUtils.generateAccessToken(tokenPayload);
        const refreshToken = TokenUtils.generateRefreshToken(tokenPayload);

        await prisma.sesionUsuario.create({
          data: {
            usuarioId: usuario.id,
            tokenJwt: accessToken,
            refreshToken,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            fechaExpiracion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        });

        const accessTokenWithSession = TokenUtils.generateAccessToken({
          ...tokenPayload,
          sessionId: (await prisma.sesionUsuario.findFirst({ where: { tokenJwt: accessToken }, orderBy: { createdAt: 'desc' } }))?.id,
        });

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
        res.redirect(
          `${frontendUrl}/google-callback?accessToken=${accessTokenWithSession}&refreshToken=${refreshToken}`
        );
        return;
      }

      // ============================================
      // USUARIO NUEVO - NO CREAR AÚN, REDIRIGIR A FORMULARIO
      // ============================================
      
      // Encriptar datos de Google para pasarlos al frontend
      const googleData = JSON.stringify({ email, nombre, apellido });
      const encodedData = Buffer.from(googleData).toString('base64');
      
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      res.redirect(
        `${frontendUrl}/complete-profile?googleData=${encodedData}`
      );

    } catch (error) {
      logger.error('Error en Google OAuth:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?error=google_auth_failed`);
    }
  }

    /**
   * POST /api/auth/register/google
   * Registro de cliente con Google (email verificado automáticamente)
   */
  static async registerGoogleClient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, nombre, apellido, telefono, ci, direccion } = req.body;
      
      // Verificar si el email ya existe
      const existingUser = await prisma.usuario.findUnique({
        where: { email },
      });

      if (existingUser) {
        // Si ya existe, hacer login directo
        const tokenPayload = { userId: existingUser.id, email: existingUser.email, rol: existingUser.rol };
        const accessToken = TokenUtils.generateAccessToken(tokenPayload);
        const refreshToken = TokenUtils.generateRefreshToken(tokenPayload);
        
        res.status(200).json({
          status: 'success',
          data: {
            user: {
              id: existingUser.id,
              email: existingUser.email,
              nombre: existingUser.nombre,
              apellido: existingUser.apellido || undefined,
              rol: existingUser.rol,
            },
            accessToken,
            refreshToken,
          },
        });
        return;
      }

      // Generar contraseña aleatoria
      const randomPassword = Math.random().toString(36).slice(-16) + 'Aa1!';
      const passwordHash = await PasswordUtils.hash(randomPassword);

      // Crear usuario con email verificado
      const usuario = await prisma.usuario.create({
        data: {
          email,
          passwordHash,
          nombre,
          apellido: apellido || null,
          telefono: telefono || null,
          rol: 'Cliente',
          emailVerificado: true,  // 👈 VERIFICADO AUTOMÁTICAMENTE
        },
      });

      await prisma.cliente.create({
        data: {
          usuarioId: usuario.id,
          direccionFisica: direccion || null,
          canalNotificacionPreferido: 'Email',
        },
      });

      logger.info(`Nuevo cliente registrado con Google: ${email}`);

      // Hacer login automático
      const tokenPayload = { userId: usuario.id, email: usuario.email, rol: usuario.rol };
      const accessToken = TokenUtils.generateAccessToken(tokenPayload);
      const refreshToken = TokenUtils.generateRefreshToken(tokenPayload);

      await prisma.sesionUsuario.create({
        data: {
          usuarioId: usuario.id,
          tokenJwt: accessToken,
          refreshToken,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          fechaExpiracion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      res.status(201).json({
        status: 'success',
        data: {
          user: {
            id: usuario.id,
            email: usuario.email,
            nombre: usuario.nombre,
            apellido: usuario.apellido || undefined,
            rol: usuario.rol,
          },
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}