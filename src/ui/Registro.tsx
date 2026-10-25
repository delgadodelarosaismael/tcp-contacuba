import { useState } from 'react';
import { db, type Perfil } from '../db/db';
import { Campo, Disclaimer, Aviso } from './common';

export function Registro() {
  const [p, setP] = useState<Omit<Perfil, 'id'>>({
    nombre: '', ci: '', nit: '', regimen: 'GENERAL', actividad: '', tieneEmpleados: false, tipoActor: 'TCP'
  });
  const ok = p.nombre.trim() && /^\d{11}$/.test(p.ci.trim());
  return (
    <main className="registro">
      <h1>TCP ContaCuba</h1>
      <p className="lead">Lleva tus ingresos, gastos y tributos sin conexión. Tus datos se guardan solo en este dispositivo.</p>
      <Campo etiqueta="Nombre completo"><input value={p.nombre} onChange={e => setP({ ...p, nombre: e.target.value })} autoComplete="name" /></Campo>
      <Campo etiqueta="Carné de identidad (11 dígitos)">
        <input inputMode="numeric" value={p.ci} onChange={e => setP({ ...p, ci: e.target.value })} />
      </Campo>
      <Campo etiqueta="NIT (opcional)"><input value={p.nit} onChange={e => setP({ ...p, nit: e.target.value })} /></Campo>
      <Campo etiqueta="Actividad autorizada"><input value={p.actividad} onChange={e => setP({ ...p, actividad: e.target.value })} placeholder="Ej.: elaborador-vendedor de alimentos" /></Campo>
      <Campo etiqueta="Régimen">
        <select value={p.regimen} onChange={e => setP({ ...p, regimen: e.target.value as Perfil['regimen'] })}>
          <option value="GENERAL">General</option>
          <option value="SIMPLIFICADO">Simplificado</option>
        </select>
      </Campo>
      {p.regimen === 'SIMPLIFICADO' && (
        <Aviso tipo="alerta">El cálculo del régimen simplificado todavía no está implementado: la app aplicará las reglas del régimen general.</Aviso>
      )}
      <label className="check"><input type="checkbox" checked={p.tieneEmpleados} onChange={e => setP({ ...p, tieneEmpleados: e.target.checked })} /> Contrato trabajadores</label>
      <button className="primario" disabled={!ok} onClick={() => db.perfil.put({ id: 'main', ...p })}>Empezar</button>
      <Disclaimer />
    </main>
  );
}
