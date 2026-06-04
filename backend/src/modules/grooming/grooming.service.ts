import prisma from '../../config/database';
import { logger } from '../../config/logger';
import { AppError } from '../../shared/errors/AppError';
import { ErrorCodes } from '../../shared/errors/errorCodes';
import { EmailUtils } from '../../shared/utils/email';
import { InventoryService } from '../inventory/inventory.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateFichaDTO, UpdateFichaDTO,
  CreateChecklistDTO, CreateFotoDTO,
  CreateConsumoInsumoDTO, UpdateConsumoInsumoDTO
} from './grooming.types';

export class GroomingService {
  // ============================================
  // FICHA DE GROOMING
  // ============================================

  // Obtener ficha por ID
  static async getFichaById(id: number) {
    if (!id || isNaN(id)) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 400, 'ID de ficha inválido');
    }
    const ficha = await prisma.fichaGrooming.findUnique({
      where: { id },
      include: {
        cita: {
          include: {
            mascota: { include: { cliente: { include: { usuario: { select: { nombre: true, apellido: true, telefono: true } } } } } },
            servicio: true,
            groomer: { include: { usuario: { select: { nombre: true, apellido: true } } } },
          },
        },
        fotos: true,
        checklist: {
          include: {
            plantillaChecklist: true  // 👈 Asegurar que esté incluido
          }
        },
        consumoInsumos: { include: { producto: true, variante: true } },
      },
    });
    if (!ficha) throw new AppError(ErrorCodes.USER_NOT_FOUND, 404, 'Ficha no encontrada');
    return ficha;
  }

  // Obtener ficha por cita
  static async getFichaByCita(citaId: number) {
    return prisma.fichaGrooming.findUnique({
      where: { citaId },
      include: {
        fotos: true,
        checklist: { include: { plantillaChecklist: true } },
        consumoInsumos: { include: { producto: true } },
      },
    });
  }

  // Obtener fichas activas del groomer (hoy)
  static async getFichasActivasGroomer(groomerId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return prisma.fichaGrooming.findMany({
      where: {
        cita: {
          groomerId,
          fechaHoraInicio: { gte: today, lt: tomorrow },
          estado: { in: ['Confirmada', 'EnProgreso'] },
        },
        fechaCierre: null,
      },
      include: {
        cita: {
          include: {
            mascota: { select: { nombre: true, raza: true, tamanio: true, alergiasConocidas: true } },
            servicio: { select: { nombre: true } },
          },
        },
        checklist: { include: { plantillaChecklist: true } },
        fotos: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

    // Crear ficha de grooming
  static async createFicha(data: CreateFichaDTO) {
    const cita = await prisma.cita.findUnique({
      where: { id: data.citaId },
      include: { mascota: true },
    });
    if (!cita) throw new AppError(ErrorCodes.USER_NOT_FOUND, 404, 'Cita no encontrada');

    const existing = await prisma.fichaGrooming.findUnique({ where: { citaId: data.citaId } });
    if (existing) return existing; // Ya existe, devolverla

    const ficha = await prisma.fichaGrooming.create({
      data: {
        citaId: data.citaId,
        razaTamanoMomento: data.razaTamanoMomento || cita.mascota?.raza || '',
        temperaturaAnimal: data.temperaturaAnimal || null,
        notasInternas: data.notasInternas || null,
        estadoIngreso: data.estadoIngreso || null,
        comportamiento: data.comportamiento || null,
        recomendaciones: data.recomendaciones || null,
      },
    });

    await prisma.cita.update({
      where: { id: data.citaId },
      data: { estado: 'EnProgreso' },
    });

    // Crear checklist desde plantilla
    const plantillas = await prisma.plantillaChecklist.findMany({
      where: { servicioId: cita.servicioId },
      orderBy: { orden: 'asc' },
    });

    if (plantillas.length > 0) {
      await prisma.checklistFicha.createMany({
        data: plantillas.map(p => ({
          fichaGroomingId: ficha.id,
          plantillaChecklistId: p.id,
          completado: false,
        })),
      });
    }

    return this.getFichaById(ficha.id);
  }

    // Actualizar ficha
    static async updateFicha(id: number, data: UpdateFichaDTO) {
      return prisma.fichaGrooming.update({
        where: { id },
        data,
      });
    }

  // Cerrar ficha
  static async cerrarFicha(id: number) {
    const ficha = await prisma.fichaGrooming.findUnique({
      where: { id },
      include: {
        checklist: {
          include: {
            plantillaChecklist: true  // 👈 IMPORTANTE: incluir la plantilla
          }
        },
        consumoInsumos: true,
      },
    });
    
    if (!ficha) throw new AppError(ErrorCodes.USER_NOT_FOUND, 404, 'Ficha no encontrada');

    // Validar 100% del checklist
    const itemsCompletados = ficha.checklist.filter(c => c.completado).length;
    const itemsTotal = ficha.checklist.length;

    if (itemsTotal === 0) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR, 
        422, 
        'No hay items de checklist configurados para este servicio.'
      );
    }

    if (itemsCompletados < itemsTotal) {
      const itemsPendientes = ficha.checklist
        .filter(c => !c.completado)
        .map(c => c.plantillaChecklist?.item || `Ítem #${c.plantillaChecklistId}`)
        .join(', ');
      
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        422,
        `Debes completar todos los items del checklist (${itemsCompletados}/${itemsTotal}). Pendientes: ${itemsPendientes}`
      );
    }

    // Cerrar ficha
    const fichaCerrada = await prisma.fichaGrooming.update({
      where: { id },
      data: {
        fechaCierre: new Date(),
        consumidoInventario: true,
      },
    });

    // Actualizar estado de la cita
    await prisma.cita.update({
      where: { id: ficha.citaId },
      data: { estado: 'Completada' },
    });
    
    // PASO 4: Descontar insumos asignados
    await InventoryService.procesarDescuentoInsumos(ficha.citaId);
    // Descontar insumos
    for (const insumo of ficha.consumoInsumos) {
      if (!insumo.devuelto) {
        if (insumo.varianteId) {
          const variante = await prisma.varianteProducto.findUnique({
            where: { id: insumo.varianteId },
          });
          if (variante) {
            const nuevoStock = Math.max(0, variante.stockAdicional - Number(insumo.cantidad));
            await prisma.varianteProducto.update({
              where: { id: insumo.varianteId },
              data: { stockAdicional: nuevoStock },
            });
          }
        }
      }
    }

    // En el método cerrarFicha, después de procesar descuento de insumos:
    // Enviar notificación al cliente
    try {
      const fichaConCliente = await prisma.fichaGrooming.findUnique({
        where: { id },
        include: {
          cita: {
            include: {
              servicio: {           
                select: { nombre: true },
              },
              mascota: {
                include: {
                  cliente: {
                    include: {
                      usuario: { select: { id: true, email: true, nombre: true, telefono: true } },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (fichaConCliente?.cita?.mascota?.cliente?.usuario) {
        const cliente = fichaConCliente.cita.mascota.cliente.usuario;
        const mascota = fichaConCliente.cita.mascota;
        
        // Enviar notificación por email
        await EmailUtils.sendListoRecogerEmail(
          cliente.email,
          cliente.nombre,
          mascota.nombre,
          fichaConCliente.cita.servicio?.nombre || 'Servicio de grooming'
        );

        // Registrar notificación en el sistema
        await NotificationsService.schedule({
          usuarioId: cliente.id,
          tipoEvento: 'LISTO_RECOGER' as any,
          canal: 'Email' as any,
          destino: cliente.email,
          contenido: `¡${mascota.nombre} está lista para recoger! Su servicio de grooming ha finalizado. Puede pasar por Pet Spa.`,
          fechaProgramacion: new Date(),
        });
      }
    } catch (error) {
      logger.error('Error enviando notificación de listo para recoger:', error);
    }

    return fichaCerrada;
  }

  // ============================================
  // CHECKLIST
  // ============================================

  static async updateChecklistItem(id: number, data: { completado: boolean; observacion?: string }) {
    return prisma.checklistFicha.update({
      where: { id },
      data: {
        completado: data.completado,
        observacion: data.observacion || null,
      },
    });
  }

  // ============================================
  // FOTOS
  // ============================================

  static async addFoto(data: CreateFotoDTO) {
    return prisma.foto.create({ data });
  }

  static async deleteFoto(id: number) {
    return prisma.foto.delete({ where: { id } });
  }

  // ============================================
  // CONSUMO DE INSUMOS
  // ============================================

  static async addConsumoInsumo(data: CreateConsumoInsumoDTO) {
    return prisma.consumoInsumo.create({ data });
  }

  static async updateConsumoInsumo(id: number, data: UpdateConsumoInsumoDTO) {
    return prisma.consumoInsumo.update({ where: { id }, data });
  }

  static async deleteConsumoInsumo(id: number) {
    return prisma.consumoInsumo.delete({ where: { id } });
  }
}