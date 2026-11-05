# Ticket/TEC — API de eventos

Backend de una plataforma de eventos desarrollado para la entrega final de Coderhouse. Permite registrar usuarios, autenticar sesiones, administrar eventos por organizador y reservar entradas por sector mediante un flujo de reserva y confirmación en dos pasos.

La API REST implementa autenticación, permisos por rol, control de propiedad y operaciones transaccionales para gestionar cupos. Confirmar un ticket representa una **venta lógica, sin procesar pagos reales**.

## Tecnologías

- Node.js con módulos ES y Express 5.
- MongoDB y Mongoose 9: esquemas, índices y transacciones.
- Passport Local/JWT, jsonwebtoken, cookie-parser y bcrypt.
- Nodemailer con SMTP de Ethereal Email para pruebas.
- dotenv, Node.js Test Runner y `node:assert/strict`.

Handlebars, node-cron y Google OAuth están declarados como dependencias, pero no se utilizan en los flujos actuales. La expiración se ejecuta con `setInterval`.

## Arquitectura y carpetas

```text
Routes → Controllers → Services → Repositories → DAO → Models → MongoDB
```

Las rutas definen acceso; los controladores adaptan HTTP; los servicios aplican reglas de negocio; los repositorios delegan persistencia a los DAO; los modelos definen esquemas y los DTO seleccionan datos de salida.

```text
index.js                   MongoDB, HTTP e inicio del job
src/
  app.js                   Express, Passport y montaje de routers
  config/                  Passport y transporte SMTP
  routes/                  Sesiones, usuarios, categorías, eventos y tickets
  controllers/             Adaptación HTTP
  services/                Negocio y correo
  repositories/            Interfaz de persistencia
  DAO-managers/
    users.mongo.dao.js     Persistencia de usuarios
    mongo/                 Persistencia de categorías, eventos y tickets
  models/                  Esquemas Mongoose
  DTO/                     Usuario actual, evento y ticket
  middlewares/             Roles, propiedad, registro, log y errores
  jobs/                    Expiración de reservas
  utils/                   JWT y contraseñas
tests/
  events.service.test.js   Pruebas existentes del servicio de eventos
```

## Requisitos e instalación

- Node.js 20.19 o superior, compatible con Mongoose 9 y `node --watch`; npm.
- MongoDB compatible con transacciones: replica set inicializado o clúster compatible, como Atlas. Una instancia standalone no alcanza para los flujos transaccionales de tickets.
- Permisos para operar sobre una base exclusiva del proyecto y crear los índices declarados.
- Cuenta SMTP de Ethereal para revisar correos y un cliente HTTP con cookies, como Postman.

1. Clonar el repositorio y entrar en su carpeta.
2. Instalar dependencias del lockfile:

   ```bash
   npm ci
   ```

3. Copiar `.env.example` a `.env`, sin sobrescribir una configuración existente. En PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

   En POSIX: `cp .env.example .env`.

4. Completar localmente MongoDB, el secreto JWT y las credenciales SMTP de prueba.
5. Con MongoDB disponible, ejecutar `npm start` y consumir `http://localhost:3000/api/events`.

El servidor espera la conexión a MongoDB antes de escuchar solicitudes. La URI de ejemplo usa una base `tickettec_test` y supone un replica set `rs0` ya inicializado: el parámetro de conexión no lo crea. Ajustarla a la infraestructura disponible. Verificar la creación del índice único parcial de tickets antes de probar concurrencia.

## Variables de entorno

`index.js` carga `.env` mediante dotenv. Todos los valores publicados en `.env.example` son ficticios.

| Variable leída | Uso | Configuración |
| --- | --- | --- |
| `PORT` | Puerto HTTP | Opcional; predeterminado `3000` |
| `MONGODB_URI` | URI completa de MongoDB | Necesaria; incluir base y opciones de conexión |
| `JWT_SECRET` | Firma/verificación del token | Necesaria; generar un secreto aleatorio propio fuera del repositorio |
| `NODE_ENV` | Cookie segura en producción | `production` activa `Secure` y requiere HTTPS; `development` para HTTP local |
| `MAIL_USER` | Usuario SMTP Ethereal | Necesario para enviar correos |
| `MAIL_PASS` | Contraseña SMTP Ethereal | Solo en la configuración local |
| `MAIL_FROM` | Remitente | Identidad de pruebas, por ejemplo `Ticket/TEC <no-reply@example.invalid>` |

