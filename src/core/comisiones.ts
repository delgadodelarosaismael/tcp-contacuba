import type { Cent, TipoActor, TipoOperacionBanco, CanalIngreso } from './types';
import { redondear } from './dinero';

export const TASA_EXTRACCION = 0.002;
export const TASA_DIGITAL = 0.008;

/**
 * COSTOS FINANCIEROS (no tributos). Deducibles en la liquidación anual.
 * - Extracción de efectivo: 0,2% solo a actores económicos.
 * - Cobro digital (Transfermóvil/EnZona): 0,8%, lo asume el comercio.
 * - Transferencia recibida: 0,8%, la asume quien recibe (persona jurídica/actor económico).
 */
export function calcularComisionBancaria(tipo: TipoOperacionBanco, monto: Cent, actor: TipoActor) {
  const esActorEconomico = actor !== 'PERSONA_NATURAL';
  let tasa = 0;
  if (tipo === 'EXTRACCION_EFECTIVO' && esActorEconomico) tasa = TASA_EXTRACCION;
  if (tipo === 'COBRO_DIGITAL') tasa = TASA_DIGITAL;
  if (tipo === 'TRANSFERENCIA_RECIBIDA' && esActorEconomico) tasa = TASA_DIGITAL;
  return { tasa, comision: redondear(monto * tasa) };
}

/** Qué operación bancaria genera un ingreso según el canal por el que entró el dinero. */
export function operacionPorCanal(canal: CanalIngreso): TipoOperacionBanco | null {
  if (canal === 'PAGO_EN_LINEA') return 'COBRO_DIGITAL';
  if (canal === 'TRANSFERENCIA') return 'TRANSFERENCIA_RECIBIDA';
  return null; // efectivo en mano: no pasa por el banco, sin comisión al cobrar
}

/** Monto neto disponible = ingreso bruto − comisión. El INGRESO BRUTO no cambia. */
export const montoNetoDisponible = (bruto: Cent, comision: Cent): Cent => bruto - comision;
