import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

const prisma = new PrismaClient({
  log: [
    { level: 'warn', emit: 'event' },
    { level: 'error', emit: 'event' },
  ],
});

prisma.$on('warn', (e) => {
  logger.warn('Prisma Warning:', e);
});

prisma.$on('error', (e) => {
  logger.error('Prisma Error:', e);
});

// Conexión inicial
prisma.$connect()
  .then(() => {
    logger.info('📦 Base de datos conectada exitosamente');
  })
  .catch((error) => {
    logger.error('❌ Error al conectar a la base de datos:', error);
    process.exit(1);
  });

export default prisma;