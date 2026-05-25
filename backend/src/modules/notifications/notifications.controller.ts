import { Request, Response, NextFunction } from 'express';
import { NotificationsService } from './notifications.service';

export class NotificationsController {
  // POST /api/notifications/send-pending (CRON)
  static async sendPending(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await NotificationsService.sendPending();
      res.status(200).json({ status: 'success', data: result });
    } catch (error) { next(error); }
  }
}