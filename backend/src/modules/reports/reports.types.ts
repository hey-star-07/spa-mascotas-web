export interface ReporteVentas {
  totalServicios: number;
  totalProductos: number;
  totalGeneral: number;
  porDia: Array<{ fecha: string; total: number; servicios: number; productos: number }>;
  porMetodoPago: Array<{ metodo: string; total: number; cantidad: number }>;
}

export interface ReporteRentabilidad {
  topServicios: Array<{ nombre: string; cantidad: number; ingresos: number }>;
  topProductos: Array<{ nombre: string; cantidad: number; ingresos: number }>;
}

export interface ReporteOcupacion {
  porGroomer: Array<{
    groomer: string;
    totalCitas: number;
    horasTrabajadas: number;
    porcentajeOcupacion: number;
  }>;
  porDia: Array<{ fecha: string; totalCitas: number; capacidadUsada: number }>;
}

export interface ReporteInsumos {
  consumos: Array<{
    producto: string;
    cantidadUsada: number;
    cantidadDevuelta: number;
    cantidadMerma: number;
    eficiencia: number;
  }>;
}

export interface ReporteGroomer {
  totalServicios: number;
  tiempoPromedio: number;
  serviciosPorDia: Array<{ fecha: string; cantidad: number }>;
  fichasRecientes: Array<{
    id: number;
    fecha: string;
    mascota: string;
    servicio: string;
    fotos: number;
    checklistCompletado: boolean;
  }>;
}

export interface ReporteCliente {
  mascotas: Array<{
    id: number;
    nombre: string;
    totalServicios: number;
    ultimoServicio: string | null;
    fotos: Array<{ tipo: string; url: string; fecha: string }>;
  }>;
}