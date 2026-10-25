import { useLiveQuery } from 'dexie-react-hooks';
import { db, getConfig, hoyISO } from '../db/db';
import { resumenAnual, resumenMes } from '../core/resumen';
import { diasHasta, proximosVencimientos } from '../core/calendario';
import { Aviso, Dinero, nombrePeriodo } from './common';

export function Inicio({ anio, periodo }: { anio: number; periodo: string }) {
  const datos = useLiveQuery(async () => {
    const [txs, coms, pagos, cfg] = await Promise.all([db.transacciones.toArray(), db.comisiones.toArray(), db.pagos.toArray(), getConfig(anio)]);
    return { txs, coms, pagos, cfg };
  }, [anio]);
  if (!datos) return null;
  const { txs, coms, pagos, cfg } = datos;
  const m = resumenMes(periodo, txs, coms, pagos, cfg);
  const a = resumenAnual(anio, txs, coms, pagos);
  const venc = proximosVencimientos(hoyISO(), cfg)[0];
  const pend = m.impuestoVentas - m.pagadoVentas + (m.pagoCuentaIngresos - m.pagadoCuenta);

  return (
    <section>
      <h2>Resumen de {nombrePeriodo(periodo)}</h2>
      <div className="flujo">
        <div className="bloque bruto">
          <h3>Ingreso bruto</h3>
          <Dinero c={m.ingresosBrutos} className="grande" />
          <p>Monto íntegro recibido. Es la base de tus tributos.</p>
        </div>
        <div className="bloque tributo">
          <h3>Tributos del mes</h3>
          <dl>
            <dt>10% ventas y servicios</dt><dd><Dinero c={m.impuestoVentas} /></dd>
            <dt>5% a cuenta de ingresos personales</dt><dd><Dinero c={m.pagoCuentaIngresos} /></dd>
          </dl>
          <p>{pend > 0 ? <>Te falta pagar <Dinero c={pend} />.</> : 'Al día en este mes.'}</p>
        </div>
        <div className="bloque costo">
          <h3>Costos financieros</h3>
          <Dinero c={m.comisiones} className="grande" />
          <p>Comisiones bancarias. No son tributos: se deducen en la DJ-08.</p>
        </div>
        <div className="bloque neto">
          <h3>Neto disponible</h3>
          <Dinero c={m.netoDisponible} className="grande" />
          <p>Ingreso bruto menos comisiones.</p>
        </div>
      </div>

      {a.pctJustificado < cfg.umbralJustificados && a.gastos > 0 && (
        <Aviso tipo="alerta">
          Solo el {Math.round(a.pctJustificado * 100)}% de tus gastos de {anio} tiene justificante; el mínimo configurado es {Math.round(cfg.umbralJustificados * 100)}%. Adjunta las facturas que falten en el Libro.
        </Aviso>
      )}
      {venc && (
        <Aviso tipo="info">
          Próximo vencimiento: <strong>{venc.titulo}</strong>, {venc.fecha} (en {diasHasta(hoyISO(), venc.fecha)} días).
        </Aviso>
      )}
      <h2>Acumulado de {anio}</h2>
      <dl className="tabla">
        <dt>Ingresos brutos</dt><dd><Dinero c={a.ingresosBrutos} /></dd>
        <dt>Gastos</dt><dd><Dinero c={a.gastos} /></dd>
        <dt>Comisiones bancarias</dt><dd><Dinero c={a.comisiones} /></dd>
        <dt>Pagado a cuenta (5%)</dt><dd><Dinero c={a.pagadoCuenta} /></dd>
        <dt>Pagado ventas/servicios (10%)</dt><dd><Dinero c={a.pagadoVentas} /></dd>
      </dl>
    </section>
  );
}
