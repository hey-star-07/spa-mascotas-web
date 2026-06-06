import prisma from '../../config/database';
import { EmailUtils } from '../../shared/utils/email';
import { logger } from '../../config/logger';
import { TipoEventoNotificacion, CanalNotificacion } from '@prisma/client';

export class NotificationsService {
  // ============================================
  // PROGRAMAR RECORDATORIOS DE CITA
  // ============================================
  
  static async programarRecordatoriosCita(citaId: number) {
    const cita = await prisma.cita.findUnique({
      where: { id: citaId },
      include: {
        mascota: {
          include: {
            cliente: {
              include: {
                usuario: {
                  select: { id: true, email: true, nombre: true, telefono: true },
                },
              },
            },
          },
        },
        servicio: { select: { nombre: true } },
        groomer: {
          include: {
            usuario: { select: { nombre: true, apellido: true } },
          },
        },
      },
    });

    if (!cita || !cita.mascota?.cliente?.usuario) {
      logger.warn(`No se pudo programar recordatorios para cita #${citaId}: falta información del cliente`);
      return;
    }

    const cliente = cita.mascota.cliente.usuario;
    const fechaCita = cita.fechaHoraInicio;
    const horaCita = fechaCita.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
    const fechaFormateada = fechaCita.toLocaleDateString('es-BO', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    const groomerNombre = cita.groomer?.usuario?.nombre || 'Nuestro equipo';
    const mascotaNombre = cita.mascota.nombre;
    const servicioNombre = cita.servicio?.nombre || 'servicio de grooming';

    // 1. Recordatorio 24 horas antes
    const recordatorio24h = new Date(fechaCita.getTime() - 24 * 60 * 60 * 1000);
    
    if (recordatorio24h > new Date()) {
      // Email 24h
      await this.schedule({
        usuarioId: cliente.id,
        tipoEvento: 'RECORDATORIO_24H',
        canal: 'Email',
        destino: cliente.email,
        contenido: JSON.stringify({
          tipo: 'recordatorio_24h',
          cliente: cliente.nombre,
          mascota: mascotaNombre,
          servicio: servicioNombre,
          groomer: groomerNombre,
          fecha: fechaFormateada,
          hora: horaCita,
        }),
        fechaProgramacion: recordatorio24h,
      });

      logger.info(`📅 Recordatorio 24h programado para cita #${citaId} - ${cliente.email}`);
    }

    // 2. Recordatorio 2 horas antes
    const recordatorio2h = new Date(fechaCita.getTime() - 2 * 60 * 60 * 1000);
    
    if (recordatorio2h > new Date()) {
      // Email 2h
      await this.schedule({
        usuarioId: cliente.id,
        tipoEvento: 'RECORDATORIO_2H',
        canal: 'Email',
        destino: cliente.email,
        contenido: JSON.stringify({
          tipo: 'recordatorio_2h',
          cliente: cliente.nombre,
          mascota: mascotaNombre,
          servicio: servicioNombre,
          groomer: groomerNombre,
          fecha: fechaFormateada,
          hora: horaCita,
        }),
        fechaProgramacion: recordatorio2h,
      });

      // WhatsApp 2h (si tiene teléfono)
      if (cliente.telefono) {
        await this.schedule({
          usuarioId: cliente.id,
          tipoEvento: 'RECORDATORIO_2H',
          canal: 'WhatsApp',
          destino: cliente.telefono,
          contenido: JSON.stringify({
            tipo: 'recordatorio_2h',
            cliente: cliente.nombre,
            mascota: mascotaNombre,
            servicio: servicioNombre,
            groomer: groomerNombre,
            fecha: fechaFormateada,
            hora: horaCita,
          }),
          fechaProgramacion: recordatorio2h,
        });
      }

      logger.info(`📅 Recordatorio 2h programado para cita #${citaId}`);
    }

    return { programados: true };
  }

  // ============================================
  // PROGRAMAR NOTIFICACIÓN
  // ============================================
  
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

  // ============================================
  // ENVIAR NOTIFICACIONES PENDIENTES (CRON)
  // ============================================
  
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

    let enviadas = 0;
    let fallidas = 0;

    for (const notif of pendientes) {
      try {
        if (notif.canal === 'Email') {
          await this.enviarEmail(notif);
          enviadas++;
        } else if (notif.canal === 'WhatsApp') {
          await this.enviarWhatsApp(notif);
          enviadas++;
        }

        await prisma.notificacion.update({
          where: { id: notif.id },
          data: {
            estadoEnvio: 'enviado',
            fechaEnvio: new Date(),
          },
        });
      } catch (error) {
        logger.error(`Error enviando notificación #${notif.id}:`, error);
        fallidas++;
        
        await prisma.notificacion.update({
          where: { id: notif.id },
          data: {
            estadoEnvio: 'fallido',
            reintentos: notif.reintentos + 1,
          },
        });
      }
    }

    return { enviadas, fallidas, total: pendientes.length };
  }

  // ============================================
  // ENVIAR EMAIL DE RECORDATORIO
  // ============================================
  
