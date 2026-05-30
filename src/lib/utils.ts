import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combina clases con tailwind-merge para evitar conflictos.
 * Uso: cn('p-2', condicion && 'p-4') → 'p-4'
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Formatea un número como moneda en pesos argentinos.
 * 1234567.89 → "$ 1.234.567,89"
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '$ 0,00'
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Formatea una fecha ISO a formato dd/mm/aaaa.
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(d)
}

/**
 * Formatea fecha + hora.
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(d)
}

/**
 * Días calendario hasta que vence un presupuesto (validez: 15 días desde emisión).
 * Negativo si ya venció.
 */
export function diasHastaVencimiento(fechaCreacion: string): number {
  const vencimiento = new Date(fechaCreacion)
  vencimiento.setDate(vencimiento.getDate() + 15)
  vencimiento.setHours(0, 0, 0, 0)
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  return Math.round((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
}

// Palabras que van en minúscula en nombres de entidades (excepto al inicio)
const MINUSCULAS = new Set(['de', 'del', 'la', 'las', 'los', 'el', 'y', 'e', 'a', 'en', 'con', 'por', 'al'])

/**
 * Aplica formato nombre propio (title case en español) a un string.
 * "consorcio de propietarios GUALEGUAYCHU" → "Consorcio de Propietarios Gualeguaychú"
 * Preserva siglas (≥3 chars en mayúscula) tal cual.
 */
export function toNombrePropio(str: string | null | undefined): string {
  if (!str) return ''
  return str
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word, idx) => {
      if (!word) return word
      // Números y signos: dejar igual
      if (/^\d/.test(word)) return word
      // Minúsculas de enlace (excepto primera palabra)
      if (idx > 0 && MINUSCULAS.has(word)) return word
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

/**
 * Slugifica una cadena para usar como ID.
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
