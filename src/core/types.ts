/** Todo el dinero se maneja en CENTAVOS enteros (nunca floats). */
export type Cent = number;
export type FechaISO = string; // 'YYYY-MM-DD'

export type CanalIngreso = 'EFECTIVO' | 'TRANSFERENCIA' | 'PAGO_EN_LINEA';
export type TipoOperacionBanco = 'EXTRACCION_EFECTIVO' | 'COBRO_DIGITAL' | 'TRANSFERENCIA_RECIBIDA';
export type TipoActor = 'TCP' | 'MIPYME' | 'COOPERATIVA' | 'PERSONA_NATURAL';
export type TipoTributo =
  | 'VENTAS_SERVICIOS_10'
  | 'PAGO_CUENTA_INGRESOS_5'
  | 'SEGURIDAD_SOCIAL'
  | 'FUERZA_TRABAJO';

export interface TramoEscala {
  desde: Cent;
  hasta: Cent | null;
  tasa: number;
}

export interface ConfigFiscal {
  anio: number;
  tasaVentas: number;
  tasaPagoCuenta: number;
  /** SOBRE_TOTAL: 5% de todo el ingreso. SOBRE_EXCEDENTE: 5% de lo que pase del mínimo mensual. VERIFICAR con ONAT. */
  modoPagoCuenta: 'SOBRE_TOTAL' | 'SOBRE_EXCEDENTE';
  minimoExentoMensual: Cent;
  minimoExentoAnual: Cent;
  umbralJustificados: number;
  tasaFuerzaTrabajo: number | null;
  bonifProntoPago: number;
  bonifCanalDigital: number;
  fechaLimiteBonif: FechaISO;
  fechaLimiteDJ08: FechaISO;
  diaVencimientoMensual: number;
  escala: TramoEscala[];
  /** false mientras la escala sea un valor de ejemplo no verificado. */
  escalaVerificada: boolean;
}

export interface Transaccion {
  id: string;
  tipo: 'INGRESO' | 'GASTO';
  fecha: FechaISO;
  /** INGRESO: monto ÍNTEGRO recibido (nunca el neto tras comisiones). */
  montoBrutoCent: Cent;
  categoria: string;
  canal?: CanalIngreso;
  nota?: string;
  justificado: boolean;
  anulada?: boolean;
}

export interface Comision {
  id: string;
  /** Vacío en extracciones de efectivo (no hay ingreso asociado). */
  transaccionId?: string;
  fecha: FechaISO;
  tipoOperacion: TipoOperacionBanco;
  tasa: number;
  montoCent: Cent;
  baseCent: Cent;
}

export interface PagoTributo {
  id: string;
  periodo: string; // 'YYYY-MM'
  tributo: TipoTributo;
  montoCent: Cent;
  fechaPago: FechaISO;
  canal: 'DIGITAL' | 'VENTANILLA';
}