La conexión utiliza **`MONGODB_URI`**, no `MONGO_URL`; las credenciales se incluyen en la URI cuando corresponda.

`JWT_EXPIRES_IN`, `MAIL_HOST` y `MAIL_PORT` están documentadas como referencias comentadas: **no son configurables por entorno actualmente**. El código fija JWT en `1h`, SMTP en `smtp.ethereal.email:587` y `secure: false`. Definir esas variables no modifica esos valores. La cookie dura una hora y la reserva quince minutos, también fijados en código.

## Comandos disponibles

| Comando | Script real | Función |
| --- | --- | --- |
| `npm start` | `node --watch index.js` | Inicia el servidor y reinicia ante cambios |
| `npm test` | `node --test` | Ejecuta los tests descubiertos por Node.js |

## Sesiones y roles

El registro normaliza el email, valida nombre/apellido y contraseña de al menos seis caracteres, aplica bcrypt y asigna siempre `user`. Enviar `role` en el registro no eleva permisos.

Passport Local autentica el login. La respuesta coloca el JWT en la cookie `currentUser`, con `httpOnly`, `SameSite=Lax`, una hora de duración y `Secure` en producción. No devuelve el token en el cuerpo. La estrategia `current` lee la cookie y recupera al usuario de MongoDB; un header Bearer no reemplaza esa cookie. Logout la elimina, sin revocar un JWT ya copiado.

| Actor | Permisos |
| --- | --- |
| Público | Registro, login, logout y consulta de eventos publicados |
| `user` | Current y gestión de sus propios tickets/reservas |
| `organizer` | Lo anterior; crear eventos y administrar/consultar tickets de sus eventos |
| `admin` | Categorías y usuarios; administrar cualquier evento y consultar sus tickets |

Las rutas de tickets aceptan todos los roles autenticados, pero las operaciones individuales se limitan al comprador propietario, incluso para admin. La consulta administrativa por evento utiliza `/api/events/:eventId/tickets`.

## Endpoints existentes

Base: `http://localhost:3000`. Los cuerpos son JSON. Los parámetros `eventId`, `ticketId` y `userId` son ObjectId. Las respuestas y fechas de ejemplo son ilustrativas; sustituir IDs por los obtenidos en el entorno local y usar fechas futuras.

| Método | Ruta | Permiso | Entrada → respuesta exitosa |
| --- | --- | --- | --- |
| POST | `/api/sessions/register` | Público | Registro → 201, mensaje y usuario sin contraseña |
| POST | `/api/sessions/login` | Público | Email/contraseña → 200, mensaje y cookie |
| POST | `/api/sessions/logout` | Público | Sin cuerpo → 200, mensaje y eliminación de cookie |
| GET | `/api/sessions/current` | Autenticado | Sin cuerpo → 200, `status` y DTO usuario |
| GET | `/api/sessions/users` | Admin | Sin cuerpo → 200, `status` y array de usuarios; alias de `/api/users` |
| GET | `/api/users` | Admin | Sin cuerpo → 200, `status` y array de usuarios |
| GET | `/api/users/:userId` | Admin | Sin cuerpo → 200, `status` y usuario |
| PATCH | `/api/users/:userId/role` | Admin | `{"role":"organizer"}` → 200, mensaje y usuario actualizado |
| DELETE | `/api/users/:userId` | Admin | Sin cuerpo → 200, mensaje de eliminación |
| POST | `/api/categories` | Admin | `{"name":"Música"}` → 201, `status` y categoría |
| GET | `/api/events` | Público | Query de filtros → 200, `status`, `data` y paginación |
| GET | `/api/events/:eventId` | Público | Sin cuerpo → 200, `status` y evento publicado |
| GET | `/api/events/:eventId/tickets` | Organizer propietario o admin | Sin cuerpo → 200, `status` y array de tickets |
| POST | `/api/events` | Organizer o admin | Evento → 201, `status` y evento en `draft` |
| PUT | `/api/events/:eventId` | Organizer propietario o admin | Campos editables → 200, `status` y evento |
| PATCH | `/api/events/:eventId/status` | Organizer propietario o admin | `{"status":"published"}` → 200, `status` y evento |
| DELETE | `/api/events/:eventId` | Organizer propietario o admin | Solo borrador; sin cuerpo → 200, mensaje |
| POST | `/api/tickets/reserve` | Autenticado | Evento/sector/cantidad → 201, `success` y ticket `reserved` |
| GET | `/api/tickets/my-tickets` | Autenticado | Sin cuerpo → 200, `success` y sus tickets |
| GET | `/api/tickets/:ticketId` | Comprador propietario | Sin cuerpo → 200, `success` y ticket |
| PATCH | `/api/tickets/:ticketId/confirm` | Comprador propietario | Sin cuerpo → 200, `success` y ticket `sold` |
| PATCH | `/api/tickets/:ticketId/cancel` | Comprador propietario | Sin cuerpo → 200, `success` y ticket `cancelled` |

