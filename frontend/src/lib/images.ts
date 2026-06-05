/**
 * Obtiene la URL base del backend (sin /api)
 * NEXT_PUBLIC_API_URL puede ser "http://localhost:3000/api" o "http://localhost:3000"
 */
function getBackendBaseUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
  // Quitar el sufijo /api si existe, para llegar a la raíz del servidor
  return apiUrl.replace(/\/api\/?$/, '');
}

/**
 * Obtiene la URL completa de una imagen.
 * - Si la URL ya es absoluta (http/https), la devuelve tal cual.
 * - Si es una ruta relativa (/uploads/...), le agrega la URL BASE del backend (sin /api).
 */
export function getImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  // Ya es una URL absoluta, devolverla tal cual
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  const baseUrl = getBackendBaseUrl();

  // Ruta relativa: /uploads/xxx o uploads/xxx
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${baseUrl}${cleanPath}`;
}