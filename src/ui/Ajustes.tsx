import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getConfig, type Perfil } from '../db/db';
import type { ConfigFiscal } from '../core/types';
import { Aviso, Campo } from './common';

export function Ajustes({ anio, perfil }: { anio: number; perfil: Perfil }) {
  const cfg = useLiveQuery(() => getConfig(anio), [anio]);
  const [escalaTxt, setEscalaTxt] = useState<string | null>(null);
  const [err, setErr] = useState('');
  if (!cfg) return null;
  const guardar = (c: ConfigFiscal) => db.config.put(c);
  const txt = escalaTxt ?? JSON.stringify(cfg.escala.map(t => ({ desdeCUP: t.desde / 100, hastaCUP: t.hasta == null ? null : t.hasta / 100, tasa: t.tasa })), null, 1);

  const aplicarEscala = () => {
    try {
      const arr = JSON.parse(txt) as { desdeCUP: number; hastaCUP: number | null; tasa: number }[];
      const escala = arr.map(t => ({ desde: Math.round(t.desdeCUP * 100), hasta: t.hastaCUP == null ? null : Math.round(t.hastaCUP * 100), tasa: t.tasa }));
      guardar({ ...cfg, escala, escalaVerificada: true }); setErr('');
    } catch { setErr('El formato no es válido. Usa una lista con desdeCUP, hastaCUP y tasa.'); }
  };

  return (
    <section>
      <h2>Ajustes fiscales de {anio}</h2>
      <Aviso tipo="info">Los parámetros cambian con las resoluciones de la ONAT. Ajústalos aquí sin esperar una actualización de la app.</Aviso>
      <div className="form">
        <Campo etiqueta="Cómo se calcula el 5% a cuenta">
          <select value={cfg.modoPagoCuenta} onChange={e => guardar({ ...cfg, modoPagoCuenta: e.target.value as ConfigFiscal['modoPagoCuenta'] })}>
            <option value="SOBRE_TOTAL">Sobre el total de ingresos del mes</option>
            <option value="SOBRE_EXCEDENTE">Solo sobre lo que excede el mínimo mensual</option>
          </select>
        </Campo>
        <Campo etiqueta="Mínimo de gastos con justificante (%)">
          <input type="number" min={0} max={100} value={Math.round(cfg.umbralJustificados * 100)} onChange={e => guardar({ ...cfg, umbralJustificados: Number(e.target.value) / 100 })} />
        </Campo>
        <Campo etiqueta="Tasa por fuerza de trabajo (%, vacío si no aplica)">
          <input type="number" min={0} step="0.1" value={cfg.tasaFuerzaTrabajo == null ? '' : cfg.tasaFuerzaTrabajo * 100}
            onChange={e => guardar({ ...cfg, tasaFuerzaTrabajo: e.target.value === '' ? null : Number(e.target.value) / 100 })} />
        </Campo>
        <Campo etiqueta="Escala progresiva (JSON)">
          <textarea rows={8} value={txt} onChange={e => setEscalaTxt(e.target.value)} />
        </Campo>
        {err && <p role="alert" className="error">{err}</p>}
        <button onClick={aplicarEscala}>Guardar escala</button>
        <p className="nota">{cfg.escalaVerificada ? 'Escala cargada por ti.' : 'Escala de ejemplo, no oficial.'}</p>
      </div>
      <h3>Perfil</h3>
      <dl className="tabla"><dt>Nombre</dt><dd>{perfil.nombre}</dd><dt>CI</dt><dd>{perfil.ci}</dd><dt>Régimen</dt><dd>{perfil.regimen === 'GENERAL' ? 'General' : 'Simplificado'}</dd></dl>
    </section>
  );
}
