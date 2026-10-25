import Dexie, { type Table } from 'dexie';
import type { CanalIngreso, Comision, ConfigFiscal, PagoTributo, TipoActor, Transaccion } from '../core/types';
import { calcularComisionBancaria, operacionPorCanal } from '../core/comisiones';
import { configPorDefecto } from '../core/config';

export interface Perfil {
  id: 'main';
  nombre: string;
  ci: string;
  nit: string;
  regimen: 'GENERAL' | 'SIMPLIFICADO';
  actividad: string;
  tieneEmpleados: boolean;
  tipoActor: TipoActor;
}
export interface Justificante { id: string; transaccionId: string; nombre: string; blob: Blob }

class ContaDB extends Dexie {
  perfil!: Table<Perfil, string>;
  config!: Table<ConfigFiscal, number>;
  transacciones!: Table<Transaccion, string>;
  comisiones!: Table<Comision, string>;
  pagos!: Table<PagoTributo, string>;
  justificantes!: Table<Justificante, string>;
  constructor(nombre = 'tcp-contacuba') {
    super(nombre);
    this.version(1).stores({
      perfil: 'id',
      config: 'anio',
      transacciones: 'id, fecha, tipo',
      comisiones: 'id, transaccionId, fecha',
      pagos: 'id, periodo, tributo',
      justificantes: 'id, transaccionId'
    });
  }
}

export const db = new ContaDB();

export const uid = () => crypto.randomUUID();
export const hoyISO = () => new Date().toISOString().slice(0, 10);

export async function getConfig(anio: number): Promise<ConfigFiscal> {
  return (await db.config.get(anio)) ?? configPorDefecto(anio);
}

/** Registra un ingreso por su monto ÍNTEGRO y, si el canal es bancario, su comisión por separado. */
export async function registrarIngreso(
  d: { fecha: string; montoBrutoCent: number; categoria: string; canal: CanalIngreso; nota?: string },
  actor: TipoActor
): Promise<string> {
  const id = uid();
  await db.transaction('rw', db.transacciones, db.comisiones, async () => {
    await db.transacciones.add({ id, tipo: 'INGRESO', justificado: true, ...d });
    const op = operacionPorCanal(d.canal);
    if (op) {
      const { tasa, comision } = calcularComisionBancaria(op, d.montoBrutoCent, actor);
      if (comision > 0) {
        await db.comisiones.add({ id: uid(), transaccionId: id, fecha: d.fecha, tipoOperacion: op, tasa, montoCent: comision, baseCent: d.montoBrutoCent });
      }
    }
  });
  return id;
}

/** Extracción de efectivo: solo genera costo financiero, no es ingreso. */
export async function registrarExtraccion(fecha: string, montoCent: number, actor: TipoActor) {
  const { tasa, comision } = calcularComisionBancaria('EXTRACCION_EFECTIVO', montoCent, actor);
  if (comision > 0) {
    await db.comisiones.add({ id: uid(), fecha, tipoOperacion: 'EXTRACCION_EFECTIVO', tasa, montoCent: comision, baseCent: montoCent });
  }
  return comision;
}

export async function registrarGasto(
  d: { fecha: string; montoBrutoCent: number; categoria: string; nota?: string; justificado: boolean },
  foto?: File
) {
  const id = uid();
  await db.transaction('rw', db.transacciones, db.justificantes, async () => {
    await db.transacciones.add({ id, tipo: 'GASTO', ...d, justificado: d.justificado || !!foto });
    if (foto) await db.justificantes.add({ id: uid(), transaccionId: id, nombre: foto.name, blob: foto });
  });
}

/** Anula una transacción (y sus comisiones). El libro conserva el rastro. */
export async function anularTransaccion(id: string) {
  await db.transaction('rw', db.transacciones, db.comisiones, async () => {
    await db.transacciones.update(id, { anulada: true });
    await db.comisiones.where('transaccionId').equals(id).delete();
  });
}
