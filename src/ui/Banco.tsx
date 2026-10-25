import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, hoyISO, registrarExtraccion, type Perfil } from '../db/db';
import { aCentavos } from '../core/dinero';
import { calcularComisionBancaria, montoNetoDisponible, operacionPorCanal } from '../core/comisiones';
import type { CanalIngreso } from '../core/types';
import { Aviso, Campo, Dinero } from './common';

const NOMBRE_OP = { EXTRACCION_EFECTIVO: 'Extracción de efectivo', COBRO_DIGITAL: 'Cobro digital', TRANSFERENCIA_RECIBIDA: 'Transferencia recibida' } as const;

export function Banco({ perfil }: { perfil: Perfil }) {
  const [monto, setMonto] = useState('');
  const [canal, setCanal] = useState<CanalIngreso>('PAGO_EN_LINEA');
  const [extr, setExtr] = useState('');
  const [msg, setMsg] = useState('');
  const coms = useLiveQuery(() => db.comisiones.orderBy('fecha').reverse().toArray(), []);

  const bruto = aCentavos(monto);
  const op = operacionPorCanal(canal);
  const { tasa, comision } = op ? calcularComisionBancaria(op, bruto, perfil.tipoActor) : { tasa: 0, comision: 0 };

  const extraer = async () => {
    const c = await registrarExtraccion(hoyISO(), aCentavos(extr), perfil.tipoActor);
    setMsg(`Extracción registrada. Comisión: ${(c / 100).toFixed(2)} CUP.`);
    setExtr('');
  };

  return (
    <section>
      <h2>Banco y conciliación</h2>
      <Aviso tipo="info">Las comisiones (0,2% y 0,8%) son costos financieros deducibles, no tributos. El ingreso siempre se declara por el monto íntegro.</Aviso>

      <h3>Simula una entrada de dinero</h3>
      <div className="form">
        <Campo etiqueta="Canal">
          <select value={canal} onChange={e => setCanal(e.target.value as CanalIngreso)}>
            <option value="PAGO_EN_LINEA">Pago en línea (Transfermóvil / EnZona)</option>
            <option value="TRANSFERENCIA">Transferencia recibida</option>
            <option value="EFECTIVO">Efectivo en mano</option>
          </select>
        </Campo>
        <Campo etiqueta="Monto íntegro (CUP)"><input inputMode="decimal" value={monto} onChange={e => setMonto(e.target.value)} placeholder="0,00" /></Campo>
        {bruto > 0 && (
          <dl className="tabla">
            <dt>Ingreso bruto (base de tributos)</dt><dd><Dinero c={bruto} /></dd>
            <dt>Comisión bancaria ({(tasa * 100).toFixed(1).replace('.', ',')}%)</dt><dd><Dinero c={comision} className="gas" /></dd>
            <dt>Neto disponible</dt><dd><Dinero c={montoNetoDisponible(bruto, comision)} /></dd>
          </dl>
        )}
        <p className="nota">Para guardar el ingreso, regístralo en el Libro con ese canal: la comisión se crea sola.</p>
      </div>

      <h3>Extracción de efectivo</h3>
      <div className="form">
        <Campo etiqueta="Monto extraído del cajero o la sucursal (CUP)"><input inputMode="decimal" value={extr} onChange={e => setExtr(e.target.value)} /></Campo>
        <button className="primario" onClick={extraer} disabled={aCentavos(extr) <= 0}>Registrar extracción</button>
        {msg && <p role="status">{msg}</p>}
      </div>

      <h3>Comisiones registradas</h3>
      {!coms?.length && <p className="vacio">Aún no hay comisiones. Aparecen al registrar ingresos por transferencia o pago en línea.</p>}
      <ul className="lista">
        {coms?.map(c => (
          <li key={c.id}>
            <div><strong>{NOMBRE_OP[c.tipoOperacion]}</strong><small>{c.fecha} · {(c.tasa * 100).toFixed(1).replace('.', ',')}% de <Dinero c={c.baseCent} /></small></div>
            <Dinero c={c.montoCent} className="gas" />
          </li>
        ))}
      </ul>
    </section>
  );
}
