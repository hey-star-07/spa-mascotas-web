import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { AppError } from '../errors/AppError';
import { ErrorCodes } from '../errors/errorCodes';

export class TOTPUtils {
  /**
   * Genera un secreto para 2FA
   */
  static generateSecret(email: string): { secret: string; otpauthUrl: string } {
    try {
      const secret = speakeasy.generateSecret({
        name: `Pet Spa (${email})`,
        length: 20,
      });

      return {
        secret: secret.base32,
        otpauthUrl: secret.otpauth_url || '',
      };
    } catch (error) {
      throw new AppError(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        500,
        'Error al generar el secreto 2FA'
      );
    }
  }

  /**
   * Genera un código QR para el secreto 2FA
   */
  static async generateQRCode(otpauthUrl: string): Promise<string> {
    try {
      return await QRCode.toDataURL(otpauthUrl);
    } catch (error) {
      throw new AppError(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        500,
        'Error al generar el código QR'
      );
    }
  }

  /**
   * Verifica un código TOTP
   */
  static verifyToken(secret: string, token: string): boolean {
    try {
      return speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: token,
        window: 1, // Permite 1 paso de desfase (30 segundos)
      });
    } catch (error) {
      return false;
    }
  }

  /**
   * Genera un código de recuperación de 6 dígitos
   */
  static generateRecoveryCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}