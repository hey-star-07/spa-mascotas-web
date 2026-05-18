import nodemailer from 'nodemailer';
import { logger } from './logger';

export const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
  port: parseInt(process.env.SMTP_PORT || '2525'),
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

export const emailConfig = {
  from: process.env.EMAIL_FROM || 'noreply@petspa.com',
  appUrl: process.env.APP_URL || 'http://localhost:3000',
};

// Verificar conexión al iniciar
emailTransporter.verify()
  .then(() => {
    logger.info('📧 Servicio de email configurado correctamente');
  })
  .catch((error) => {
    logger.warn('⚠️  Servicio de email no disponible:', error.message);
  });