### Ejemplos de sesiones, usuarios y categorías

Registro: `POST /api/sessions/register`:

```json
{"first_name":"Ana","last_name":"Prueba","email":"ana@example.invalid","password":"SoloPruebas123!"}
```

Respuesta 201 ilustrativa:

```json
{"message":"Usuario registrado exitosamente","payload":{"id":"507f1f77bcf86cd799439011","first_name":"Ana","last_name":"Prueba","email":"ana@example.invalid","role":"user"}}
```

Login: `POST /api/sessions/login` con `{"email":"ana@example.invalid","password":"SoloPruebas123!"}`. Responde 200 con mensaje de inicio exitoso y `Set-Cookie`. La contraseña de ejemplo es ficticia y exclusivamente de prueba.

Current y consulta individual de usuario usan:

```json
{"status":"success","payload":{"id":"507f1f77bcf86cd799439011","first_name":"Ana","last_name":"Prueba","email":"ana@example.invalid","role":"user"}}
```

Los dos listados de usuarios colocan estos DTO en un array `payload`. El cambio de rol agrega `message` y devuelve el DTO actualizado. El admin no puede quitarse su propio rol ni eliminar su cuenta. Logout devuelve un mensaje de cierre de sesión; DELETE usuario devuelve `{"status":"success","message":"Usuario eliminado correctamente"}`.

Crear categoría con `POST /api/categories` y `{"name":"Música"}`. Respuesta ilustrativa:

```json
{"status":"success","payload":{"name":"Música","_id":"507f1f77bcf86cd799439012","__v":0}}
```

Guardar su `_id`: no hay endpoint de listado de categorías.

### Creación y administración de eventos

`POST /api/events` con cookie de organizer o admin:

```json
{
  "title":"Festival de prueba",
  "description":"Evento ficticio para pruebas",
  "category":"507f1f77bcf86cd799439012",
  "date":"2030-12-15T21:00:00.000Z",
  "location":{"venue":"Sala de prueba","address":"Calle Ficticia 123","city":"Buenos Aires"},
  "sectors":[{"name":"General","capacity":100,"price":15000}],
  "artists":[{"name":"Artista de prueba","role":"headliner"}],
  "genre":"Rock",
  "ageRestriction":18,
  "image":null
}
```

La categoría debe existir y la fecha debe ser futura. El organizador se toma del usuario autenticado, el estado inicial es `draft` y `available` se calcula desde `capacity`.

Respuesta 201 ilustrativa; GET individual, PUT y PATCH de estado usan la misma envoltura con 200:

```json
{
  "status":"success",
  "payload":{
    "id":"507f1f77bcf86cd799439013",
    "title":"Festival de prueba",
    "description":"Evento ficticio para pruebas",
    "category":"507f1f77bcf86cd799439012",
    "capacity":100,
    "price":15000,
    "date":"2030-12-15T21:00:00.000Z",
    "location":{"venue":"Sala de prueba","address":"Calle Ficticia 123","city":"Buenos Aires"},
    "sectors":[{"_id":"507f1f77bcf86cd799439014","name":"General","capacity":100,"price":15000,"available":100}],
    "artists":[{"_id":"507f1f77bcf86cd799439015","name":"Artista de prueba","role":"headliner"}],
    "genre":"Rock",
    "ageRestriction":18,
    "image":null,
    "status":"draft",
    "organizer":"507f1f77bcf86cd799439011"
  }
}
```

Publicar con `PATCH /api/events/{{eventId}}/status` y `{"status":"published"}`. Transiciones:

