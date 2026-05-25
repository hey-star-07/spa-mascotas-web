export interface CreatePetDTO {
  nombre: string;
  especie?: string;
  raza?: string;
  tamanio?: string;
  fechaNacimiento?: string;
  pesoKg?: number;
  temperamento?: string;
  alergiasConocidas?: string;
  restriccionesMedicas?: string;
  imagen?: string;
  carnetVacunas?: string;
}

export interface UpdatePetDTO {
  nombre?: string;
  especie?: string;
  raza?: string;
  tamanio?: string;
  fechaNacimiento?: string;
  pesoKg?: number;
  temperamento?: string;
  alergiasConocidas?: string;
  restriccionesMedicas?: string;
  imagen?: string;
  carnetVacunas?: string;
}