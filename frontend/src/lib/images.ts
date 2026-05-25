/**
 * Obtiene la URL completa de una imagen
 * Si la URL ya es completa (http), la devuelve tal cual
 * Si es una ruta relativa (/uploads/...), le agrega la URL del backend
 */
export function getImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  return `${API_URL}${url}`;
}