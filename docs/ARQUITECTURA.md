# Arquitectura

## Estado actual (v0.1)
- PWA React + TypeScript + Vite, instalable y funcional sin conexión (service worker con precache).
- Datos locales en IndexedDB vía Dexie. No hay servidor: los datos no salen del dispositivo.
- `src/core` es lógica pura y determinista; la UI solo la invoca.

## Modelo de datos local
`perfil`, `config` (por año fiscal), `transacciones` (ingreso/gasto, anulación lógica), `comisiones` (costo financiero ligado a la transacción), `pagos` (por periodo y tributo), `justificantes` (blobs de fotos).

## Decisiones
- **Centavos enteros** para dinero.
- **Libro de solo agregar**: una corrección anula el asiento, no lo borra.
- **Configuración fiscal como datos**, no como constantes, porque la normativa cambia.

## Siguientes pasos
1. **Sincronización**: cola de cambios (outbox) con UUID por registro → API Fastify + PostgreSQL; respaldo y multidispositivo. Adjuntos a almacenamiento S3-compatible.
2. **PDF oficial**: mapear casillas del modelo DJ-08 vigente (descargado de onat.gob.cu) y generar con pdf-lib.
3. **Régimen simplificado** y contribución a la seguridad social.
4. **Móvil nativo**: Capacitor sobre esta misma base.
5. **Seguridad**: cifrado local opcional (WebCrypto) y exportación/importación de respaldo.
