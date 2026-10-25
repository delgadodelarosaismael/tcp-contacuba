import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { db, registrarIngreso, registrarExtraccion, anularTransaccion } from './db';

beforeEach(async () => { await db.transacciones.clear(); await db.comisiones.clear(); });

describe('base de datos local', () => {
  it('guarda el ingreso íntegro y la comisión por separado', async () => {
    await registrarIngreso({ fecha: '2026-03-05', montoBrutoCent: 100000, categoria: 'Ventas', canal: 'PAGO_EN_LINEA' }, 'TCP');
    const [t] = await db.transacciones.toArray();
    const [c] = await db.comisiones.toArray();
    expect(t.montoBrutoCent).toBe(100000);
    expect(c.montoCent).toBe(800);
  });
  it('efectivo en mano no genera comisión', async () => {
    await registrarIngreso({ fecha: '2026-03-05', montoBrutoCent: 50000, categoria: 'Ventas', canal: 'EFECTIVO' }, 'TCP');
    expect(await db.comisiones.count()).toBe(0);
  });
  it('la extracción solo crea costo financiero, no ingreso', async () => {
    await registrarExtraccion('2026-03-06', 100000, 'TCP');
    expect(await db.transacciones.count()).toBe(0);
    expect((await db.comisiones.toArray())[0].montoCent).toBe(200);
  });
  it('anular elimina la comisión asociada y conserva el asiento', async () => {
    const id = await registrarIngreso({ fecha: '2026-03-05', montoBrutoCent: 100000, categoria: 'Ventas', canal: 'TRANSFERENCIA' }, 'TCP');
    await anularTransaccion(id);
    expect(await db.comisiones.count()).toBe(0);
    expect((await db.transacciones.get(id))?.anulada).toBe(true);
  });
});
