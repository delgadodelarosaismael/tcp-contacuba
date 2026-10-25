import { describe, it, expect } from 'vitest';
import { configPorDefecto } from './config';
import { calcularTributosMensuales } from './tributos';
import { calcularComisionBancaria, montoNetoDisponible, operacionPorCanal } from './comisiones';
import { calcularBaseImponibleDJ08, aplicarEscalaProgresiva, calcularImpuestoFinal } from './dj08';
import { aCentavos, formatoCUP } from './dinero';
import { porcentajeJustificado, resumenAnual } from './resumen';
import { proximosVencimientos } from './calendario';
import type { Transaccion } from './types';

const cfg = configPorDefecto(2026);

describe('tributos mensuales', () => {
  it('10% sobre el total, sin descontar mínimo exento', () => {
    expect(calcularTributosMensuales(10000000, cfg).impuestoVentas).toBe(1000000);
  });
  it('5% sobre el total en modo SOBRE_TOTAL', () => {
    expect(calcularTributosMensuales(10000000, cfg).pagoCuentaIngresos).toBe(500000);
  });
  it('5% sobre el excedente en modo SOBRE_EXCEDENTE', () => {
    const c = { ...cfg, modoPagoCuenta: 'SOBRE_EXCEDENTE' as const };
    expect(calcularTributosMensuales(1000000, c).pagoCuentaIngresos).toBe(Math.round((1000000 - 326000) * 0.05));
    expect(calcularTributosMensuales(300000, c).pagoCuentaIngresos).toBe(0);
  });
});

describe('comisiones bancarias', () => {
  it('cobro digital 0,8% y el ingreso bruto no cambia', () => {
    const { comision } = calcularComisionBancaria('COBRO_DIGITAL', 100000, 'TCP');
    expect(comision).toBe(800);
    expect(montoNetoDisponible(100000, comision)).toBe(99200);
  });
  it('extracción 0,2% solo a actores económicos', () => {
    expect(calcularComisionBancaria('EXTRACCION_EFECTIVO', 100000, 'TCP').comision).toBe(200);
    expect(calcularComisionBancaria('EXTRACCION_EFECTIVO', 100000, 'PERSONA_NATURAL').comision).toBe(0);
  });
  it('efectivo en mano no genera operación bancaria', () => {
    expect(operacionPorCanal('EFECTIVO')).toBeNull();
    expect(operacionPorCanal('PAGO_EN_LINEA')).toBe('COBRO_DIGITAL');
  });
});

describe('DJ-08', () => {
  it('base = ingresos − mínimo exento − gastos, nunca negativa', () => {
    expect(calcularBaseImponibleDJ08(10000000, 2000000, cfg)).toBe(10000000 - 3912000 - 2000000);
    expect(calcularBaseImponibleDJ08(1000000, 0, cfg)).toBe(0);
  });
  it('escala progresiva por tramos', () => {
    const c = { ...cfg, escala: [{ desde: 0, hasta: 100, tasa: 0.1 }, { desde: 100, hasta: null, tasa: 0.2 }] };
    expect(aplicarEscalaProgresiva(150, c)).toBe(Math.round(10 + 10));
  });
  it('bonificaciones 5% + 3% antes del 28-feb por canal digital', () => {
    const r = calcularImpuestoFinal(1000000, 400000, '2027-02-10', 'DIGITAL', cfg);
    expect(r.aPagar).toBe(600000);
    expect(r.bonifPronto).toBe(30000);
    expect(r.bonifDigital).toBe(18000);
    expect(r.totalAPagar).toBe(552000);
  });
  it('sin bonificación después del 28-feb', () => {
    const r = calcularImpuestoFinal(1000000, 400000, '2027-03-15', 'DIGITAL', cfg);
    expect(r.totalAPagar).toBe(600000);
  });
  it('saldo a favor si los pagos a cuenta superan el impuesto', () => {
    expect(calcularImpuestoFinal(100000, 400000, '2027-04-01', 'VENTANILLA', cfg).aFavor).toBe(300000);
  });
});

describe('dinero', () => {
  it('parsea formatos con coma y punto', () => {
    expect(aCentavos('1.250,50')).toBe(125050);
    expect(aCentavos('1250.5')).toBe(125050);
    expect(aCentavos('')).toBe(0);
  });
  it('formatea en CUP', () => {
    expect(formatoCUP(125050)).toBe('1.250,50 CUP');
  });
});

describe('resumen y justificantes', () => {
  const tx = (o: Partial<Transaccion>): Transaccion => ({
    id: Math.random().toString(), tipo: 'GASTO', fecha: '2026-03-01', montoBrutoCent: 1000,
    categoria: 'x', justificado: false, ...o
  });
  it('% justificado', () => {
    expect(porcentajeJustificado([tx({ justificado: true, montoBrutoCent: 800 }), tx({ montoBrutoCent: 200 })])).toBe(0.8);
  });
  it('las comisiones suman a los gastos deducibles', () => {
    const r = resumenAnual(2026, [tx({ tipo: 'INGRESO', montoBrutoCent: 5000 }), tx({ montoBrutoCent: 1000 })],
      [{ id: 'c', fecha: '2026-03-01', tipoOperacion: 'COBRO_DIGITAL', tasa: 0.008, montoCent: 40, baseCent: 5000 }], []);
    expect(r.gastosDeducibles).toBe(1040);
    expect(r.ingresosBrutos).toBe(5000);
  });
});

describe('calendario', () => {
  it('incluye 28-feb y 30-abr', () => {
    const v = proximosVencimientos('2027-01-05', cfg).map(x => x.fecha);
    expect(v).toContain('2027-02-28');
    expect(v).toContain('2027-04-30');
  });
});