- `draft` → `published` o `cancelled`.
- `published` → `finished` o `cancelled`.
- `finished` y `cancelled` son terminales.

No se publica un evento pasado ni se finaliza uno que todavía no ocurrió. Cambiar el evento a cancelado no cancela masivamente tickets ni implementa reembolsos.

Actualizar con `PUT /api/events/{{eventId}}` y, por ejemplo, `{"title":"Festival actualizado"}`. Aplica los campos editables presentes: `title`, `description`, `category`, `date`, `location`, `artists`, `genre`, `ageRestriction`, `image`. Enviar objetos completos para estructuras anidadas como `location`. No permite editar sectores, organizador o estado por esta ruta. Eventos `finished` y `cancelled` no admiten modificaciones.

Eliminar con `DELETE /api/events/{{eventId}}`, solo en `draft`. Responde `{"status":"success","message":"Evento eliminado correctamente"}`.

### Sectores, filtros y paginación

Cada sector tiene nombre, capacidad entera mínima de 1, precio no negativo y disponibilidad entera entre 0 y su capacidad. Inicialmente disponibilidad y capacidad coinciden. El DTO calcula `capacity` como suma de capacidades y `price` como el menor precio de sus sectores. La reserva selecciona el sector por **nombre**, no por ObjectId.

El catálogo y detalle público solo muestran eventos `published`. Un borrador no es consultable por GET público, incluso con cookie del propietario; conservar el ID y respuesta de creación para administrarlo.

```http
GET /api/events?location=Buenos%20Aires&genre=Rock&search=Festival&page=1&limit=10&sort=-date
```

Filtros: `category` por ID, `location` por ciudad, `artists` por nombre, `genre`, `fromDate`, `toDate` y `search` sobre título/descripción, literal y sin distinguir mayúsculas. Usar fechas ISO y páginas enteras positivas. Orden predeterminado `date`; `-date` invierte el orden. Límite predeterminado 10, acotado entre 1 y 100. La validación de números y rangos aún no es estricta.

Respuesta sin coincidencias:

```json
{"status":"success","data":[],"page":1,"limit":10,"total":0,"totalPages":0}
```

Con coincidencias, `data` contiene DTO de eventos. La paginación está en el nivel superior, no dentro de `pagination`.

### Reserva, confirmación y cancelación

1. Reservar mediante `POST /api/tickets/reserve`:

   ```json
   {"eventId":"507f1f77bcf86cd799439013","sector":"General","quantity":2}
   ```

   Requiere evento publicado y futuro, sector existente y cantidad entera positiva con cupos suficientes. Descuenta disponibilidad y crea el ticket en una transacción.

2. Confirmar mediante `PATCH /api/tickets/{{ticketId}}/confirm`, sin cuerpo y antes del vencimiento. Cambia `reserved` a `sold` sin descontar nuevamente cupos. El evento debe seguir publicado y no haber comenzado. No se realiza un pago externo.

Respuesta de reserva 201 ilustrativa:

```json
{
  "success":true,
  "payload":{
    "id":"507f1f77bcf86cd799439016",
    "user":"507f1f77bcf86cd799439011",
    "event":"507f1f77bcf86cd799439013",
    "sector":"507f1f77bcf86cd799439014",
    "quantity":2,
    "status":"reserved",
    "reservationCode":"00000000-0000-4000-8000-000000000001",
    "expiresAt":"2030-12-01T12:15:00.000Z",
    "createdAt":"2030-12-01T12:00:00.000Z",
    "cancelledAt":null
  }
}
```

Confirmar devuelve esa estructura con 200 y `status: "sold"`. Cancelar mediante `PATCH /api/tickets/{{ticketId}}/cancel` devuelve 200, `status: "cancelled"` y `cancelledAt` informado; devuelve cupos en una transacción. Solo se cancelan tickets `reserved`, no entradas vendidas.

`GET /api/tickets/{{ticketId}}` devuelve el ticket propio con la misma envoltura `success`; un ticket ajeno o inexistente responde 404. `GET /api/tickets/my-tickets` devuelve `{"success":true,"payload":[]}` o un array de DTO; en ese listado, `event` se puebla con `_id`, `title`, `date`, `location` y `status`.

