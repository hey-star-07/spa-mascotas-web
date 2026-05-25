import prisma from '../../config/database';
import { AppError } from '../../shared/errors/AppError';
import { ErrorCodes } from '../../shared/errors/errorCodes';
import { CreateAvailabilityDTO, CreateBloqueoDTO } from './availability.types';

export class AvailabilityService {
  /**
   * Obtener disponibilidad de un groomer
   */
  static async getByGroomer(groomerId: number) {
    return prisma.disponibilidad.findMany({
      where: { groomerId },
      orderBy: { diaSemana: 'asc' },
    });
  }

  /**
   * Obtener disponibilidad de todos los groomers
   */
  static async getAll() {
    return prisma.disponibilidad.findMany({
      include: {
        groomer: {
          include: {
            usuario: { select: { nombre: true, apellido: true } },
          },
        },
      },
      orderBy: [{ groomerId: 'asc' }, { diaSemana: 'asc' }],
    });
  }

  /**
   * Crear disponibilidad para un groomer
   */
  static async createAvailability(data: CreateAvailabilityDTO) {
    // Validar que horaFin > horaInicio
    if (data.horaInicio >= data.horaFin) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 422, 'La hora de fin debe ser mayor a la hora de inicio');
    }

    // Verificar que no haya solapamiento en el mismo día
    const existing = await prisma.disponibilidad.findFirst({
      where: {
        groomerId: data.groomerId,
        diaSemana: data.diaSemana,
        OR: [
          { horaInicio: { lte: data.horaFin }, horaFin: { gte: data.horaInicio } },
        ],
      },
    });

    if (existing) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 422, 'Ya existe un horario que se solapa en ese día');
    }

    return prisma.disponibilidad.create({ data });
  }

  /**
   * Eliminar disponibilidad
   */
  static async deleteAvailability(id: number) {
    return prisma.disponibilidad.delete({ where: { id } });
  }

  /**
   * Obtener bloqueos
   */
  static async getBloqueos(groomerId?: number) {
    const where: any = {};
    if (groomerId) where.groomerId = groomerId;
    
    return prisma.bloqueoCalendario.findMany({
      where,
      include: {
        groomer: {
          include: {
            usuario: { select: { nombre: true, apellido: true } },
          },
        },
      },
      orderBy: { fechaInicio: 'desc' },
    });
  }

  /**
   * Crear bloqueo
   */
  static async createBloqueo(data: CreateBloqueoDTO) {
    if (new Date(data.fechaFin) <= new Date(data.fechaInicio)) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 422, 'La fecha de fin debe ser posterior a la de inicio');
    }

    return prisma.bloqueoCalendario.create({
      data: {
        groomerId: data.groomerId || null,
        tipo: data.tipo,
        fechaInicio: new Date(data.fechaInicio),
        fechaFin: new Date(data.fechaFin),
        descripcion: data.descripcion,
      },
    });
  }

  /**
   * Eliminar bloqueo
   */
  static async deleteBloqueo(id: number) {
    return prisma.bloqueoCalendario.delete({ where: { id } });
  }

  /**
   * Verificar si un groomer está disponible en un horario específico
   */
  static async isGroomerAvailable(
    groomerId: number,
    fechaHoraInicio: Date,
    fechaHoraFin: Date
  ): Promise<{ available: boolean; reason?: string }> {
    const diaSemana = fechaHoraInicio.getDay();
    const horaInicio = fechaHoraInicio.toTimeString().slice(0, 5);
    const horaFin = fechaHoraFin.toTimeString().slice(0, 5);

    // 1. Verificar disponibilidad del día
    const disponibilidad = await prisma.disponibilidad.findFirst({
      where: {
        groomerId,
        diaSemana,
        horaInicio: { lte: horaInicio },
        horaFin: { gte: horaFin },
      },
    });

    if (!disponibilidad) {
      return { available: false, reason: 'El groomer no trabaja en este horario' };
    }

    // 2. Verificar bloqueos
    const bloqueo = await prisma.bloqueoCalendario.findFirst({
      where: {
        OR: [
          { groomerId },
          { groomerId: null }, // Bloqueos globales
        ],
        fechaInicio: { lte: fechaHoraFin },
        fechaFin: { gte: fechaHoraInicio },
      },
    });

    if (bloqueo) {
      return { available: false, reason: `Bloqueo: ${bloqueo.tipo} - ${bloqueo.descripcion || ''}` };
    }

    // 3. Verificar solapamiento con otras citas
    const citaSolapada = await prisma.cita.findFirst({
      where: {
        groomerId,
        estado: { notIn: ['Cancelada', 'NoAsistio'] },
        fechaHoraInicio: { lt: fechaHoraFin },
        fechaHoraFin: { gt: fechaHoraInicio },
      },
    });

    if (citaSolapada) {
      return { available: false, reason: 'El groomer ya tiene una cita en ese horario' };
    }

    // 4. Verificar capacidad máxima simultánea
    const groomer = await prisma.groomer.findUnique({ where: { id: groomerId } });
    if (groomer) {
      const citasSimultaneas = await prisma.cita.count({
        where: {
          groomerId,
          estado: { notIn: ['Cancelada', 'NoAsistio'] },
          fechaHoraInicio: { lt: fechaHoraFin },
          fechaHoraFin: { gt: fechaHoraInicio },
        },
      });

      if (citasSimultaneas >= groomer.capacidadSimultanea) {
        return { available: false, reason: 'Capacidad máxima alcanzada' };
      }
    }

    return { available: true };
  }

  /**
   * Obtener slots disponibles para un día específico
   */
  static async getAvailableSlots(
    groomerId: number,
    fecha: string,
    duracionMinutos: number
  ): Promise<string[]> {
    const diaSemana = new Date(fecha).getDay();
    const slots: string[] = [];

    const disponibilidad = await prisma.disponibilidad.findMany({
      where: { groomerId, diaSemana },
    });

    for (const disp of disponibilidad) {
      const [hInicio, mInicio] = disp.horaInicio.split(':').map(Number);
      const [hFin, mFin] = disp.horaFin.split(':').map(Number);
      
      let horaActual = hInicio * 60 + mInicio;
      const horaFinMinutos = hFin * 60 + mFin;

      while (horaActual + duracionMinutos <= horaFinMinutos) {
        const h = Math.floor(horaActual / 60);
        const m = horaActual % 60;
        const slotInicio = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        
        const fechaInicio = new Date(`${fecha}T${slotInicio}:00`);
        const fechaFin = new Date(fechaInicio.getTime() + duracionMinutos * 60000);

        const { available } = await this.isGroomerAvailable(groomerId, fechaInicio, fechaFin);
        
        if (available) {
          slots.push(slotInicio);
        }

        horaActual += 15; // Intervalos de 15 minutos
      }
    }

    return slots;
  }
}