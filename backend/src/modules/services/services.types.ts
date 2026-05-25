import { Decimal } from '@prisma/client/runtime/library';

export interface CreateServiceDTO {
  nombre: string;
  descripcion?: string;
  duracionBaseMinutos: number;
  precioBase: number;
  permiteDobleBooking?: boolean;
  factorTamanoRaza?: number;
  requiereBloqueConsecutivo?: boolean;
}

export interface UpdateServiceDTO {
  nombre?: string;
  descripcion?: string;
  duracionBaseMinutos?: number;
  precioBase?: number;
  permiteDobleBooking?: boolean;
  factorTamanoRaza?: number;
  requiereBloqueConsecutivo?: boolean;
  activo?: boolean;
}

// Interfaz que coincide con lo que devuelve Prisma
export interface ServicePrisma {
  id: number;
  nombre: string;
  descripcion: string | null;
  duracionBaseMinutos: number;
  precioBase: Decimal;  // 👈 Prisma devuelve Decimal
  permiteDobleBooking: boolean;
  factorTamanoRaza: Decimal;  // 👈 Prisma devuelve Decimal
  requiereBloqueConsecutivo: boolean;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Interfaz para la respuesta (con number)
export interface ServiceResponse {
  id: number;
  nombre: string;
  descripcion: string | null;
  duracionBaseMinutos: number;
  precioBase: number;
  permiteDobleBooking: boolean;
  factorTamanoRaza: number;
  requiereBloqueConsecutivo: boolean;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Función helper para convertir
export function toServiceResponse(service: ServicePrisma): ServiceResponse {
  return {
    ...service,
    precioBase: Number(service.precioBase),
    factorTamanoRaza: Number(service.factorTamanoRaza),
  };
}