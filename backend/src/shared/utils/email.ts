import { emailTransporter, emailConfig } from '../../config/email';
import { logger } from '../../config/logger';
import { AppError } from '../errors/AppError';
import { ErrorCodes } from '../errors/errorCodes';

export class EmailUtils {
  /**
   * Envía un email de verificación con código de 6 dígitos
   */
  static async sendVerificationEmail(
    to: string,
    nombre: string,
    verificationCode: string  // 👈 CÓDIGO DE 6 DÍGITOS
  ): Promise<void> {
    console.log('📧 Intentando enviar email a:', to, 'con código:', verificationCode); // 👈 DEBUG

    const mailOptions = {
      from: `"Pet Spa" <${emailConfig.from}>`,
      to,
      subject: 'Código de Verificación - Pet Spa',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background-color: #FFF8F0; border: 3px solid #2D2D2D; border-radius: 16px; padding: 30px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <span style="font-size: 48px;">🐾</span>
            <h1 style="color: #2D2D2D; font-size: 24px; margin: 10px 0;">Pet Spa</h1>
          </div>
          
          <h2 style="color: #2D2D2D; font-size: 20px;">Verificación de Email</h2>
          <p style="font-size: 16px; color: #555;">Hola <strong>${nombre}</strong>,</p>
          <p style="font-size: 16px; color: #555;">Para completar tu registro, usa el siguiente código de verificación:</p>
          
          <div style="background-color: #A8D5BA; border: 3px solid #2D2D2D; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
            <p style="font-size: 14px; margin: 0 0 5px 0; font-weight: bold;">Tu código de verificación:</p>
            <p style="font-size: 36px; font-weight: 900; letter-spacing: 8px; margin: 0; font-family: monospace; color: #2D2D2D;">${verificationCode}</p>
          </div>
          
          <p style="font-size: 14px; color: #888;">
            ⏱️ Este código es válido por <strong>15 minutos</strong>.<br>
            Si no solicitaste esta verificación, ignora este mensaje.
          </p>
          
          <hr style="border: 2px solid #2D2D2D; margin: 20px 0;">
          <p style="font-size: 12px; color: #888; text-align: center;">
            © 2026 Pet Spa. Todos los derechos reservados.
          </p>
        </div>
      `,
    };

    try {
      const info = await emailTransporter.sendMail(mailOptions);
      console.log('✅ Email enviado exitosamente:', info.messageId); // 👈 DEBUG
      logger.info(`Email de verificación enviado a ${to}`);
    } catch (error) {
      console.error('❌ Error al enviar email:', error); // 👈 DEBUG
      logger.error(`Error al enviar email de verificación a ${to}:`, error);
      throw new AppError(ErrorCodes.EMAIL_SEND_ERROR, 500);
    }
  }

  /**
   * Envía un email de recuperación de contraseña
   */
  static async sendPasswordResetEmail(
    to: string,
    nombre: string,
    resetToken: string
  ): Promise<void> {
    const resetLink = `${emailConfig.appUrl}/api/auth/reset-password/${resetToken}`;

    const mailOptions = {
      from: `"Pet Spa" <${emailConfig.from}>`,
      to,
      subject: 'Recuperación de contraseña - Pet Spa',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #7C8B9E;">Recuperación de Contraseña</h1>
          <p>Hola ${nombre},</p>
          <p>Hemos recibido una solicitud para restablecer tu contraseña.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="background-color: #E8A87C; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 5px; font-size: 16px;">
              Restablecer Contraseña
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            Este enlace expirará en 30 minutos.<br>
            Si no solicitaste este cambio, puedes ignorar este mensaje.
          </p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">
            Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
            ${resetLink}
          </p>
        </div>
      `,
    };

    try {
      await emailTransporter.sendMail(mailOptions);
      logger.info(`Email de recuperación enviado a ${to}`);
    } catch (error) {
      logger.error(`Error al enviar email de recuperación a ${to}:`, error);
      throw new AppError(ErrorCodes.EMAIL_SEND_ERROR, 500);
    }
  }

