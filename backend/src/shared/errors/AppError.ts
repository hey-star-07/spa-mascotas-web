import { ErrorCode, ErrorMessages } from './errorCodes';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: ErrorCode;
  public readonly isOperational: boolean;
  public readonly extra?: Record<string, any>;

  constructor(
    errorCode: ErrorCode,
    statusCode: number = 400,
    message?: string,
    isOperational: boolean = true,
    extra?: Record<string, any>
  ) {
    super(message || ErrorMessages[errorCode]);
    this.errorCode = errorCode;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.extra = extra;
    // Capturar stack trace
    Error.captureStackTrace(this, this.constructor);
    
    // Mantener el nombre de la clase
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON() {
    return {
      status: 'error',
      code: this.errorCode,
      message: this.message,
      ...(this.extra || {}),
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack }),
    };
  }
}