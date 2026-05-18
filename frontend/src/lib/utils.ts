import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('es-BO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function getRoleBadgeColor(rol: string): string {
  const colors: Record<string, string> = {
    Admin: 'bg-lavender',
    Recepcion: 'bg-info text-white',
    Groomer: 'bg-accent',
    Cliente: 'bg-primary',
  };
  return colors[rol] || 'bg-gray-300';
}

export function calculatePasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 10;
  if (/[A-Z]/.test(password)) score += 20;
  if (/[a-z]/.test(password)) score += 15;
  if (/[0-9]/.test(password)) score += 15;
  if (/[!@#$%^&*]/.test(password)) score += 20;

  const label = score < 30 ? 'Débil' : score < 60 ? 'Regular' : score < 80 ? 'Buena' : 'Excelente';
  const color = score < 30 ? '#F4C2C2' : score < 60 ? '#F4E4BA' : score < 80 ? '#A8D5BA' : '#C3B1E1';

  return { score: Math.min(score, 100), label, color };
}