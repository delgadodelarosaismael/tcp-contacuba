import type { Cent, Comision, ConfigFiscal, PagoTributo, Transaccion } from './types';
import { calcularTributosMensuales } from './tributos';

const vigentes = (t: Transaccion[]) => t.filter(x => !x.anulada);
const suma = (xs: Cent[]) => xs.reduce((a, b) => a + b, 0);

export function porcentajeJustificado(gastos: Transaccion[]): number {
  const g = vigentes(gastos).filter(x => x.tipo === 'GASTO');
  const total = suma(g.map(x => x.montoBrutoCent));
  if (total === 0) return 1;
  return suma(g.filter(x => x.justificado).map(x => x.montoBrutoCent)) / total;
}

export function resumenMes(periodo: string, txs: Transaccion[], coms: Comision[], pagos: PagoTributo[], cfg: ConfigFiscal) {
  const delMes = vigentes(txs).filter(t => t.fecha.startsWith(periodo));
  const ingresosBrutos = suma(delMes.filter(t => t.tipo === 'INGRESO').map(t => t.montoBrutoCent));
  const gastos = suma(delMes.filter(t => t.tipo === 'GASTO').map(t => t.montoBrutoCent));
  const comisiones = suma(coms.filter(c => c.fecha.startsWith(periodo)).map(c => c.montoCent));
  const trib = calcularTributosMensuales(ingresosBrutos, cfg);
  const pagado = (k: PagoTributo['tributo']) =>
    suma(pagos.filter(p => p.periodo === periodo && p.tributo === k).map(p => p.montoCent));
  return {
    periodo, ingresosBrutos, gastos, comisiones,
    netoDisponible: ingresosBrutos - comisiones,
    ...trib,
    pagadoVentas: pagado('VENTAS_SERVICIOS_10'),
    pagadoCuenta: pagado('PAGO_CUENTA_INGRESOS_5')
  };
}

export function resumenAnual(anio: number, txs: Transaccion[], coms: Comision[], pagos: PagoTributo[]) {
  const pref = String(anio);
  const del = vigentes(txs).filter(t => t.fecha.startsWith(pref));
  const ingresosBrutos = suma(del.filter(t => t.tipo === 'INGRESO').map(t => t.montoBrutoCent));
  const gastos = suma(del.filter(t => t.tipo === 'GASTO').map(t => t.montoBrutoCent));
  const comisiones = suma(coms.filter(c => c.fecha.startsWith(pref)).map(c => c.montoCent));
  const pagosAnio = pagos.filter(p => p.periodo.startsWith(pref));
  const pagadoCuenta = suma(pagosAnio.filter(p => p.tributo === 'PAGO_CUENTA_INGRESOS_5').map(p => p.montoCent));
  const pagadoVentas = suma(pagosAnio.filter(p => p.tributo === 'VENTAS_SERVICIOS_10').map(p => p.montoCent));
  return {
    ingresosBrutos, gastos, comisiones,
    gastosDeducibles: gastos + comisiones,
    pagadoCuenta, pagadoVentas,
    pctJustificado: porcentajeJustificado(del)
  };
}
