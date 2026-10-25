import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getConfig, hoyISO } from '../db/db';
import { resumenAnual } from '../core/resumen';
import { aplicarEscalaProgresiva, calcularBaseImponibleDJ08, calcularImpuestoFinal } from '../core/dj08';
import { Aviso, Dinero } from './common';

const PASOS = ['Ingresos', 'Gastos', 'Base imponible', 'Impuesto', 'Resumen'];

export function DJ08({ anio }: { anio: number }) {
  const [paso, setPaso] = useState(0);
  const [fechaPago, setFechaPago] = useState(hoyISO());
  const [canal, setCanal] = useState<'DIGITAL' | 'VENTANILLA'>('DIGITAL');
  const datos = useLiveQuery(async () => {
    const [txs, coms, pagos, cfg] = await Promise.all([db.transacciones.toArray(), db.comisiones.toArray(), db.pagos.toArray(), getConfig(anio)]);
    return { a: resumenAnual(anio, txs, coms, pagos), cfg };
  }, [anio]);
  if (!datos) return null;
  const { a, cfg } = datos;
  const base = calcularBaseImponibleDJ08(a.ingresosBrutos, a.gastosDeducibles, cfg);
  const impuesto = aplicarEscalaProgresiva(base, cfg);
  const fin = calcularImpuestoFinal(impuesto, a.pagadoCuenta, fechaPago, canal, cfg);

  return (
    <section>
      <h2>Asistente DJ-08 · año {anio}</h2>
      <ol className="pasos" aria-label="Pasos">
        {PASOS.map((p, i) => <li key={p} className={i === paso ? 'on' : i < paso ? 'hecho' : ''}><button onClick={() => setPaso(i)}>{p}</button></li>)}
      </ol>

      {paso === 0 && (<div>
        <dl className="tabla"><dt>Ingresos brutos del año</dt><dd><Dinero c={a.ingresosBrutos} /></dd></dl>
        <p className="nota">Suma de todos los ingresos por su monto íntegro, sin restar comisiones.</p>
      </div>)}

      {paso === 1 && (<div>
        <dl className="tabla">
          <dt>Gastos registrados</dt><dd><Dinero c={a.gastos} /></dd>
          <dt>Comisiones bancarias (costo financiero)</dt><dd><Dinero c={a.comisiones} /></dd>
          <dt>Gastos deducibles</dt><dd><Dinero c={a.gastosDeducibles} /></dd>
          <dt>Gastos con justificante</dt><dd>{Math.round(a.pctJustificado * 100)}%</dd>
        </dl>
        {a.pctJustificado < cfg.umbralJustificados && a.gastos > 0 && (
          <Aviso tipo="alerta">Por debajo del {Math.round(cfg.umbralJustificados * 100)}% de gastos justificados. Revisa si la ONAT te lo exige antes de deducir todo.</Aviso>
        )}
      </div>)}

      {paso === 2 && (<dl className="tabla">
        <dt>Ingresos brutos</dt><dd><Dinero c={a.ingresosBrutos} /></dd>
        <dt>Menos mínimo exento anual</dt><dd><Dinero c={cfg.minimoExentoAnual} /></dd>
        <dt>Menos gastos deducibles</dt><dd><Dinero c={a.gastosDeducibles} /></dd>
        <dt><strong>Base imponible</strong></dt><dd><strong><Dinero c={base} /></strong></dd>
      </dl>)}

      {paso === 3 && (<div>
        {!cfg.escalaVerificada && <Aviso tipo="alerta">La escala progresiva es un valor de ejemplo, no oficial. Cárgala en Ajustes antes de confiar en este resultado.</Aviso>}
        <dl className="tabla">
          <dt>Impuesto según escala</dt><dd><Dinero c={impuesto} /></dd>
          <dt>Menos pagos a cuenta del 5% ya hechos</dt><dd><Dinero c={a.pagadoCuenta} /></dd>
          <dt>{fin.aFavor > 0 ? 'Saldo a tu favor' : 'Por pagar'}</dt><dd><Dinero c={fin.aFavor > 0 ? fin.aFavor : fin.aPagar} /></dd>
        </dl>
        <p className="nota">El 10% de ventas y servicios es un impuesto distinto y no se resta aquí.</p>
      </div>)}

      {paso === 4 && (<div id="resumen-dj08">
        <div className="form noprint">
          <label className="campo"><span>Fecha en que pagarás</span><input type="date" value={fechaPago} onChange={e => setFechaPago(e.target.value)} /></label>
          <label className="campo"><span>Canal</span>
            <select value={canal} onChange={e => setCanal(e.target.value as 'DIGITAL' | 'VENTANILLA')}>
              <option value="DIGITAL">Digital (Transfermóvil / EnZona)</option><option value="VENTANILLA">Ventanilla</option>
            </select>
          </label>
        </div>
        <dl className="tabla">
          <dt>Ingresos brutos</dt><dd><Dinero c={a.ingresosBrutos} /></dd>
          <dt>Mínimo exento</dt><dd><Dinero c={cfg.minimoExentoAnual} /></dd>
          <dt>Gastos deducibles (incl. comisiones)</dt><dd><Dinero c={a.gastosDeducibles} /></dd>
          <dt>Base imponible</dt><dd><Dinero c={base} /></dd>
          <dt>Impuesto anual</dt><dd><Dinero c={impuesto} /></dd>
          <dt>Pagos a cuenta (5%)</dt><dd><Dinero c={a.pagadoCuenta} /></dd>
          <dt>Importe a pagar</dt><dd><Dinero c={fin.aPagar} /></dd>
          <dt>Bonificación pronto pago</dt><dd><Dinero c={fin.bonifPronto} /></dd>
          <dt>Bonificación canal digital</dt><dd><Dinero c={fin.bonifDigital} /></dd>
          <dt><strong>Total a pagar</strong></dt><dd><strong><Dinero c={fin.totalAPagar} /></strong></dd>
        </dl>
        {fin.fueraDePlazo && <Aviso tipo="alerta">Esa fecha es posterior al {cfg.fechaLimiteDJ08}: puede haber recargos por mora.</Aviso>}
        <p className="nota">Copia estas cifras en el modelo DJ-08 oficial del Portal Tributario de la ONAT (onat.gob.cu): esta app no sustituye el formulario.</p>
        <button className="primario noprint" onClick={() => window.print()}>Imprimir o guardar como PDF</button>
      </div>)}

      <div className="nav-pasos noprint">
        <button disabled={paso === 0} onClick={() => setPaso(paso - 1)}>Anterior</button>
        <button disabled={paso === PASOS.length - 1} onClick={() => setPaso(paso + 1)}>Siguiente</button>
      </div>
    </section>
  );
}
