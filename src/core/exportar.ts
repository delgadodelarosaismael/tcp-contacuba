import type { Comision, Transaccion } from './types';

const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
const cup = (c: number) => (c / 100).toFixed(2);

/** CSV (se abre en Excel) del libro de ingresos, gastos y comisiones de un año. */
export function libroCSV(anio: number, txs: Transaccion[], coms: Comision[]): string {
  const filas = ['Fecha;Tipo;Categoria;Canal;Monto bruto CUP;Justificado;Nota'];
  txs.filter(t => !t.anulada && t.fecha.startsWith(String(anio)))
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .forEach(t => filas.push([t.fecha, t.tipo, esc(t.categoria), t.canal ?? '', cup(t.montoBrutoCent), t.justificado ? 'Si' : 'No', esc(t.nota ?? '')].join(';')));
  coms.filter(c => c.fecha.startsWith(String(anio)))
    .forEach(c => filas.push([c.fecha, 'COSTO_FINANCIERO', c.tipoOperacion, '', cup(c.montoCent), 'N/A', 'Comision bancaria (no es tributo)'].join(';')));
  return '\uFEFF' + filas.join('\n');
}
