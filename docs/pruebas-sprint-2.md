# Resultados de pruebas — Sprint 2

## 1. Pruebas automatizadas de API

La colección de Postman se ejecuta mediante Newman usando el comando `npm run test:api`. El proceso genera un reporte JSON en `reports/newman-results.json` y devuelve un código de salida que permite detectar fallos.

## 2. Prueba de carga con Apache JMeter

- **Herramienta:** Apache JMeter 5.6.3.
- **Escenario:** 20 usuarios virtuales durante 30 segundos.
- **Endpoint:** `GET /api/barbers`.
- **Entorno:** API ejecutada localmente en el puerto 3000.

### Resultados obtenidos

| Métrica                      |                Resultado |
| ---------------------------- | -----------------------: |
| Solicitudes realizadas       |                    2.865 |
| Duración aproximada          |              31 segundos |
| Tiempo promedio de respuesta |                   193 ms |
| Tiempo mínimo                |                    85 ms |
| Tiempo máximo                |                 1.840 ms |
| Rendimiento promedio         | 93,2 solicitudes/segundo |
| Solicitudes fallidas         |                        0 |
| Porcentaje de errores        |                      0 % |

### Análisis

Durante el escenario ejecutado, todas las solicitudes finalizaron sin errores reportados por JMeter. El tiempo promedio fue de 193 ms y el rendimiento observado fue de 93,2 solicitudes por segundo.

El tiempo máximo de 1.840 ms evidencia que hubo respuestas más lentas que el promedio. Los resultados corresponden únicamente al endpoint probado y al entorno local; no representan una garantía de rendimiento en producción.

### Evidencias

- Plan de prueba: `tests/jmeter/barberbook-load-test.jmx`
- Resultados individuales: `reports/jmeter-results.jtl`
- Informe HTML: `reports/jmeter-html/`

## 3. Integración continua

El workflow de GitHub Actions está configurado para instalar las dependencias, ejecutar Jest y ejecutar Newman ante los eventos definidos en su archivo YAML. Su funcionamiento debe confirmarse con una ejecución satisfactoria en GitHub Actions.

## 4. Estado de validación

Los resultados documentados corresponden a la ejecución local observada. La validación final del Sprint 2 incluirá la revisión del workflow, los reportes generados y las evidencias restantes.

## Pruebas unitarias y de integración

### 1. Objetivo

Verificar el funcionamiento de los modelos, los servicios y los endpoints de BarberBook API mediante pruebas automatizadas con Jest y Supertest.

### 2. Herramientas utilizadas

- **Jest:** ejecución y evaluación de pruebas automatizadas.
- **Supertest:** envío de solicitudes HTTP a la aplicación para comprobar las respuestas de los endpoints.
- **Mongoose:** validación de modelos mediante `validateSync()`.
- **Mocks de Jest:** simulación de modelos para probar el comportamiento de las rutas y los servicios sin depender de una base de datos real en esas pruebas.

### 3. Resultado general de ejecución

La ejecución completa de Jest produjo los siguientes resultados:

| Indicador           |      Resultado |
| ------------------- | -------------: |
| Suites ejecutadas   |             14 |
| Suites aprobadas    |             14 |
| Suites fallidas     |              0 |
| Pruebas aprobadas   |            124 |
| Pruebas fallidas    |              0 |
| Tiempo de ejecución | 35,95 segundos |

**Estado:** todas las suites y pruebas reportadas por Jest finalizaron correctamente.

### 4. Pruebas unitarias

Se identificaron cuatro suites orientadas a validar modelos y servicios de manera aislada.

| Archivo                                      | Cantidad de casos | Alcance                                                                                            |
| -------------------------------------------- | ----------------: | -------------------------------------------------------------------------------------------------- |
| `tests/barber.model.test.js`                 |                 8 | Validación de campos obligatorios, valores predeterminados y restricciones del modelo de barbero.  |
| `tests/service.model.test.js`                |                 7 | Validación del nombre, precio, duración y otras reglas del modelo de servicio.                     |
| `tests/booking-availability.service.test.js` |                 3 | Disponibilidad de reservas, conflictos de horario y exclusión de la propia reserva.                |
| `tests/booking-status.service.test.js`       |                15 | Transiciones válidas e inválidas entre estados de una reserva y definición de estados principales. |
| **Total identificado**                       |            **33** |                                                                                                    |

Estas suites contienen más de las 10 pruebas unitarias solicitadas. La suite de disponibilidad se ejecutó individualmente y registró 3 pruebas aprobadas y 0 fallidas. Las cuatro suites también están incluidas en la ejecución global de Jest que registró 124 pruebas aprobadas.

### 5. Pruebas de integración de componentes

Se dispone de las siguientes suites que comprueban endpoints HTTP y comportamientos de autenticación, autorización, validación y gestión de recursos.

- `tests/auth.test.js`
- `tests/barber-account.routes.test.js`
- `tests/barber.routes.test.js`
- `tests/booking.routes.test.js`
- `tests/booking-cancel.routes.test.js`
- `tests/booking-confirm.routes.test.js`
- `tests/booking-detail.routes.test.js`
- `tests/booking-list.routes.test.js`
- `tests/booking-reject.routes.test.js`
- `tests/service.routes.test.js`

Las pruebas de rutas utilizan Supertest y, en las suites revisadas, modelos simulados mediante `jest.mock()`. Por ello, se clasifican como pruebas de integración de componentes con dependencias simuladas: permiten comprobar la interacción entre los endpoints, la autenticación, la autorización y la lógica asociada.

No deben presentarse como pruebas de integración contra MongoDB real, puesto que las suites revisadas no acreditan esa conexión.

El conjunto de rutas contiene numerosos casos de prueba y forma parte de las 124 pruebas aprobadas en la ejecución global. La clasificación individual y el recuento exacto de casos de integración deben conservarse diferenciados de los resultados globales de Jest.

### 6. Comandos de ejecución

Ejecutar todas las pruebas:

```powershell
npm test
```

Ejecutar únicamente las pruebas del modelo de barbero:

```powershell
npm test -- --runTestsByPath tests/barber.model.test.js
```

Ejecutar únicamente las pruebas de disponibilidad de reservas:

```powershell
npm test -- --runTestsByPath tests/booking-availability.service.test.js
```

Ejecutar las pruebas de confirmación y cancelación de reservas:

```powershell
npm test -- --runTestsByPath tests/booking-confirm.routes.test.js tests/booking-cancel.routes.test.js
```

### 7. Conclusión

La ejecución automatizada reportó 14 suites aprobadas, 124 pruebas aprobadas y ninguna prueba fallida. El proyecto cuenta con suites para validar modelos, servicios y endpoints HTTP, incluyendo escenarios positivos, errores de validación, autenticación y autorización.

La evidencia permite respaldar el cumplimiento del mínimo de 10 pruebas unitarias. Las pruebas de rutas aportan cobertura de integración entre componentes mediante dependencias simuladas; no obstante, no se debe afirmar que se realizaron pruebas de integración con una base de datos real sin contar con esa evidencia específica.
