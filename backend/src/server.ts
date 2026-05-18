import app from './app';
import { logger } from './config/logger';

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  logger.info(`🚀 Pet Spa API corriendo en http://localhost:${PORT}`);
  logger.info(`📁 Documentación: http://localhost:${PORT}/api/docs`);
  logger.info(`🏥 Health Check: http://localhost:${PORT}/api/health`);
});

// Manejo de errores no capturados
process.on('unhandledRejection', (reason: Error) => {
  logger.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  server.close(() => process.exit(1));
});

export default server;