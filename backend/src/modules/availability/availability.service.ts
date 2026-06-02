import prisma from '../../config/database';
import { AppError } from '../../shared/errors/AppError';
import { ErrorCodes } from '../../shared/errors/errorCodes';

export class AvailabilityService {
  // ============================================
  // DISPONIBILIDAD
  // ============================================
  
  static async getByGroomer(groomerId: number) {
    return prisma.disponibilidad.findMany({
      where: { groomerId },
      orderBy: { diaSemana: 'asc' },
    });
  }

  static async getAll() {
    return prisma.disponibilidad.findMany({
      include: {
        groomer: {
          include: { usuario: { select: { nombre: true, apellido: true } } },
        },
      },
      orderBy: [{ groomerId: 'asc' }, { diaSemana: 'asc' }],
    });
  }

  static async createAvailability(data: any) {
    if (data.horaInicio >= data.horaFin) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 422, 'La hora de fin debe ser mayor a la hora de inicio');
    }

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

  static async deleteAvailability(id: number) {
    return prisma.disponibilidad.delete({ where: { id } });
  }

  // ============================================
  // BLOQUEOS
  // ============================================
  
  static async getBloqueos(groomerId?: number) {
    const where: any = {};
    if (groomerId) where.groomerId = groomerId;
    return prisma.bloqueoCalendario.findMany({
      where,
      include: {
        groomer: {
          include: { usuario: { select: { nombre: true, apellido: true } } },
        },
      },
      orderBy: { fechaInicio: 'desc' },
    });
  }

  static async createBloqueo(data: any) {
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

  static async deleteBloqueo(id: number) {
    return prisma.bloqueoCalendario.delete({ where: { id } });
  }

  // ============================================
  // VERIFICACIÓN DE DISPONIBILIDAD
  // ============================================

  static async isGroomerAvailable(
    groomerId: number,
    fechaHoraInicio: Date,
    fechaHoraFin: Date
  ): Promise<{ available: boolean; reason?: string }> {
    const diaSemana = fechaHoraInicio.getDay();
    const horaInicio = fechaHoraInicio.toTimeString().slice(0, 5);
    const horaFin = fechaHoraFin.toTimeString().slice(0, 5);

    // 0. Verificar capacidad diaria
    const capacidad = await this.getCapacidadDiaria(groomerId, fechaHoraInicio.toISOString().split('T')[0]);
    if (capacidad.alLimite) {
      return {
        available: false,
        reason: `Límite diario alcanzado (${capacidad.ocupadas}/${capacidad.limite} citas)`,
      };
    }

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
      return { available: false, reason: 'Fuera del horario laboral' };
    }

    // 2. Verificar bloqueos
    const bloqueo = await prisma.bloqueoCalendario.findFirst({
      where: {
        OR: [{ groomerId }, { groomerId: null }],
        fechaInicio: { lte: fechaHoraFin },
        fechaFin: { gte: fechaHoraInicio },
      },
    });

    if (bloqueo) {
      return { available: false, reason: `Bloqueo: ${bloqueo.tipo}` };
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
      return { available: false, reason: 'Horario ocupado por otra cita' };
    }

    // 4. Verificar capacidad simultánea
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
        return { available: false, reason: 'Capacidad simultánea máxima alcanzada' };
      }
    }

    return { available: true };
  }

  // ============================================
  // SLOTS DISPONIBLES
  // ============================================

  static async getAvailableSlots(
    groomerId: number,
    fecha: string,
    duracionMinutos: number
  ): Promise<Array<{ hora: string; disponible: boolean; razon?: string }>> {
    const diaSemana = new Date(fecha + 'T00:00:00').getDay();
    const slots: Array<{ hora: string; disponible: boolean; razon?: string }> = [];

    console.log('🔍 Buscando slots para groomerId:', groomerId, 'fecha:', fecha, 'diaSemana:', diaSemana, 'duracion:', duracionMinutos);

    const disponibilidad = await prisma.disponibilidad.findMany({
      where: { groomerId, diaSemana },
    });

    console.log('🔍 Disponibilidad encontrada:', disponibilidad.length, 'registros');

    if (disponibilidad.length === 0) {
      console.log('🔍 No hay disponibilidad configurada para groomerId:', groomerId, 'diaSemana:', diaSemana);
      return slots;
    }

    for (const disp of disponibilidad) {
      const [hInicio, mInicio] = disp.horaInicio.split(':').map(Number);
      const [hFin, mFin] = disp.horaFin.split(':').map(Number);

      console.log(`🔍 Procesando disponibilidad: ${disp.horaInicio} - ${disp.horaFin}`);

      let horaActual = hInicio * 60 + mInicio;
      const horaFinMinutos = hFin * 60 + mFin;

      while (horaActual + duracionMinutos <= horaFinMinutos) {
        const h = Math.floor(horaActual / 60);
        const m = horaActual % 60;
        const slotHora = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

        const fechaInicio = new Date(`${fecha}T${slotHora}:00`);
        const fechaFin = new Date(fechaInicio.getTime() + duracionMinutos * 60000);

        const { available, reason } = await this.isGroomerAvailable(groomerId, fechaInicio, fechaFin);

        slots.push({
          hora: slotHora,
          disponible: available,
          razon: available ? undefined : reason,
        });

        horaActual += 30;
      }
    }

    console.log(`🔍 Total slots generados: ${slots.length}, disponibles: ${slots.filter(s => s.disponible).length}`);

    return slots;
  }

  // ============================================
  // CAPACIDAD DIARIA
  // ============================================

  static async getCapacidadDiaria(groomerId: number, fecha: string): Promise<{
    total: number;
    ocupadas: number;
    disponibles: number;
    limite: number;
    alLimite: boolean;
    horasOcupadas: number;
  }> {
    const inicio = new Date(fecha + 'T00:00:00');
    const fin = new Date(fecha + 'T23:59:59');

    const groomer = await prisma.groomer.findUnique({
      where: { id: groomerId },
      select: { capacidadDiaria: true },
    });

    const limite = groomer?.capacidadDiaria || 6;

    const ocupadas = await prisma.cita.count({
      where: {
        groomerId,
        fechaHoraInicio: { gte: inicio, lte: fin },
        estado: { notIn: ['Cancelada', 'NoAsistio'] },
      },
    });

    const citas = await prisma.cita.findMany({
      where: {
        groomerId,
        fechaHoraInicio: { gte: inicio, lte: fin },
        estado: { notIn: ['Cancelada', 'NoAsistio'] },
      },
      select: { duracionEstimadaMinutos: true },
    });

    const totalMinutos = citas.reduce((sum, c) => sum + c.duracionEstimadaMinutos, 0);

    return {
      total: ocupadas,
      ocupadas,
      disponibles: Math.max(0, limite - ocupadas),
      limite,
      alLimite: ocupadas >= limite,
      horasOcupadas: totalMinutos / 60,
    };
  }
}