`GET /api/events/{{eventId}}/tickets` devuelve `{"status":"success","payload":[]}` o un array de DTO con todos los estados, sin filtro ni paginación. `user` incluye `_id`, nombre, apellido y email seleccionados, sin contraseña. Requiere organizer propietario o admin.

### Expiración y prevención de duplicados

Las reservas vencen a los **15 minutos**. Confirmar después de `expiresAt` devuelve 409 aunque el job aún no las haya procesado. El job se inicia con el servidor y revisa vencimientos cada 60 segundos, hasta 100 tickets por ejecución. La liberación no es instantánea: puede demorar más con lotes pendientes o el servidor detenido.

Expirar cambia `reserved` a `cancelled`, informa `cancelledAt` y devuelve cupos en una transacción. Las actualizaciones condicionales impiden aplicar dos veces la devolución del mismo ticket. El descuento de cupos exige disponibilidad suficiente mediante una actualización condicional del sector.

Se consulta la existencia de un ticket activo y se declara un índice único parcial `(user, event)` para `reserved` y `sold`. La restricción es por evento, incluso entre sectores distintos. Los tickets `cancelled` permiten reservar otra vez. Una reserva vencida sigue bloqueando otra mientras conserve `reserved`. El índice debe existir efectivamente en MongoDB para aportar su garantía de unicidad.

## Nodemailer y Ethereal Email

