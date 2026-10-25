import type { Cent } from './types';

export const redondear = (x: number): Cent => Math.round(x);

/** Convierte texto del usuario ("1.250,50" o "1250.50") a centavos. */
export function aCentavos(texto: string): Cent {
  let t = texto.trim().replace(/\s/g, '');
  if (!t) return 0;
  if (t.includes(',') && t.includes('.')) {
    // el último separador es el decimal
    t = t.lastIndexOf(',') > t.lastIndexOf('.') ? t.replace(/\./g, '').replace(',', '.') : t.replace(/,/g, '');
  } else if (t.includes(',')) {
    t = t.replace(',', '.');
  }
  const n = Number(t);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

export function formatoCUP(c: Cent): string {
  const signo = c < 0 ? '-' : '';
  const abs = Math.abs(c);
  const enteros = Math.floor(abs / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const dec = (abs % 100).toString().padStart(2, '0');
  return `${signo}${enteros},${dec} CUP`;
}
