import prisma from '../../config/database';
import { AppError } from '../../shared/errors/AppError';
import { ErrorCodes } from '../../shared/errors/errorCodes';
import { CreateAppointmentDTO, UpdateAppointmentDTO, AppointmentFilters } from './appointments.types';
import { AvailabilityService } from '../availability/availability.service';
import { ServicesService } from '../services/services.service';
import { InventoryService } from '../inventory/inventory.service';
import { format } from 'path/win32';

export class AppointmentsService {
  /**
   * Obtener todas las citas con filtros
   */
  static async getAll(filters: AppointmentFilters) {
    const where: any = {};

    if (filters.fecha) {
      const inicio = new Date(filters.fecha + 'T00:00:00.000Z');
      const fin = new Date(filters.fecha + 'T23:59:59.999Z');
      where.fechaHoraInicio = { gte: inicio, lte: fin };
      console.log('🔍 DEBUG - Filtrando por fecha:', filters.fecha, '→', inicio, 'a', fin);
    }

    if (filters.groomerId) where.groomerId = parseInt(filters.groomerId as any);
    if (filters.estado) where.estado = filters.estado;
    if (filters.mascotaId) where.mascotaId = parseInt(filters.mascotaId as any);

    if (filters.clienteId) {
      where.mascota = { clienteId: parseInt(filters.clienteId as any) };
    }

    console.log('🔍 DEBUG - Where final:', JSON.stringify(where));

    const citas = await prisma.cita.findMany({
      where,
      include: {
        mascota: {
          select: { id: true, nombre: true, raza: true, tamanio: true, especie: true, imagen: true },
        },
        groomer: {
          include: { usuario: { select: { id: true, nombre: true, apellido: true } } },
        },
        servicio: {
          select: { id: true, nombre: true, duracionBaseMinutos: true, precioBase: true },
        },
        creadoPor: { select: { id: true, nombre: true, apellido: true } },
      },
      orderBy: { fechaHoraInicio: 'asc' },
    });

    console.log('🔍 DEBUG - Citas encontradas:', citas.length);
    return citas;
  }

  /**
   * Obtener citas de un groomer para un día específico
   */
  static async getByGroomer(groomerId: number, fecha?: string) {
    const where: any = { groomerId, estado: { notIn: ['Cancelada', 'NoAsistio'] } };
    
    if (fecha) {
      const inicio = new Date(fecha);
      inicio.setHours(0, 0, 0, 0);
      const fin = new Date(fecha);
      fin.setHours(23, 59, 59, 999);
      where.fechaHoraInicio = { gte: inicio, lte: fin };
    }

    return prisma.cita.findMany({
      where,
      include: {
        mascota: { select: { id: true, nombre: true, raza: true, tamanio: true } },
        servicio: { select: { id: true, nombre: true, duracionBaseMinutos: true } },
      },
      orderBy: { fechaHoraInicio: 'asc' },
    });
  }

  /**
   * Obtener citas del cliente autenticado
   */
  static async getByCliente(clienteId: number) {
    return prisma.cita.findMany({
      where: {
        mascota: { clienteId },
      },
      include: {
        mascota: { select: { id: true, nombre: true } },
        groomer: { include: { usuario: { select: { nombre: true, apellido: true } } } },
        servicio: { select: { id: true, nombre: true, precioBase: true } },
      },
      orderBy: { fechaHoraInicio: 'desc' },
    });
  }

  /**
   * Obtener cita por ID
   */
  static async getById(id: number) {
    const cita = await prisma.cita.findUnique({
      where: { id },
      include: {
        mascota: {
          include: { cliente: { include: { usuario: { select: { nombre: true, apellido: true, email: true, telefono: true } } } } },
        },
        groomer: { include: { usuario: { select: { nombre: true, apellido: true } } } },
        servicio: true,
        fichaGrooming: { include: { fotos: true, checklist: true } },
        factura: { include: { pagos: true } },
      },
    });
    if (!cita) throw new AppError(ErrorCodes.USER_NOT_FOUND, 404, 'Cita no encontrada');
    return cita;
  }

