import { NotificationsService } from '../modules/notifications/notifications.service';
import { logger } from './logger';

logger.info('⏰ CRON de notificaciones iniciado (cada 5 min)');

setInterval(async () => {
  try {
    const result = await NotificationsService.sendPending();
    if (result.enviadas > 0) {
      logger.info(`📬 ${result.enviadas} notificaciones enviadas`);
    }
  } catch (error) {
    logger.error('Error en CRON de notificaciones:', error);
  }
}, 5 * 60 * 1000);