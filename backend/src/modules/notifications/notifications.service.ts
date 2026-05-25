import prisma from '../../config/database';
import { EmailUtils } from '../../shared/utils/email';
import { logger } from '../../config/logger';
import { TipoEventoNotificacion, CanalNotificacion } from '@prisma/client';

export class NotificationsService {
  // Programar notificación
  static async schedule(data: {
    usuarioId: number;
    tipoEvento: TipoEventoNotificacion;  
    canal: CanalNotificacion;            
    destino: string;
    contenido?: string;
    fechaProgramacion: Date;
  }) {
    return prisma.notificacion.create({ data });
  }

  // Enviar notificaciones pendientes
  static async sendPending() {
    const now = new Date();
    const pendientes = await prisma.notificacion.findMany({
      where: {
        estadoEnvio: 'pendiente',
        fechaProgramacion: { lte: now },
      },
      include: { usuario: true },
      take: 50,
    });

    for (const notif of pendientes) {
      try {
        if (notif.canal === 'Email') {
          // 👈 Usar sendVerificationEmail o crear uno genérico
          await EmailUtils.sendVerificationEmail(
            notif.destino,
            notif.usuario.nombre,
            notif.contenido || `Notificación de Pet Spa: ${notif.tipoEvento}`
          );
        }

        await prisma.notificacion.update({
          where: { id: notif.id },
          data: { estadoEnvio: 'enviado', fechaEnvio: new Date() },
        });
      } catch (error) {
        await prisma.notificacion.update({
          where: { id: notif.id },
          data: {
            estadoEnvio: 'fallido',
            reintentos: notif.reintentos + 1,
          },
        });
        logger.error(`Error enviando notificación ${notif.id}:`, error);
      }
    }

    return { enviadas: pendientes.length };
  }

  // Notificar cita creada
  static async notifyCitaCreada(citaId: number) {
    const cita = await prisma.cita.findUnique({
      where: { id: citaId },
      include: {
        mascota: { include: { cliente: { include: { usuario: true } } } },
        servicio: true,
      },
    });
    if (!cita) return;

    const cliente = cita.mascota.cliente.usuario;
    const fecha = cita.fechaHoraInicio.toLocaleString('es-BO');

    // Notificación inmediata
    await this.schedule({
      usuarioId: cliente.id,
      tipoEvento: 'CONFIRMACION',
      canal: 'Email',
      destino: cliente.email,
      contenido: `Tu cita para ${cita.mascota.nombre} (${cita.servicio.nombre}) ha sido creada para el ${fecha}.`,
      fechaProgramacion: new Date(),
    });

    // Recordatorio 24h antes
    const recordatorio24h = new Date(cita.fechaHoraInicio.getTime() - 24 * 60 * 60 * 1000);
    if (recordatorio24h > new Date()) {
      await this.schedule({
        usuarioId: cliente.id,
        tipoEvento: 'RECORDATORIO_24H',
        canal: 'Email',
        destino: cliente.email,
        contenido: `Recordatorio: Mañana tienes una cita para ${cita.mascota.nombre} a las ${cita.fechaHoraInicio.toLocaleTimeString()}.`,
        fechaProgramacion: recordatorio24h,
      });
    }

    // Recordatorio 2h antes
    const recordatorio2h = new Date(cita.fechaHoraInicio.getTime() - 2 * 60 * 60 * 1000);
    if (recordatorio2h > new Date()) {
      await this.schedule({
        usuarioId: cliente.id,
        tipoEvento: 'RECORDATORIO_2H',
        canal: 'Email',
        destino: cliente.email,
        contenido: `Tu cita en Pet Spa es en 2 horas. ¡Te esperamos!`,
        fechaProgramacion: recordatorio2h,
      });
    }
  }

  // Notificar listo para recoger
  static async notifyListoRecoger(fichaGroomingId: number) {
    const ficha = await prisma.fichaGrooming.findUnique({
      where: { id: fichaGroomingId },
      include: {
        cita: {
          include: {
            mascota: { include: { cliente: { include: { usuario: true } } } },
          },
        },
      },
    });
    if (!ficha) return;

    const cliente = ficha.cita.mascota.cliente.usuario;
    await this.schedule({
      usuarioId: cliente.id,
      tipoEvento: 'LISTO_RECOGER',
      canal: 'Email',
      destino: cliente.email,
      contenido: `¡${ficha.cita.mascota.nombre} está lista para recoger! Puedes pasar por Pet Spa.`,
      fechaProgramacion: new Date(),
    });
  }
}