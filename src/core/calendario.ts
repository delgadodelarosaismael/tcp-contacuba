import type { ConfigFiscal, FechaISO } from './types';

export interface Vencimiento { fecha: FechaISO; titulo: string; detalle: string }

const dosD = (n: number) => String(n).padStart(2, '0');

/** Vencimientos relevantes alrededor de una fecha de referencia. */
export function proximosVencimientos(hoy: FechaISO, cfg: ConfigFiscal): Vencimiento[] {
  const [y, m] = hoy.split('-').map(Number);
  const out: Vencimiento[] = [];
  for (let i = 0; i < 3; i++) {
    const mes = ((m - 1 + i) % 12) + 1;
    const anio = y + Math.floor((m - 1 + i) / 12);
    out.push({
      fecha: `${anio}-${dosD(mes)}-${dosD(cfg.diaVencimientoMensual)}`,
      titulo: 'Pago mensual de tributos',
      detalle: '10% ventas/servicios y 5% a cuenta de ingresos personales del mes anterior (verificar fecha límite en el vector fiscal).'
    });
  }
  out.push({ fecha: cfg.fechaLimiteBonif, titulo: 'Fin de bonificación DJ-08', detalle: `Declarar y pagar antes de esta fecha: ${cfg.bonifProntoPago * 100}% de bonificación, más ${cfg.bonifCanalDigital * 100}% si pagas por canal digital.` });
  out.push({ fecha: cfg.fechaLimiteDJ08, titulo: 'Límite de la DJ-08', detalle: `Declaración jurada del año ${cfg.anio}. Se presenta desde el 10 de enero.` });
  return out.filter(v => v.fecha >= hoy).sort((a, b) => a.fecha.localeCompare(b.fecha));
}

export const diasHasta = (hoy: FechaISO, fecha: FechaISO) =>
  Math.round((Date.parse(fecha) - Date.parse(hoy)) / 86400000);
