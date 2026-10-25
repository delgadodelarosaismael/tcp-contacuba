import type { Cent, ConfigFiscal, FechaISO } from './types';
import { redondear } from './dinero';

/**
 * Base imponible = ingresos brutos − mínimo exento anual − gastos deducibles
 * (los gastos incluyen las comisiones bancarias). Los pagos a cuenta NO se
 * restan de la base: se restan del impuesto resultante (ver calcularImpuestoFinal).
 */
export function calcularBaseImponibleDJ08(
  ingresosBrutosAnuales: Cent,
  gastosDeducibles: Cent,
  cfg: ConfigFiscal
): Cent {
  return Math.max(0, ingresosBrutosAnuales - cfg.minimoExentoAnual - gastosDeducibles);
}

export function aplicarEscalaProgresiva(base: Cent, cfg: ConfigFiscal): Cent {
  let impuesto = 0;
  for (const t of cfg.escala) {
    if (base <= t.desde) break;
    const tope = t.hasta ?? base;
    impuesto += (Math.min(base, tope) - t.desde) * t.tasa;
  }
  return redondear(impuesto);
}

export function calcularImpuestoFinal(
  impuestoAnual: Cent,
  pagosACuentaIngresos: Cent,
  fechaPago: FechaISO,
  canal: 'DIGITAL' | 'VENTANILLA',
  cfg: ConfigFiscal
) {
  const aPagar = Math.max(0, impuestoAnual - pagosACuentaIngresos);
  const aFavor = Math.max(0, pagosACuentaIngresos - impuestoAnual);
  const enPlazoBonif = fechaPago <= cfg.fechaLimiteBonif;
  const bonifPronto = enPlazoBonif ? redondear(aPagar * cfg.bonifProntoPago) : 0;
  // VERIFICAR: aquí el 3% se calcula sobre el importe a pagar original.
  const bonifDigital = enPlazoBonif && canal === 'DIGITAL' ? redondear(aPagar * cfg.bonifCanalDigital) : 0;
  const fueraDePlazo = fechaPago > cfg.fechaLimiteDJ08;
  return { aPagar, aFavor, bonifPronto, bonifDigital, totalAPagar: aPagar - bonifPronto - bonifDigital, fueraDePlazo };
}
