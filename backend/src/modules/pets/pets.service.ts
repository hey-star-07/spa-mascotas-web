import prisma from '../../config/database';
import { AppError } from '../../shared/errors/AppError';
import { ErrorCodes } from '../../shared/errors/errorCodes';
import { CreatePetDTO, UpdatePetDTO } from './pets.types';
import { TemperamentoMascota } from '@prisma/client';

export class PetsService {
  // Obtener mascotas de un cliente
  static async getByCliente(clienteId: number) {
    return prisma.mascota.findMany({
      where: { clienteId },
      include: { vacunas: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Obtener mascota por ID
    static async getById(id: number) {
    const pet = await prisma.mascota.findUnique({
        where: { id },
        include: {
        vacunas: true,
        cliente: { include: { usuario: { select: { nombre: true, apellido: true, email: true } } } },
        citas: {
            include: {
            servicio: { select: { nombre: true } },
            groomer: { include: { usuario: { select: { nombre: true } } } },
            fichaGrooming: { include: { fotos: true } },
            },
            orderBy: { fechaHoraInicio: 'desc' },
        },
        },
    });
    if (!pet) throw new AppError(ErrorCodes.USER_NOT_FOUND, 404, 'Mascota no encontrada');
    return pet;
    }

  // Helper para convertir string a enum
  private static toTemperamento(value?: string | null): TemperamentoMascota | null {
    if (!value) return null;
    const validos: TemperamentoMascota[] = ['Tranquilo', 'Jugueton', 'Agresivo', 'Timido', 'Indiferente'];
    return validos.includes(value as TemperamentoMascota) ? (value as TemperamentoMascota) : null;
  }

  // Crear mascota
  static async create(clienteId: number, data: CreatePetDTO) {
    return prisma.mascota.create({
      data: {
        clienteId,
        nombre: data.nombre,
        especie: data.especie || 'Canino',
        raza: data.raza || null,
        tamanio: data.tamanio || null,
        fechaNacimiento: data.fechaNacimiento ? new Date(data.fechaNacimiento) : null,
        pesoKg: data.pesoKg || null,
        temperamento: this.toTemperamento(data.temperamento),
        alergiasConocidas: data.alergiasConocidas || null,
        restriccionesMedicas: data.restriccionesMedicas || null,
        imagen: data.imagen || null,
        carnetVacunas: data.carnetVacunas || null,
      },
    });
  }

  // Actualizar mascota
  static async update(id: number, data: UpdatePetDTO) {
    const pet = await prisma.mascota.findUnique({ where: { id } });
    if (!pet) throw new AppError(ErrorCodes.USER_NOT_FOUND, 404, 'Mascota no encontrada');

    const updateData: any = {};
    
    if (data.nombre !== undefined) updateData.nombre = data.nombre;
    if (data.especie !== undefined) updateData.especie = data.especie;
    if (data.raza !== undefined) updateData.raza = data.raza || null;
    if (data.tamanio !== undefined) updateData.tamanio = data.tamanio || null;
    if (data.fechaNacimiento !== undefined) {
      updateData.fechaNacimiento = data.fechaNacimiento ? new Date(data.fechaNacimiento) : null;
    }
    if (data.pesoKg !== undefined) updateData.pesoKg = data.pesoKg || null;
    if (data.temperamento !== undefined) {
      updateData.temperamento = this.toTemperamento(data.temperamento);
    }
    if (data.alergiasConocidas !== undefined) updateData.alergiasConocidas = data.alergiasConocidas || null;
    if (data.restriccionesMedicas !== undefined) updateData.restriccionesMedicas = data.restriccionesMedicas || null;
    if (data.carnetVacunas !== undefined) updateData.carnetVacunas = data.carnetVacunas || null;
    return prisma.mascota.update({
      where: { id },
      data: updateData,
    });
  }

  // Eliminar mascota
  static async delete(id: number) {
    return prisma.mascota.delete({ where: { id } });
  }
}