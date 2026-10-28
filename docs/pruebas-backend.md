# Tarea 1 — Verificación de pruebas backend

## Objetivo

Verificar la organización de las pruebas unitarias y de rutas, los datos de prueba y la evidencia disponible sobre las estrategias Top-down y Bottom-up, conservando las pruebas existentes.

## 1. Organización de las pruebas

Se identificaron 14 archivos de pruebas Jest en el directorio `tests/`:

- Autenticación: `auth.test.js`.
- Cuenta y rutas de barberos: `barber-account.routes.test.js`, `barber.routes.test.js`.
- Modelo de barbero: `barber.model.test.js`.
- Disponibilidad y estados de reservas: `booking-availability.service.test.js`, `booking-status.service.test.js`.
- Operaciones de reservas: `booking-cancel.routes.test.js`, `booking-confirm.routes.test.js`, `booking-detail.routes.test.js`, `booking-list.routes.test.js`, `booking-reject.routes.test.js`, `booking.routes.test.js`.
- Modelo y rutas de servicios: `service.model.test.js`, `service.routes.test.js`.

Las pruebas existentes se conservaron.

## 2. Tipos de pruebas identificados

### Pruebas unitarias

Los archivos de modelos y servicios contienen casos que verifican reglas y comportamientos de componentes específicos. Entre los ejemplos identificados están la validación del modelo `Barber`, la validación del modelo `Service`, la disponibilidad de reservas y las transiciones de estado.

### Pruebas de rutas

Los archivos de autenticación, barberos, reservas y servicios contienen pruebas de endpoints HTTP. Los títulos revisados incluyen respuestas exitosas, solicitudes sin token, roles no autorizados e identificadores inválidos.

En varios archivos se identificaron mocks de dependencias. Por ello, estas pruebas no deben describirse automáticamente como pruebas contra una base de datos real.

## 3. Datos y aislamiento

La revisión detectó el uso de mocks en varios archivos. Los datos de prueba y las dependencias simuladas deben interpretarse según cada archivo de pruebas. No se ha confirmado que toda la suite utilice una base de datos de prueba real ni que todos los casos compartan la misma estrategia de preparación de datos.

## 4. Estrategias Top-down y Bottom-up

La estructura actual permite identificar pruebas de endpoints y pruebas de componentes específicos:

- **Cobertura compatible con Top-down:** las pruebas de rutas ejercitan endpoints HTTP y, en varios casos, simulan sus dependencias.
- **Cobertura compatible con Bottom-up:** las pruebas de modelos y servicios verifican componentes específicos de manera aislada.

Esta clasificación describe el enfoque observable en los archivos revisados. No se encontró evidencia suficiente para afirmar que exista una batería formal, etiquetada y documentada de integración Top-down y Bottom-up. Para confirmar su cumplimiento completo, se deben vincular casos concretos con los componentes integrados y sus dependencias.

## 5. Resultado de Jest

En el historial de trabajo se registró una ejecución con 14 suites y 124 pruebas aprobadas. Este dato corresponde a un resultado histórico; no representa una nueva ejecución realizada durante la elaboración de este documento.

## 6. Conclusión

La suite existente cubre autenticación, autorización, modelos, servicios y rutas de la API. Se conservaron los archivos de pruebas y se documentaron la estructura y las limitaciones identificadas.

La evidencia disponible no permite afirmar todavía que las estrategias Top-down y Bottom-up estén formalmente verificadas en su totalidad. Esa comprobación debe resolverse antes de declarar cerrada la tarea si el criterio exige escenarios de integración explícitos.
