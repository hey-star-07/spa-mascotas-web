import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { jwtConfig } from '../../config/jwt';
import { AppError } from '../errors/AppError';
import { ErrorCodes } from '../errors/errorCodes';

export interface TokenPayload {
  userId: number;
  email: string;
  rol: string;
  sessionId?: number;
}

export class TokenUtils {
  /**
   * Genera un access token JWT
   */
  static generateAccessToken(payload: TokenPayload): string {
    try {
      return jwt.sign(payload, jwtConfig.secret, {
        expiresIn: jwtConfig.expiration,
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience,
        jwtid: uuidv4(),
      });
    } catch (error) {
      throw new AppError(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        500,
        'Error al generar el token de acceso'
      );
    }
  }

  /**
   * Genera un refresh token JWT
   */
  static generateRefreshToken(payload: TokenPayload): string {
    try {
      return jwt.sign(payload, jwtConfig.refreshSecret, {
        expiresIn: jwtConfig.refreshExpiration,
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience,
        jwtid: uuidv4(),
      });
    } catch (error) {
      throw new AppError(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        500,
        'Error al generar el token de actualización'
      );
    }
  }

  /**
   * Verifica un access token
   */
  static verifyAccessToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, jwtConfig.secret, {
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience,
      }) as TokenPayload;
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError(ErrorCodes.TOKEN_EXPIRED, 401);
      }
      throw new AppError(ErrorCodes.INVALID_TOKEN, 401);
    }
  }

  /**
   * Verifica un refresh token
   */
  static verifyRefreshToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, jwtConfig.refreshSecret, {
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience,
      }) as TokenPayload;
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError(ErrorCodes.TOKEN_EXPIRED, 401);
      }
      throw new AppError(ErrorCodes.INVALID_TOKEN, 401);
    }
  }

  /**
   * Genera un token de verificación de email
   */
  static generateEmailVerificationToken(userId: number): string {
    try {
      return jwt.sign(
        { userId, type: 'email-verification' },
        jwtConfig.secret,
        { expiresIn: '15m' }
      );
    } catch (error) {
      throw new AppError(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        500,
        'Error al generar el token de verificación'
      );
    }
  }

  /**
   * Verifica un token de email
   */
  static verifyEmailToken(token: string): { userId: number } {
    try {
      const decoded = jwt.verify(token, jwtConfig.secret) as any;
      if (decoded.type !== 'email-verification') {
        throw new AppError(ErrorCodes.INVALID_TOKEN, 400);
      }
      return { userId: decoded.userId };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCodes.TOKEN_EXPIRED, 400, 'El enlace de verificación ha expirado (15 minutos)');
    }
  }

  /**
   * Genera un token para reset de contraseña
   */
  static generatePasswordResetToken(userId: number): string {
    try {
      return jwt.sign(
        { userId, type: 'password-reset' },
        jwtConfig.secret,
        { expiresIn: '30m' }
      );
    } catch (error) {
      throw new AppError(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        500,
        'Error al generar el token de recuperación'
      );
    }
  }

  /**
   * Verifica un token de reset de contraseña
   */
  static verifyPasswordResetToken(token: string): { userId: number } {
    try {
      const decoded = jwt.verify(token, jwtConfig.secret) as any;
      if (decoded.type !== 'password-reset') {
        throw new AppError(ErrorCodes.INVALID_TOKEN, 400);
      }
      return { userId: decoded.userId };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCodes.TOKEN_EXPIRED, 400, 'El enlace de recuperación ha expirado (30 minutos)');
    }
  }
}