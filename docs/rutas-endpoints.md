# Documentación de rutas y endpoints — BarberBook API

## Descripción

BarberBook API es una API REST desarrollada con Node.js y Express. Organiza sus funcionalidades en módulos de autenticación, usuarios, barberos, servicios y reservas.

## Autenticación y usuarios

| Método | Endpoint                 | Descripción                                 | Acceso      |
| ------ | ------------------------ | ------------------------------------------- | ----------- |
| POST   | `/api/auth/register`     | Registrar un usuario                        | Público     |
| POST   | `/api/auth/login`        | Iniciar sesión                              | Público     |
| GET    | `/api/users/me`          | Consultar el perfil del usuario autenticado | JWT         |
| GET    | `/api/users/admin-check` | Comprobar autorización administrativa       | JWT + ADMIN |

## Barberos

| Método | Endpoint             | Descripción                                      | Acceso      |
| ------ | -------------------- | ------------------------------------------------ | ----------- |
| GET    | `/api/barbers`       | Consultar los barberos                           | Público     |
| GET    | `/api/barbers/:id`   | Consultar un barbero por identificador           | Público     |
| POST   | `/api/barbers/admin` | Crear una cuenta de barbero desde administración | JWT + ADMIN |

## Servicios

| Método | Endpoint                         | Descripción                                 | Acceso      |
| ------ | -------------------------------- | ------------------------------------------- | ----------- |
| GET    | `/api/services`                  | Consultar los servicios                     | Público     |
| GET    | `/api/services/:id`              | Consultar un servicio por identificador     | Público     |
| POST   | `/api/services`                  | Crear un servicio                           | JWT + ADMIN |
| PATCH  | `/api/services/:id/availability` | Actualizar la disponibilidad de un servicio | JWT + ADMIN |

## Reservas

| Método | Endpoint                    | Descripción                             | Acceso              |
| ------ | --------------------------- | --------------------------------------- | ------------------- |
| POST   | `/api/bookings`             | Crear una reserva                       | JWT + USER          |
| GET    | `/api/bookings`             | Listar las reservas del usuario         | JWT + USER          |
| GET    | `/api/bookings/:id`         | Consultar una reserva por identificador | JWT + USER o BARBER |
| PATCH  | `/api/bookings/:id/confirm` | Confirmar una reserva                   | JWT + BARBER        |
| PATCH  | `/api/bookings/:id/reject`  | Rechazar una reserva                    | JWT + BARBER        |
| PATCH  | `/api/bookings/:id/cancel`  | Cancelar una reserva                    | JWT + USER          |

## Rutas generales y de diagnóstico

| Método | Endpoint      | Descripción                     | Acceso                   |
| ------ | ------------- | ------------------------------- | ------------------------ |
| GET    | `/`           | Verificar que la API responde   | Público                  |
| GET    | `/test-error` | Probar el middleware de errores | Solo fuera de producción |

## Autorización

Los endpoints protegidos requieren un token JWT en la cabecera HTTP:

`Authorization: Bearer <token>`

Además del token, algunos endpoints requieren un rol específico. El middleware de autenticación valida el acceso y el middleware de roles comprueba los permisos correspondientes.

## Observaciones

- Los identificadores dinámicos se representan con `:id`.
- Los códigos HTTP y los formatos exactos de las respuestas deben verificarse en las pruebas de la API.
- La ruta `/test-error` es de diagnóstico y no debe estar habilitada en producción.