  /**
   * Envía una notificación de cuenta bloqueada
   */
  static async sendAccountLockedEmail(to: string, nombre: string): Promise<void> {
    const mailOptions = {
      from: `"Pet Spa" <${emailConfig.from}>`,
      to,
      subject: 'Cuenta bloqueada temporalmente - Pet Spa',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #E07A5F;">Cuenta Bloqueada Temporalmente</h1>
          <p>Hola ${nombre},</p>
          <p>Tu cuenta ha sido bloqueada temporalmente debido a múltiples intentos fallidos de inicio de sesión.</p>
          <p>Podrás intentar nuevamente en 15 minutos.</p>
          <p style="color: #666; font-size: 14px;">
            Si no fuiste tú quien intentó acceder, te recomendamos cambiar tu contraseña inmediatamente.
          </p>
        </div>
      `,
    };

    try {
      await emailTransporter.sendMail(mailOptions);
      logger.info(`Notificación de bloqueo enviada a ${to}`);
    } catch (error) {
      logger.error(`Error al enviar notificación de bloqueo a ${to}:`, error);
    }
  }

  // Agrega este método dentro de la clase EmailUtils:
/**
 * Envía un email de bienvenida con contraseña temporal al personal
 */
  static async sendWelcomeEmail(
    to: string,
    nombre: string,
    rol: string,
    passwordTemporal: string
  ): Promise<void> {
    const loginLink = `${emailConfig.appUrl}/login`;

    const mailOptions = {
      from: `"Pet Spa" <${emailConfig.from}>`,
      to,
      subject: 'Bienvenido a Pet Spa - Credenciales de Acceso',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FFF8F0; border: 3px solid #2D2D2D; border-radius: 16px; padding: 30px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <span style="font-size: 48px;">🐾</span>
            <h1 style="color: #2D2D2D; font-size: 28px; margin: 10px 0;">Pet Spa</h1>
          </div>
          
          <h2 style="color: #2D2D2D;">¡Bienvenido/a, ${nombre}!</h2>
          <p style="font-size: 16px; color: #555;">Has sido registrado/a como <strong>${rol}</strong> en Pet Spa.</p>
          
          <div style="background-color: #A8D5BA; border: 3px solid #2D2D2D; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
            <p style="font-size: 14px; margin: 0 0 10px 0; font-weight: bold;">Tus credenciales de acceso:</p>
            <p style="font-size: 14px; margin: 5px 0;"><strong>Email:</strong> ${to}</p>
            <p style="font-size: 14px; margin: 5px 0;"><strong>Contraseña temporal:</strong> <span style="background: white; padding: 4px 12px; border: 2px solid #2D2D2D; border-radius: 8px; font-family: monospace; font-size: 16px;">${passwordTemporal}</span></p>
          </div>
          
          <div style="background-color: #E8A87C; border: 3px solid #2D2D2D; border-radius: 12px; padding: 15px; margin: 20px 0;">
            <p style="font-size: 14px; font-weight: bold; margin: 0;">⚠️ Importante:</p>
            <ul style="font-size: 14px; margin: 10px 0;">
              <li>Esta es una contraseña temporal.</li>
              <li>Si no la cambias, tu cuenta será bloqueada automáticamente.</li>
              <li>Al iniciar sesión por primera vez, se te pedirá cambiar tu contraseña.</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0 20px 0;">
            <a href="${loginLink}" style="background-color: #2D2D2D; color: white; padding: 14px 40px; text-decoration: none; border-radius: 12px; font-size: 16px; font-weight: bold; display: inline-block;">
              Iniciar Sesión
            </a>
          </div>
          
          <hr style="border: 2px solid #2D2D2D; margin: 20px 0;">
          <p style="font-size: 12px; color: #888; text-align: center;">
            © 2026 Pet Spa. Todos los derechos reservados.<br>
            Si no reconoces este registro, ignora este mensaje.
          </p>
        </div>
      `,
    };

    try {
      await emailTransporter.sendMail(mailOptions);
      logger.info(`Email de bienvenida enviado a ${to} (${rol})`);
    } catch (error) {
      logger.error(`Error al enviar email de bienvenida a ${to}:`, error);
      // No lanzar error para no interrumpir el flujo de registro
    }
  }
}