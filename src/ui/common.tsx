import type { ReactNode } from 'react';
import { formatoCUP } from '../core/dinero';

export const Dinero = ({ c, className }: { c: number; className?: string }) => (
  <span className={`num ${className ?? ''}`}>{formatoCUP(c)}</span>
);

export const Disclaimer = () => (
  <p className="disclaimer" role="note">
    Los cálculos son orientativos. La responsabilidad final es del contribuyente: valídalos con la ONAT o con un contador.
  </p>
);

export const Aviso = ({ tipo, children }: { tipo: 'info' | 'alerta'; children: ReactNode }) => (
  <div className={`aviso ${tipo}`} role={tipo === 'alerta' ? 'alert' : 'note'}>{children}</div>
);

export const Campo = ({ etiqueta, children }: { etiqueta: string; children: ReactNode }) => (
  <label className="campo"><span>{etiqueta}</span>{children}</label>
);

export const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export const nombrePeriodo = (p: string) => `${MESES[Number(p.slice(5, 7)) - 1]} ${p.slice(0, 4)}`;

export const CATEGORIAS_INGRESO = ['Ventas', 'Servicios', 'Otros ingresos'];
export const CATEGORIAS_GASTO = ['Materias primas', 'Alquiler', 'Transporte', 'Electricidad y agua', 'Salarios', 'Mantenimiento', 'Publicidad', 'Otros gastos'];
