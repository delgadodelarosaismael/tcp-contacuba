import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getConfig, hoyISO } from '../db/db';
import { diasHasta, proximosVencimientos } from '../core/calendario';

export function Calendario({ anio }: { anio: number }) {
  const cfg = useLiveQuery(() => getConfig(anio), [anio]);
  const [permiso, setPermiso] = useState<NotificationPermission | 'no'>('Notification' in window ? Notification.permission : 'no');
  const venc = cfg ? proximosVencimientos(hoyISO(), cfg) : [];

  useEffect(() => {
    if (permiso !== 'granted' || !venc.length) return;
    const v = venc[0];
    const d = diasHasta(hoyISO(), v.fecha);
    const clave = `aviso-${v.fecha}-${hoyISO()}`;
    if (d <= 5 && !localStorage.getItem(clave)) {
      localStorage.setItem(clave, '1');
      new Notification('TCP ContaCuba', { body: `${v.titulo}: ${v.fecha} (en ${d} días)` });
    }
  }, [permiso, venc.length]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section>
      <h2>Calendario fiscal</h2>
      {permiso === 'default' && (
        <button onClick={async () => setPermiso(await Notification.requestPermission())}>Activar avisos en este dispositivo</button>
      )}
      <ul className="lista">
        {venc.map(v => (
          <li key={v.fecha + v.titulo}>
            <div><strong>{v.titulo}</strong><small>{v.detalle}</small></div>
            <div className="der"><span className="num">{v.fecha}</span><small>en {diasHasta(hoyISO(), v.fecha)} días</small></div>
          </li>
        ))}
      </ul>
      <p className="nota">Confirma siempre la fecha límite de cada tributo en tu vector fiscal de la ONAT.</p>
    </section>
  );
}
