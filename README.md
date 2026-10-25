# TCP ContaCuba

Aplicación web/móvil (PWA, **offline-first**) para que los Trabajadores por Cuenta Propia (TCP) en Cuba lleven su contabilidad, calculen sus tributos mensuales, concilien operaciones bancarias y preparen los datos de la Declaración Jurada **DJ-08**.

> **Aviso:** los cálculos son orientativos. La responsabilidad final es del contribuyente; valídalos con la ONAT o un contador. Este proyecto no es oficial ni está afiliado a la ONAT.

## Qué hace

| Módulo | Función |
|---|---|
| Registro | CI/NIT, actividad y régimen (General o Simplificado) |
| Libro | Ingresos y gastos por categoría, foto de factura, % de gastos justificados, exportación CSV |
| Banco | Comisión automática por canal y neto disponible; extracciones de efectivo |
| Tributos | 10% ventas/servicios y 5% a cuenta del mes, registro de pagos parciales |
| DJ-08 | Asistente de 5 pasos con resumen imprimible / PDF |
| Calendario | Vencimientos mensuales, 28-feb (bonificación) y 30-abr (DJ-08), avisos locales |
| Ajustes | Parámetros fiscales editables sin actualizar la app |

## Reglas de negocio que el código respeta

- El **10% de ventas/servicios** y el **5% a cuenta** son **tributos** sobre el **ingreso bruto** mensual.
- Las **comisiones bancarias** (0,2% extracción, 0,8% cobro digital y transferencia recibida) son **costos financieros deducibles**, **no tributos**.
- El ingreso se guarda por su **monto íntegro**; la comisión va aparte y el neto = bruto − comisión.
- En la DJ-08: base = ingresos − mínimo exento − gastos (incluye comisiones). Los pagos a cuenta del 5% se restan **del impuesto**, no de la base. El 10% es otro impuesto y no se acredita.
- Todo el dinero se maneja en **centavos enteros**.

## Parámetros que debes verificar

Marcados `VERIFICAR` en [`src/core/config.ts`](src/core/config.ts) y editables en la pestaña Ajustes:

1. Base del 5% mensual (total del mes o solo el excedente de 3.260 CUP).
2. Porcentaje mínimo de gastos justificados (80% u otro).
3. **Escala progresiva de la DJ-08: la incluida es un ejemplo no oficial.** La app lo advierte hasta que cargues la escala vigente.
4. Tasa por utilización de fuerza de trabajo y contribución a la seguridad social (sin valor por defecto).
5. Régimen simplificado: aún no implementado (se aplican las reglas del general).

## Desarrollo

```bash
npm install
npm run dev        # servidor local
npm test           # pruebas del núcleo fiscal y de la base local
npm run build      # build de producción (PWA)
```

## Estructura

```
src/core/   lógica fiscal pura (sin React ni base de datos), 100% probada
src/db/     IndexedDB (Dexie): perfil, transacciones, comisiones, pagos, justificantes
src/ui/     pantallas React
docs/       arquitectura y hoja de ruta
```

## Publicar en GitHub Pages

En el repositorio: **Settings → Pages → Source: GitHub Actions**. El workflow `pages.yml` publica en cada push a `main`.

## Hoja de ruta

Ver [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md): sincronización con backend (Fastify + PostgreSQL), exportación PDF con casillas exactas del modelo vigente, régimen simplificado, empaquetado móvil con Capacitor.

## Licencia

MIT