  /**
   * Crear cita (Admin/Recepción o solicitud de Cliente)
   */
  static async create(data: CreateAppointmentDTO, creadoPorId: number, esSolicitud: boolean = false) {
    const fechaInicio = new Date(data.fechaHoraInicio);
    const duracion = data.duracionEstimadaMinutos;

    // Obtener mascota para calcular ajuste de duración
    const mascota = await prisma.mascota.findUnique({ where: { id: data.mascotaId } });
    if (!mascota) throw new AppError(ErrorCodes.USER_NOT_FOUND, 404, 'Mascota no encontrada');

    const servicio = await prisma.servicio.findUnique({ where: { id: data.servicioId } });
    if (!servicio) throw new AppError(ErrorCodes.USER_NOT_FOUND, 404, 'Servicio no encontrado');

    // Calcular duración ajustada
    const duracionAjustada = ServicesService.calcularDuracionAjustada(
      servicio.duracionBaseMinutos,
      Number(servicio.factorTamanoRaza),
      mascota.tamanio || 'Mediano',
      mascota.temperamento || undefined
    );

    // Si se asigna groomer, verificar disponibilidad
    if (data.groomerId) {
      const fechaFin = new Date(fechaInicio.getTime() + duracionAjustada * 60000);
      const { available, reason } = await AvailabilityService.isGroomerAvailable(
        data.groomerId,
        fechaInicio,
        fechaFin
      );

      if (!available) {
        const mensajes: Record<string, string> = {
          'El groomer no trabaja en este horario': 
            `El groomer no atiende en este horario.`,
          'El groomer ya tiene una cita en ese horario':
            `Conflicto de horario. El groomer ya tiene una cita que se solapa con este servicio de ${duracionAjustada} minutos.`,
          'Capacidad máxima alcanzada':
            'El groomer ya alcanzó su límite máximo de citas simultáneas.',
          'Límite diario alcanzado':
            'El groomer ya alcanzó su capacidad máxima de citas para este día.',
          'Fuera del horario laboral':
            'El horario seleccionado está fuera del horario de trabajo del groomer.',
          'Horario ocupado por otra cita':
            `El groomer ya tiene una cita que se solapa con este servicio de ${duracionAjustada} minutos.`,
        };

        const mensajeAmigable = mensajes[reason || ''] || reason || 'Groomer no disponible en este horario';
        
        throw new AppError(ErrorCodes.VALIDATION_ERROR, 422, mensajeAmigable);
      }
    }

    // Crear la cita
    const cita = await prisma.cita.create({
      data: {
        mascotaId: data.mascotaId,
        groomerId: data.groomerId || 1,
        servicioId: data.servicioId,
        fechaHoraInicio: fechaInicio,
        fechaHoraFin: new Date(fechaInicio.getTime() + duracionAjustada * 60000),
        duracionEstimadaMinutos: duracionAjustada,
        estado: 'Agendada',
        estadoSolicitud: esSolicitud ? 'Solicitada' : 'Aprobada',
        creadoPorId,
      },
      include: {
        mascota: { select: { nombre: true } },
        servicio: { select: { nombre: true } },
        groomer: { include: { usuario: { select: { nombre: true } } } },
      },
    });

    // 👇 ASIGNAR INSUMOS AUTOMÁTICAMENTE (solo si no es solicitud de cliente)
    if (!esSolicitud && data.groomerId) {
      try {
        const resultado = await InventoryService.asignarInsumosAutomaticos(cita.id, creadoPorId);
        console.log(`📦 Insumos asignados para cita #${cita.id}: ${resultado.mensaje}`);
      } catch (error) {
        // No fallar la creación de cita si falla la asignación de insumos
        console.error('Error asignando insumos automáticos:', error);
      }
    }

    return cita;
  }

  /**
   * Actualizar cita
   */
  static async update(id: number, data: UpdateAppointmentDTO, usuarioId: number) {
    const cita = await prisma.cita.findUnique({ where: { id } });
    if (!cita) throw new AppError(ErrorCodes.USER_NOT_FOUND, 404, 'Cita no encontrada');

    // Si cambia la fecha, recalcular fechaFin
    let fechaFin = undefined;
    if (data.fechaHoraInicio) {
      const duracion = data.duracionEstimadaMinutos || cita.duracionEstimadaMinutos;
      fechaFin = new Date(new Date(data.fechaHoraInicio).getTime() + duracion * 60000);
    }

    return prisma.cita.update({
      where: { id },
      data: {
        ...data,
        fechaHoraFin: fechaFin,
        reprogramadoPorId: data.fechaHoraInicio ? usuarioId : undefined,
        fechaReprogramacion: data.fechaHoraInicio ? new Date() : undefined,
      },
    });
  }

  /**
   * Cancelar cita
   */
  static async cancel(id: number, motivo: string) {
    return prisma.cita.update({
      where: { id },
      data: {
        estado: 'Cancelada',
        estadoSolicitud: 'Rechazada',
      },
    });
  }

  /**
   * Cambiar estado de solicitud (Aprobar/Rechazar)
   */
  static async cambiarEstadoSolicitud(id: number, estado: 'Aprobada' | 'Rechazada') {
    return prisma.cita.update({
      where: { id },
      data: {
        estadoSolicitud: estado,
        estado: estado === 'Aprobada' ? 'Confirmada' : 'Cancelada',
      },
    });
  }
}