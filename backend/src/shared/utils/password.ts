import bcrypt from 'bcrypt';
import { AppError } from '../errors/AppError';
import { ErrorCodes } from '../errors/errorCodes';

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');

export class PasswordUtils {
  /**
   * Hashea una contraseña usando bcrypt
   */
  static async hash(password: string): Promise<string> {
    try {
      return await bcrypt.hash(password, SALT_ROUNDS);
    } catch (error) {
      throw new AppError(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        500,
        'Error al encriptar la contraseña'
      );
    }
  }

  /**
   * Compara una contraseña plana con un hash
   */
  static async compare(password: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      throw new AppError(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        500,
        'Error al verificar la contraseña'
      );
    }
  }

  /**
   * Valida la fortaleza de una contraseña
   * Reglas:
   * - Mínimo 8 caracteres
   * - Al menos una mayúscula
   * - Al menos una minúscula
   * - Al menos un número
   * - Al menos un símbolo especial
   */
  static validateStrength(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('La contraseña debe tener al menos 8 caracteres');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('La contraseña debe contener al menos una letra mayúscula');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('La contraseña debe contener al menos una letra minúscula');
    }

    if (!/\d/.test(password)) {
      errors.push('La contraseña debe contener al menos un número');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('La contraseña debe contener al menos un símbolo especial (!@#$%^&*)');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Calcula la fortaleza de la contraseña (0-100)
   */
  static calculateStrength(password: string): number {
    let score = 0;

    // Longitud
    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;

    // Complejidad
    if (/[A-Z]/.test(password)) score += 15;
    if (/[a-z]/.test(password)) score += 15;
    if (/\d/.test(password)) score += 15;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 15;

    return Math.min(score, 100);
  }
}