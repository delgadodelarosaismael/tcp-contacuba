import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Disclaimer } from './common';
import { Registro } from './Registro';
import { Inicio } from './Inicio';
import { Libro } from './Libro';
import { Banco } from './Banco';
import { Tributos } from './Tributos';
import { DJ08 } from './DJ08';
import { Calendario } from './Calendario';
import { Ajustes } from './Ajustes';

const TABS = ['Inicio', 'Libro', 'Banco', 'Tributos', 'DJ-08', 'Calendario', 'Ajustes'] as const;
type Tab = (typeof TABS)[number];

export function App() {
  const [tab, setTab] = useState<Tab>('Inicio');
  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [periodo, setPeriodo] = useState(hoy.toISOString().slice(0, 7));
  const estado = useLiveQuery(async () => ({ perfil: await db.perfil.get('main') }));
  if (!estado) return null;
  const perfil = estado.perfil;
  if (!perfil) return <Registro />;

  return (
    <div className="app">
      <header className="top noprint">
        <strong>TCP ContaCuba</strong>
        <label>Año fiscal <input type="number" value={anio} onChange={e => setAnio(Number(e.target.value))} /></label>
        <label>Mes <input type="month" value={periodo} onChange={e => { setPeriodo(e.target.value); setAnio(Number(e.target.value.slice(0, 4))); }} /></label>
      </header>
      <nav className="tabs noprint" aria-label="Secciones">
        {TABS.map(t => <button key={t} className={t === tab ? 'on' : ''} aria-current={t === tab} onClick={() => setTab(t)}>{t}</button>)}
      </nav>
      <main>
        {tab === 'Inicio' && <Inicio anio={anio} periodo={periodo} />}
        {tab === 'Libro' && <Libro anio={anio} perfil={perfil} />}
        {tab === 'Banco' && <Banco perfil={perfil} />}
        {tab === 'Tributos' && <Tributos anio={anio} periodo={periodo} />}
        {tab === 'DJ-08' && <DJ08 anio={anio} />}
        {tab === 'Calendario' && <Calendario anio={anio} />}
        {tab === 'Ajustes' && <Ajustes anio={anio} perfil={perfil} />}
      </main>
      <footer><Disclaimer /></footer>
    </div>
  );
}
