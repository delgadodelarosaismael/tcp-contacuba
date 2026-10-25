import type { Cent, ConfigFiscal } from './types';
import { redondear } from './dinero';

/**
 * TRIBUTOS mensuales sobre el INGRESO BRUTO del mes (monto íntegro recibido).
 * Las comisiones bancarias NO son tributos y no intervienen aquí.
 */
export function calcularTributosMensuales(ingresosBrutosMes: Cent, cfg: ConfigFiscal) {
  // 10% Ventas/Servicios: sobre el total, SIN descontar el mínimo exento.
  const impuestoVentas = redondear(ingresosBrutosMes * cfg.tasaVentas);
  const baseCuenta =
    cfg.modoPagoCuenta === 'SOBRE_EXCEDENTE'
      ? Math.max(0, ingresosBrutosMes - cfg.minimoExentoMensual)
      : ingresosBrutosMes;
  // 5% a cuenta de Ingresos Personales: anticipo que se acredita en la DJ-08.
  const pagoCuentaIngresos = redondear(baseCuenta * cfg.tasaPagoCuenta);
  return { impuestoVentas, pagoCuentaIngresos, baseCuenta };
}

/** Impuesto por utilización de fuerza de trabajo (si hay empleados). Tasa a verificar. */
export function calcularFuerzaTrabajo(remuneraciones: Cent, cfg: ConfigFiscal): Cent | null {
  return cfg.tasaFuerzaTrabajo == null ? null : redondear(remuneraciones * cfg.tasaFuerzaTrabajo);
}
