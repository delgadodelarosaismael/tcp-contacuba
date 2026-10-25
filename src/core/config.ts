import type { ConfigFiscal } from './types';

/**
 * Parámetros fiscales por año. NO están fijos en el código de cálculo:
 * el usuario puede editarlos en Ajustes cuando la ONAT los cambie.
 * Valores marcados "VERIFICAR" deben confirmarse con la ONAT o un contador.
 */
export function configPorDefecto(anio: number): ConfigFiscal {
  return {
    anio,
    tasaVentas: 0.10,
    tasaPagoCuenta: 0.05,
    modoPagoCuenta: 'SOBRE_TOTAL', // VERIFICAR
    minimoExentoMensual: 326000, // 3.260,00 CUP
    minimoExentoAnual: 3912000, // 39.120,00 CUP
    umbralJustificados: 0.8, // VERIFICAR: hay reportes de reconocimiento del 100% de gastos
    tasaFuerzaTrabajo: null, // VERIFICAR
    bonifProntoPago: 0.05,
    bonifCanalDigital: 0.03,
    fechaLimiteBonif: `${anio + 1}-02-28`,
    fechaLimiteDJ08: `${anio + 1}-04-30`,
    diaVencimientoMensual: 20,
    // ESCALA DE EJEMPLO, NO OFICIAL. Reemplazar por la vigente (Ajustes).
    escala: [
      { desde: 0, hasta: 1000000, tasa: 0.15 },
      { desde: 1000000, hasta: 3000000, tasa: 0.2 },
      { desde: 3000000, hasta: null, tasa: 0.3 }
    ],
    escalaVerificada: false
  };
}
