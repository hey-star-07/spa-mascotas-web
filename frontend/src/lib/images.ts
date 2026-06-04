/**
 * Obtiene la URL completa de una imagen
 * Si la URL ya es completa (http), la devuelve tal cual
 * Si es una ruta relativa (/uploads/...), le agrega la URL del backend
 */
export function getImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  
  // Si ya incluye localhost, devolver tal cual
  if (url.includes('localhost')) return url;
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  
  // Si la URL ya empieza con /uploads, agregar el backend
  if (url.startsWith('/uploads')) {
    return `${API_URL}${url}`;
  }
  
  // Si empieza con /api, es una URL de API, devolver con backend
  if (url.startsWith('/api')) {
    return `${API_URL}${url}`;
  }
  
  // Para cualquier otra ruta relativa
  return `${API_URL}/${url}`;
}