Crear una cuenta de pruebas en [Ethereal Email](https://ethereal.email/) y copiar sus credenciales únicamente al `.env` local en `MAIL_USER` y `MAIL_PASS`. Configurar `MAIL_FROM` con un remitente de prueba. El transporte está fijado en `smtp.ethereal.email:587`, con `secure: false`.

El servicio verifica SMTP al importarse. Después de confirmar, intenta enviar nombre, evento y código de reserva. Si falla el envío, registra el error y la venta sigue confirmada; no hay reintento automático.

Ethereal captura mensajes para inspección en su interfaz y no los entrega a destinatarios reales. Iniciar sesión en la cuenta de prueba y revisar los mensajes. La API no devuelve enlaces de previsualización. No publicar credenciales en README, capturas ni colecciones Postman.

## DTO, errores y códigos HTTP

- `currentUserDTO`: ID, nombre, apellido, email y rol; excluye contraseña/hash.
- `EventDTO`: datos del evento, sectores, organizador y agregados de capacidad/precio.
- `ticketDTO`: referencias, sector, cantidad, estado, código y fechas. Las referencias pueden ser IDs o documentos poblados según la consulta.

Eventos/usuarios/categorías usan generalmente `status: "success"`; tickets usan `success: true`; sesiones tienen mensajes propios. No hay una envoltura única.

| Código | Casos implementados |
| --- | --- |
| 200 | Consultas, login/logout, cambios y eliminaciones exitosos |
| 201 | Registro, categoría, evento y reserva creados |
| 400 | Validación, ID inválido, sector/cantidad inválidos y transición no permitida |
| 401 | Falta de autenticación, cookie inválida/vencida o credenciales incorrectas |
| 403 | Rol insuficiente, evento ajeno o quitarse el propio rol admin/eliminarse |
| 404 | Recurso inexistente, detalle de evento no publicado o ticket ajeno |
| 409 | Duplicado, cupos insuficientes, reserva vencida, conflicto de estado o borrar evento fuera de draft |
| 500 | Error interno inesperado |

Reservar un evento inexistente produce 409 por no estar disponible. Modificar un evento terminado/cancelado produce 400. Passport puede devolver texto (`Unauthorized`) en lugar de JSON en errores de autenticación.

El middleware global convierte duplicados MongoDB (11000) en 409 y validación/cast Mongoose en 400. Ejemplo de error de negocio:

```json
{"status":"error","message":"La reserva venció"}
```

## Usuarios de prueba y roles autorizados

1. Registrar cuentas sintéticas para comprador, organizador y administrador en una base aislada; todas nacen como `user`.
2. El primer admin requiere intervención del responsable autorizado de la base: no hay endpoint ni script de bootstrap. Tras verificar que está conectado a la base de pruebas, puede asignar `role: "admin"` al documento de esa cuenta sintética identificada por `_id`, mediante su herramienta administrativa. No modificar hashes ni registros de producción.
3. Iniciar sesión como admin y ejecutar `PATCH /api/users/{{organizerId}}/role` con `{"role":"organizer"}`. Devuelve 200 y el DTO actualizado. También admite `user` y `admin`.
4. Iniciar sesión como organizador y crear eventos. Cada solicitud autenticada vuelve a recuperar el usuario de MongoDB.

No hay seed, administrador predeterminado ni elevación pública de roles. Los emails `example.invalid` y las contraseñas de ejemplo son ficticios.

## Ejemplos de pruebas con Postman

Crear un entorno local con `baseUrl`, `categoryId`, `eventId`, `ticketId` e IDs de usuarios. Usar Body → raw → JSON y conservar cookies. No exportar cookies ni credenciales reales.

1. Preparar el admin autorizado, iniciar sesión, crear categoría, guardar `payload._id` y asignar el rol organizer.
2. Iniciar sesión como organizer, crear evento con fecha futura, guardar `payload.id` y publicarlo por PATCH de estado.
3. Consultar catálogo sin autenticación: debe aparecer el publicado y no los borradores.
4. Iniciar sesión como comprador, reservar, guardar `payload.id` en `ticketId`, consultar mis tickets y confirmar antes de quince minutos.
5. Crear otra reserva en otro evento para probar cancelación y recuperación de cupos. No esperar éxito al cancelar la entrada ya vendida.
6. Como organizer propietario consultar tickets del evento. Otro organizer debe recibir 403; admin puede consultar cualquier evento.
7. Crear una reserva independiente y esperar más de quince minutos y el siguiente ciclo del job para comprobar vencimiento, estado y disponibilidad. No alterar datos de una base compartida.

Script posterior a la respuesta de reserva:

```javascript
pm.test("Reserva creada", () => pm.response.to.have.status(201));
const body = pm.response.json();
pm.expect(body.payload.status).to.eql("reserved");
pm.environment.set("ticketId", body.payload.id);
```

Casos negativos: registro inválido (400), current sin cookie (401), crear evento como user (403), ID válido inexistente en detalle público (404), reserva activa duplicada o cupo insuficiente (409). Borrar la cookie para probar 401. Al cambiar de usuario hacer logout/login o separar cookie jars: la cookie vigente determina la identidad.

Estos son escenarios esperados según el código, no resultados certificados de una colección ejecutada.

## Tests

```bash
npm test
```

Para ejecutar solo el archivo actual:

```bash
node --test tests/events.service.test.js
```

El archivo contiene pruebas de servicio con `node:test`. No carga `.env`, conecta a MongoDB ni prepara una base aislada automáticamente; una prueba de creación consulta categorías mediante un repositorio no simulado y puede fallar sin conexión.

La última ejecución de `npm test` terminó con cuatro fallos: una consulta de categorías sin conexión a MongoDB, una expectativa de ordenamiento y dos diferencias entre códigos 400 y 409. La suite requiere actualizar su aislamiento y sus expectativas respecto del comportamiento actual.

La cobertura completa de integración, concurrencia y rollback está pendiente. Para evaluar esos flujos, usar MongoDB transaccional aislado y SMTP simulado o Ethereal. **Nunca ejecutar pruebas sobre producción.**

## Alcance actual

La API cubre el catálogo, la administración de eventos y la gestión de reservas y tickets. No incluye reembolsos ni cancelación masiva de tickets al cancelar un evento. El primer administrador se prepara mediante el procedimiento autorizado descrito en esta documentación.

## Desarrollo futuro

Está previsto desarrollar un frontend independiente con **React** y posiblemente **TypeScript**, que consumirá la API REST existente. Incluirá catálogo de eventos, autenticación, selección de sectores, reservas, consulta de entradas y un panel de administración. **El frontend no está implementado actualmente.**

También se prevé incorporar el cambio de contraseña y la autenticación mediante OAuth, todavía no implementados. Como posibles ampliaciones se consideran una pasarela de pagos, la generación de entradas con QR y notificaciones adicionales, por ejemplo en tiempo real. Estas funciones son propuestas futuras; actualmente solo se implementa el correo de confirmación y la venta lógica del ticket.

## Seguridad de la configuración

`.gitignore` excluye `node_modules/`, `.env` y `.env.*`, y permite `.env.example`. Conservar credenciales únicamente en la configuración local o en el sistema de secretos del despliegue.
# ticket-tec-api
