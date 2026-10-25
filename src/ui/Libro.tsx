import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { anularTransaccion, db, hoyISO, registrarGasto, registrarIngreso, type Perfil } from '../db/db';
import { aCentavos } from '../core/dinero';
import { libroCSV } from '../core/exportar';
import { Aviso, Campo, CATEGORIAS_GASTO, CATEGORIAS_INGRESO, Dinero } from './common';
import type { CanalIngreso } from '../core/types';

export function Libro({ anio, perfil }: { anio: number; perfil: Perfil }) {
  const [tipo, setTipo] = useState<'INGRESO' | 'GASTO'>('INGRESO');
  const [fecha, setFecha] = useState(hoyISO());
  const [monto, setMonto] = useState('');
  const [categoria, setCategoria] = useState('');
  const [canal, setCanal] = useState<CanalIngreso>('EFECTIVO');
  const [nota, setNota] = useState('');
  const [foto, setFoto] = useState<File | undefined>();
  const [msg, setMsg] = useState('');
  const txs = useLiveQuery(() => db.transacciones.orderBy('fecha').reverse().toArray(), []);
  const fotos = useLiveQuery(() => db.justificantes.toArray(), []);

  const guardar = async () => {
    const c = aCentavos(monto);
    if (c <= 0) { setMsg('Escribe un monto mayor que cero.'); return; }
    const cat = categoria || (tipo === 'INGRESO' ? CATEGORIAS_INGRESO[0] : CATEGORIAS_GASTO[0]);
    if (tipo === 'INGRESO') await registrarIngreso({ fecha, montoBrutoCent: c, categoria: cat, canal, nota }, perfil.tipoActor);
    else await registrarGasto({ fecha, montoBrutoCent: c, categoria: cat, nota, justificado: false }, foto);
    setMonto(''); setNota(''); setFoto(undefined); setMsg(tipo === 'INGRESO' ? 'Ingreso guardado.' : 'Gasto guardado.');
  };

  const descargar = async () => {
    const [t, c] = await Promise.all([db.transacciones.toArray(), db.comisiones.toArray()]);
    const url = URL.createObjectURL(new Blob([libroCSV(anio, t, c)], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = `libro-${anio}.csv`; a.click(); URL.revokeObjectURL(url);
  };
  const verFoto = (id: string) => {
    const f = fotos?.find(x => x.transaccionId === id);
    if (f) window.open(URL.createObjectURL(f.blob));
  };
  const adjuntar = async (id: string, f?: File) => {
    if (!f) return;
    await db.transaction('rw', db.transacciones, db.justificantes, async () => {
      await db.justificantes.add({ id: crypto.randomUUID(), transaccionId: id, nombre: f.name, blob: f });
      await db.transacciones.update(id, { justificado: true });
    });
  };

  return (
    <section>
      <h2>Libro de ingresos y gastos</h2>
      <div className="form">
        <div className="segmentos" role="group" aria-label="Tipo">
          <button className={tipo === 'INGRESO' ? 'on' : ''} onClick={() => setTipo('INGRESO')}>Ingreso</button>
          <button className={tipo === 'GASTO' ? 'on' : ''} onClick={() => setTipo('GASTO')}>Gasto</button>
        </div>
        <Campo etiqueta="Fecha"><input type="date" value={fecha} onChange={e => setFecha(e.target.value)} /></Campo>
        <Campo etiqueta={tipo === 'INGRESO' ? 'Monto recibido (íntegro, CUP)' : 'Monto del gasto (CUP)'}>
          <input inputMode="decimal" value={monto} onChange={e => setMonto(e.target.value)} placeholder="0,00" />
        </Campo>
        <Campo etiqueta="Categoría">
          <input list="cats" value={categoria} onChange={e => setCategoria(e.target.value)} placeholder={tipo === 'INGRESO' ? 'Ventas' : 'Materias primas'} />
          <datalist id="cats">{(tipo === 'INGRESO' ? CATEGORIAS_INGRESO : CATEGORIAS_GASTO).map(c => <option key={c} value={c} />)}</datalist>
        </Campo>
        {tipo === 'INGRESO' ? (
          <Campo etiqueta="¿Cómo entró el dinero?">
            <select value={canal} onChange={e => setCanal(e.target.value as CanalIngreso)}>
              <option value="EFECTIVO">Efectivo en mano</option>
              <option value="TRANSFERENCIA">Transferencia</option>
              <option value="PAGO_EN_LINEA">Pago en línea (Transfermóvil / EnZona)</option>
            </select>
          </Campo>
        ) : (
          <Campo etiqueta="Foto de la factura"><input type="file" accept="image/*" capture="environment" onChange={e => setFoto(e.target.files?.[0])} /></Campo>
        )}
        <Campo etiqueta="Nota (opcional)"><input value={nota} onChange={e => setNota(e.target.value)} /></Campo>
        {tipo === 'INGRESO' && canal !== 'EFECTIVO' && (
          <Aviso tipo="info">Se guarda el monto íntegro como ingreso. La comisión bancaria se registra aparte como costo financiero.</Aviso>
        )}
        <button className="primario" onClick={guardar}>Guardar {tipo === 'INGRESO' ? 'ingreso' : 'gasto'}</button>
        {msg && <p role="status">{msg}</p>}
      </div>

      <div className="fila-titulo"><h3>Movimientos</h3><button onClick={descargar}>Descargar Excel (CSV) de {anio}</button></div>
      {!txs?.length && <p className="vacio">Todavía no hay movimientos. Registra tu primera venta arriba.</p>}
      <ul className="lista">
        {txs?.filter(t => !t.anulada).map(t => (
          <li key={t.id}>
            <div>
              <strong>{t.categoria}</strong>
              <small>{t.fecha}{t.canal ? ` · ${t.canal.toLowerCase().replace('_', ' ')}` : ''}{t.nota ? ` · ${t.nota}` : ''}</small>
              {t.tipo === 'GASTO' && (t.justificado
                ? <button className="enlace" onClick={() => verFoto(t.id)}>Ver justificante</button>
                : <label className="enlace">Adjuntar justificante<input hidden type="file" accept="image/*" onChange={e => adjuntar(t.id, e.target.files?.[0])} /></label>)}
            </div>
            <div className="der">
              <Dinero c={t.montoBrutoCent} className={t.tipo === 'INGRESO' ? 'ing' : 'gas'} />
              <button className="enlace" onClick={() => anularTransaccion(t.id)}>Anular</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
