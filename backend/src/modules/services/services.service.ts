import prisma from '../../config/database';
import { AppError } from '../../shared/errors/AppError';
import { ErrorCodes } from '../../shared/errors/errorCodes';
import { CreateServiceDTO, UpdateServiceDTO, ServiceResponse, ServicePrisma, toServiceResponse } from './services.types';

export class ServicesService {
  /**
   * Obtener todos los servicios
   */
  static async getAll(onlyActive: boolean = false): Promise<ServiceResponse[]> {
    const where: any = {};
    if (onlyActive) where.activo = true;

    const services = await prisma.servicio.findMany({
      where,
      orderBy: { nombre: 'asc' },
    });

    return services.map(toServiceResponse);  // 👈 Convertir Decimal a number
  }

  /**
   * Obtener servicio por ID
   */
  static async getById(id: number): Promise<ServiceResponse> {
    const servicio = await prisma.servicio.findUnique({ where: { id } });
    if (!servicio) throw new AppError(ErrorCodes.USER_NOT_FOUND, 404, 'Servicio no encontrado');
    return toServiceResponse(servicio);  // 👈 Convertir Decimal a number
  }

  /**
   * Crear nuevo servicio
   */
  static async create(data: CreateServiceDTO): Promise<ServiceResponse> {
    if (data.duracionBaseMinutos % 15 !== 0) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 422, 'La duración debe ser múltiplo de 15 minutos');
    }

    const servicio = await prisma.servicio.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        duracionBaseMinutos: data.duracionBaseMinutos,
        precioBase: data.precioBase,
        permiteDobleBooking: data.permiteDobleBooking || false,
        factorTamanoRaza: data.factorTamanoRaza || 0.15,
        requiereBloqueConsecutivo: data.requiereBloqueConsecutivo || false,
      },
    });

    return toServiceResponse(servicio);  // 👈 Convertir Decimal a number
  }

  /**
   * Actualizar servicio
   */
  static async update(id: number, data: UpdateServiceDTO): Promise<ServiceResponse> {
    const servicio = await prisma.servicio.findUnique({ where: { id } });
    if (!servicio) throw new AppError(ErrorCodes.USER_NOT_FOUND, 404, 'Servicio no encontrado');

    if (data.duracionBaseMinutos && data.duracionBaseMinutos % 15 !== 0) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 422, 'La duración debe ser múltiplo de 15 minutos');
    }

    const updated = await prisma.servicio.update({
      where: { id },
      data,
    });

    return toServiceResponse(updated);  // 👈 Convertir Decimal a number
  }

  /**
   * Calcular duración ajustada según tamaño de mascota
   */
  static calcularDuracionAjustada(
    duracionBase: number,
    factorTamanoRaza: number,
    tamanioMascota: string,
    temperamento?: string
  ): number {
    let ajuste = 0;

    switch (tamanioMascota) {
      case 'Pequeño': ajuste = 0; break;
      case 'Mediano': ajuste = 0.10; break;
      case 'Grande': ajuste = 0.15; break;
      case 'Gigante': ajuste = 0.30; break;
      default: ajuste = factorTamanoRaza;
    }

    // Extra por temperamento nervioso/agresivo
    if (temperamento === 'Agresivo' || temperamento === 'Nervioso') {
      ajuste += 0.10;
    }

    const duracionAjustada = Math.ceil(duracionBase * (1 + ajuste) / 15) * 15;
    return duracionAjustada;
  }
}