  private static async enviarEmail(notif: any) {
    let datos: any = {};
    try {
      datos = JSON.parse(notif.contenido || '{}');
    } catch {}

    const tipo = datos.tipo || notif.tipoEvento;
    
    if (tipo === 'recordatorio_24h') {
      await EmailUtils.sendRecordatorio24hEmail(
        notif.destino,
        datos.cliente || notif.usuario?.nombre,
        datos.mascota || 'tu mascota',
        datos.servicio || 'servicio de grooming',
        datos.fecha || '',
        datos.hora || '',
        datos.groomer || 'Nuestro equipo'
      );
    } else if (tipo === 'recordatorio_2h') {
      await EmailUtils.sendRecordatorio2hEmail(
        notif.destino,
        datos.cliente || notif.usuario?.nombre,
        datos.mascota || 'tu mascota',
        datos.servicio || 'servicio de grooming',
        datos.fecha || '',
        datos.hora || '',
        datos.groomer || 'Nuestro equipo'
      );
    } else if (tipo === 'listo_recoger' || notif.tipoEvento === 'LISTO_RECOGER') {
      await EmailUtils.sendListoRecogerEmail(
        notif.destino,
        notif.usuario?.nombre || 'Cliente',
        datos.mascota || 'tu mascota',
        datos.servicio || 'servicio de grooming'
      );
    } else {
      // Email genérico
      await EmailUtils.sendVerificationEmail(
        notif.destino,
        notif.usuario?.nombre || 'Cliente',
        notif.contenido || `Notificación de Pet Spa: ${notif.tipoEvento}`
      );
    }
  }

  // ============================================
  // ENVIAR WHATSAPP (SIMULADO - GENERA LINK)
  // ============================================
  
  private static async enviarWhatsApp(notif: any) {
    let datos: any = {};
    try {
      datos = JSON.parse(notif.contenido || '{}');
    } catch {}

    const numero = notif.destino.replace(/\D/g, '');
    const mascota = datos.mascota || 'tu mascota';
    const servicio = datos.servicio || 'servicio de grooming';
    const fecha = datos.fecha || '';
    const hora = datos.hora || '';
    const groomer = datos.groomer || 'Nuestro equipo';
    const cliente = datos.cliente || notif.usuario?.nombre || 'Cliente';

    let mensaje = '';
    
    if (datos.tipo === 'recordatorio_2h') {
      mensaje = `🐾 *Recordatorio - Pet Spa*\n\nHola ${cliente},\n\nTu cita para *${mascota}* es en 2 horas.\n\n📋 Servicio: ${servicio}\n📅 Fecha: ${fecha}\n🕐 Hora: ${hora}\n✂️ Groomer: ${groomer}\n\n¡Te esperamos!\n_Pet Spa_`;
    } else {
      mensaje = `🐾 *Pet Spa*\n\nHola ${cliente},\n\nRecordatorio de tu cita para *${mascota}*.\n\n📋 ${servicio}\n📅 ${fecha} a las ${hora}\n\n¡Gracias por confiar en nosotros!`;
    }

    const mensajeEncoded = encodeURIComponent(mensaje);
    const whatsappLink = `https://wa.me/591${numero}?text=${mensajeEncoded}`;

    logger.info(`📱 Link de WhatsApp generado para ${notif.destino}: ${whatsappLink}`);
    
    // Nota: Para envío real se necesita WhatsApp Business API
    // Por ahora solo guardamos el link en el log
  }

  // ============================================
  // NOTIFICAR LISTO PARA RECOGER
  // ============================================
  
  static async notifyListoRecoger(fichaGroomingId: number) {
    const ficha = await prisma.fichaGrooming.findUnique({
      where: { id: fichaGroomingId },
      include: {
        cita: {
          include: {
            mascota: {
              include: {
                cliente: {
                  include: {
                    usuario: { select: { id: true, email: true, nombre: true, telefono: true } },
                  },
                },
              },
            },
            servicio: { select: { nombre: true } },
          },
        },
      },
    });

    if (!ficha?.cita?.mascota?.cliente?.usuario) return;

    const cliente = ficha.cita.mascota.cliente.usuario;
    const mascota = ficha.cita.mascota.nombre;
    const servicio = ficha.cita.servicio?.nombre || 'servicio de grooming';

    // Email
    await this.schedule({
      usuarioId: cliente.id,
      tipoEvento: 'LISTO_RECOGER',
      canal: 'Email',
      destino: cliente.email,
      contenido: JSON.stringify({
        tipo: 'listo_recoger',
        cliente: cliente.nombre,
        mascota,
        servicio,
      }),
      fechaProgramacion: new Date(), // Enviar inmediatamente
    });

    // WhatsApp
    if (cliente.telefono) {
      await this.schedule({
        usuarioId: cliente.id,
        tipoEvento: 'LISTO_RECOGER',
        canal: 'WhatsApp',
        destino: cliente.telefono,
        contenido: JSON.stringify({
          tipo: 'listo_recoger',
          cliente: cliente.nombre,
          mascota,
          servicio,
        }),
        fechaProgramacion: new Date(),
      });
    }

    logger.info(`📬 Notificación "Listo para recoger" programada para ${cliente.email}`);
  }
}