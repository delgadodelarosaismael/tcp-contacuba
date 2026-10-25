import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getConfig, hoyISO, uid } from '../db/db';
import { resumenMes } from '../core/resumen';
import type { PagoTributo, TipoTributo } from '../core/types';
import { aCentavos } from '../core/dinero';
import { Aviso, Dinero, nombrePeriodo } from './common';

const NOMBRE: Record<TipoTributo, string> = {
  VENTAS_SERVICIOS_10: 'Impuesto sobre ventas y servicios (10%)',
  PAGO_CUENTA_INGRESOS_5: 'Pago a cuenta de ingresos personales (5%)',
  SEGURIDAD_SOCIAL: 'Contribución a la seguridad social',
  FUERZA_TRABAJO: 'Impuesto por fuerza de trabajo'
};

export function Tributos({ anio, periodo }: { anio: number; periodo: string }) {
  const [tributo, setTributo] = useState<TipoTributo>('VENTAS_SERVICIOS_10');
  const [monto, setMonto] = useState('');
  const [canal, setCanal] = useState<PagoTributo['canal']>('DIGITAL');
  const datos = useLiveQuery(async () => {
    const [txs, coms, pagos, cfg] = await Promise.all([db.transacciones.toArray(), db.comisiones.toArray(), db.pagos.toArray(), getConfig(anio)]);
    return { txs, coms, pagos, cfg };
  }, [anio]);
  if (!datos) return null;
  const m = resumenMes(periodo, datos.txs, datos.coms, datos.pagos, datos.cfg);
  const pagosMes = datos.pagos.filter(p => p.periodo === periodo);
  const sugerido = (t: TipoTributo) =>
    t === 'VENTAS_SERVICIOS_10' ? m.impuestoVentas - m.pagadoVentas : t === 'PAGO_CUENTA_INGRESOS_5' ? m.pagoCuentaIngresos - m.pagadoCuenta : 0;

  const guardar = async () => {
    const c = aCentavos(monto);
    if (c <= 0) return;
    await db.pagos.add({ id: uid(), periodo, tributo, montoCent: c, fechaPago: hoyISO(), canal });
    setMonto('');
  };

  return (
    <section>
      <h2>Tributos de {nombrePeriodo(periodo)}</h2>
      <Aviso tipo="info">Son tributos que se calculan sobre el ingreso bruto mensual. Las comisiones bancarias no entran aquí.</Aviso>
      <dl className="tabla">
        <dt>Ingreso bruto del mes</dt><dd><Dinero c={m.ingresosBrutos} /></dd>
        <dt>10% ventas y servicios</dt><dd><Dinero c={m.impuestoVentas} /> <small>pagado <Dinero c={m.pagadoVentas} /></small></dd>
        <dt>5% a cuenta de ingresos personales</dt><dd><Dinero c={m.pagoCuentaIngresos} /> <small>pagado <Dinero c={m.pagadoCuenta} /></small></dd>
      </dl>
      {datos.cfg.modoPagoCuenta === 'SOBRE_EXCEDENTE' && <p className="nota">El 5% se calcula sobre lo que excede {(datos.cfg.minimoExentoMensual / 100).toFixed(2)} CUP (ajustable en Ajustes).</p>}

      <h3>Registrar un pago</h3>
      <div className="form">
        <label className="campo"><span>Tributo</span>
          <select value={tributo} onChange={e => { setTributo(e.target.value as TipoTributo); const s = sugerido(e.target.value as TipoTributo); setMonto(s > 0 ? (s / 100).toFixed(2) : ''); }}>
            {(Object.keys(NOMBRE) as TipoTributo[]).map(k => <option key={k} value={k}>{NOMBRE[k]}</option>)}
          </select>
        </label>
        <label className="campo"><span>Monto pagado (CUP)</span><input inputMode="decimal" value={monto} onChange={e => setMonto(e.target.value)} /></label>
        <label className="campo"><span>Canal de pago</span>
          <select value={canal} onChange={e => setCanal(e.target.value as PagoTributo['canal'])}>
            <option value="DIGITAL">Digital (Transfermóvil / EnZona)</option>
            <option value="VENTANILLA">Ventanilla</option>
          </select>
        </label>
        <button className="primario" onClick={guardar}>Registrar pago</button>
      </div>
      {!pagosMes.length && <p className="vacio">No hay pagos registrados en este mes.</p>}
      <ul className="lista">
        {pagosMes.map(p => (
          <li key={p.id}>
            <div><strong>{NOMBRE[p.tributo]}</strong><small>{p.fechaPago} · {p.canal === 'DIGITAL' ? 'digital' : 'ventanilla'}</small></div>
            <div className="der"><Dinero c={p.montoCent} /><button className="enlace" onClick={() => db.pagos.delete(p.id)}>Quitar</button></div>
          </li>
        ))}
      </ul>
    </section>
  );
}
