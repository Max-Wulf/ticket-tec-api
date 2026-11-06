# TICKET/TEC — API de eventos

Backend de una plataforma de eventos desarrollado para la entrega final de Coderhouse. Permite registrar usuarios, autenticar sesiones, administrar eventos y gestionar entradas por sector mediante reservas y confirmaciones.

La API incluye permisos por rol y propiedad, control de cupos con transacciones MongoDB, expiración automática de reservas y correos de confirmación. Confirmar una entrada representa una venta lógica, sin procesamiento de pagos reales.

## Tecnologías

- Node.js con módulos ES y Express 5.
- MongoDB Atlas y Mongoose 9.
- Passport Local/JWT, jsonwebtoken y cookie-parser.
- bcrypt para el hash de contraseñas.
- Nodemailer y Ethereal Email para notificaciones de prueba.
- dotenv para configuración por entorno.

## Arquitectura por capas

```text
Routes → Controllers → Services → Repositories → DAO → Models → MongoDB
```

Las rutas definen endpoints y controles de acceso; los controllers coordinan solicitudes y respuestas; los services aplican reglas de negocio; los repositories delegan persistencia a los DAO. Los DTO seleccionan y organizan los datos de salida.

```text
index.js                   Conexión MongoDB, servidor HTTP e inicio del job
src/
  app.js                   Express, Passport y montaje de routers
  routes/                  Rutas de la API
  controllers/             Coordinación de request y response
  services/                Reglas de negocio y correo
  repositories/            Acceso a persistencia mediante DAO
  DAO-managers/            DAO de usuarios y subcarpeta mongo/
  models/                  Esquemas Mongoose
  DTO/                     Datos de salida de usuarios, eventos y tickets
  middlewares/             Roles, propiedad, registro, log y errores
  utils/                   JWT y contraseñas
  config/                  Passport y transporte SMTP
  jobs/                    Expiración automática de reservas
```

## Requisitos e instalación

- Node.js 20.19 o superior y npm.
- MongoDB Atlas o un replica set con soporte de transacciones.
- Cuenta de Ethereal Email para consultar los correos de prueba.
- Postman u otro cliente HTTP que conserve cookies.

Una instancia MongoDB standalone no alcanza para las operaciones transaccionales de tickets.

```bash
git clone https://github.com/Max-Wulf/ticket-tec-api.git
cd ticket-tec-api
npm ci
```

Crear `.env` a partir de `.env.example`, sin sobrescribir una configuración existente. En PowerShell:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

En Linux o macOS:

```bash
test -e .env || cp .env.example .env
```

Completar las variables locales y ejecutar:

```bash
npm start
```

El servidor espera la conexión a MongoDB antes de escuchar solicitudes. La URL local predeterminada es `http://localhost:3000`. Si se usa un replica set local, debe estar inicializado previamente: agregar `replicaSet` a la URI no lo crea.

## Variables de entorno

`index.js` carga `.env` mediante dotenv. La configuración utilizada por el código es:

| Variable | Uso |
| --- | --- |
| `PORT` | Puerto HTTP; predeterminado `3000` |
| `MONGODB_URI` | URI completa de MongoDB, con la base y opciones de conexión |
| `JWT_SECRET` | Secreto para firmar y verificar tokens |
| `NODE_ENV` | `production` activa cookies Secure y requiere HTTPS; usar `development` para HTTP local |
| `MAIL_USER` | Usuario SMTP de Ethereal |
| `MAIL_PASS` | Contraseña SMTP de Ethereal |
| `MAIL_FROM` | Remitente de las notificaciones |

El código utiliza `MONGODB_URI` para la conexión. El JWT y la cookie duran una hora. El transporte SMTP está configurado en `smtp.ethereal.email`, puerto `587`, con `secure: false`.

Las referencias comentadas a `MONGO_URL`, `JWT_EXPIRES_IN`, `MAIL_HOST` y `MAIL_PORT` del archivo de ejemplo no se leen actualmente; definirlas no modifica estos valores.

Guardar los valores privados únicamente en `.env` o en el sistema de secretos del despliegue. `.gitignore` excluye `.env`, `.env.*` y `node_modules/`, y permite `.env.example`.

## Comandos disponibles

| Comando | Script | Función |
| --- | --- | --- |
| `npm start` | `node --watch index.js` | Inicia el servidor con reinicio ante cambios |
| `npm test` | `node --test` | Ejecuta los archivos de pruebas que descubra Node.js |

## Autenticación y roles

Passport implementa las estrategias `register`, `login` y `current`. El registro valida nombre y apellido, normaliza el email y exige una contraseña de al menos seis caracteres. La contraseña se almacena con bcrypt. El registro público siempre asigna `user`, aunque se envíe otro rol en el cuerpo.

El login guarda un JWT en la cookie `currentUser`, con `httpOnly`, `SameSite=Lax` y `Secure` en producción. El token contiene ID, email y rol, sin contraseña; no se devuelve en el cuerpo del login. La estrategia `current` obtiene el token desde la cookie y recupera al usuario mediante repository y DAO. Las respuestas de usuario no exponen su contraseña.

Logout elimina la cookie. Para acceder a rutas protegidas desde Postman, conservar la cookie recibida; un token Bearer no reemplaza este mecanismo.

| Actor | Permisos |
| --- | --- |
| Público | Registro, login, logout y consulta de eventos publicados |
| `user` | Consultar su sesión y gestionar sus propias reservas y entradas |
| `organizer` | Además, crear eventos y administrar o consultar tickets de sus eventos |
| `admin` | Administrar usuarios, categorías y cualquier evento; consultar tickets de cualquier evento |

Las operaciones individuales sobre tickets requieren ser el comprador propietario, también para usuarios admin. La administración de eventos permite actuar al organizer propietario o al admin.

## Endpoints

Los cuerpos de las solicitudes son JSON. `eventId`, `ticketId` y `userId` son identificadores MongoDB.

| Método | Ruta | Acceso | Resultado exitoso |
| --- | --- | --- | --- |
| POST | `/api/sessions/register` | Público | 201, mensaje y usuario |
| POST | `/api/sessions/login` | Público | 200, mensaje y cookie |
| GET | `/api/sessions/current` | Autenticado | 200, DTO de usuario |
| POST | `/api/sessions/logout` | Público | 200, cierre de sesión |
| GET | `/api/sessions/users` | Admin | 200, usuarios; alias de `/api/users` |
| GET | `/api/users` | Admin | 200, listado de usuarios |
| GET | `/api/users/:userId` | Admin | 200, usuario individual |
| PATCH | `/api/users/:userId/role` | Admin | 200, cambio de rol |
| DELETE | `/api/users/:userId` | Admin | 200, eliminación de usuario |
| POST | `/api/categories` | Admin | 201, categoría creada |
| GET | `/api/events` | Público | 200, eventos publicados y paginación |
| GET | `/api/events/:eventId` | Público | 200, detalle de evento publicado |
| POST | `/api/events` | Organizer/admin | 201, evento en draft |
| PUT | `/api/events/:eventId` | Organizer propietario/admin | 200, evento actualizado |
| PATCH | `/api/events/:eventId/status` | Organizer propietario/admin | 200, cambio de estado |
| DELETE | `/api/events/:eventId` | Organizer propietario/admin | 200, eliminación de un draft |
| GET | `/api/events/:eventId/tickets` | Organizer propietario/admin | 200, tickets del evento |
| POST | `/api/tickets/reserve` | Autenticado | 201, reserva creada |
| GET | `/api/tickets/my-tickets` | Autenticado | 200, tickets propios |
| GET | `/api/tickets/:ticketId` | Comprador propietario | 200, detalle del ticket |
| PATCH | `/api/tickets/:ticketId/confirm` | Comprador propietario | 200, entrada confirmada |
| PATCH | `/api/tickets/:ticketId/cancel` | Comprador propietario | 200, reserva cancelada |

## Usuarios de prueba

No existen cuentas predeterminadas ni un script de creación de administradores.

1. Registrar cuentas de prueba para comprador, organizer y admin; todas se crean con rol `user`.
2. El responsable autorizado de la base de pruebas debe asignar el primer rol `admin` a la cuenta correspondiente.
3. Iniciar sesión como admin y asignar el rol de organizador con `PATCH /api/users/{{userId}}/role`:

   ```json
   {"role":"organizer"}
   ```

4. Crear una categoría con `POST /api/categories` y `{"name":"Música"}`. Guardar `payload._id`, ya que no hay endpoint de listado de categorías.

El admin puede asignar `user`, `organizer` o `admin`, pero no quitarse su propio rol ni eliminar su cuenta.

## Creación y administración de eventos

En Postman, definir `categoryId` con el ID de una categoría existente. Crear el evento mediante `POST /api/events` con cookie de organizer o admin:

```json
{
  "title":"Festival TICKET/TEC",
  "description":"Encuentro de música en vivo",
  "category":"{{categoryId}}",
  "date":"2030-12-15T21:00:00.000Z",
  "location":{
    "venue":"Sala principal",
    "address":"Dirección del evento",
    "city":"Buenos Aires"
  },
  "sectors":[
    {"name":"General","capacity":100,"price":15000}
  ],
  "artists":[
    {"name":"Artista invitado","role":"headliner"}
  ],
  "genre":"Rock",
  "ageRestriction":18,
  "image":null
}
```

Los datos son ilustrativos; usar una fecha futura al ejecutar el ejemplo. El organizador se toma de la sesión y el estado inicial es `draft`. Cada sector requiere capacidad entera positiva y precio no negativo; `available` comienza con el valor de `capacity`. EventDTO devuelve la capacidad total y el precio mínimo de los sectores.

Guardar `payload.id` como `eventId` y publicar con `PATCH /api/events/{{eventId}}/status`:

```json
{"status":"published"}
```

Las transiciones son `draft → published/cancelled` y `published → finished/cancelled`. Los estados `finished` y `cancelled` son terminales. No se publica un evento pasado ni se finaliza uno que todavía no ocurrió.

PUT permite modificar título, descripción, categoría, fecha, ubicación, artistas, género, restricción de edad e imagen. Las estructuras anidadas, como `location`, se envían completas. Sectores, organizador y estado no se editan por esta ruta. Los eventos finalizados o cancelados no admiten cambios; DELETE solo elimina borradores.

### Catálogo, filtros y paginación

El listado y el detalle público muestran exclusivamente eventos `published`.

```http
GET /api/events?location=Buenos%20Aires&genre=Rock&search=Festival&page=1&limit=5&sort=-date
```

Filtros disponibles: `category` por ID, `location` por ciudad, `artists` por nombre, `genre`, `fromDate`, `toDate` y `search` sobre título o descripción. La búsqueda es literal y no distingue mayúsculas. Usar fechas ISO y páginas enteras positivas.

La página predeterminada es 1 y el límite 10, acotado entre 1 y 100. El orden predeterminado es `date`; `-date` invierte el orden. La respuesta incluye `data`, `page`, `limit`, `total` y `totalPages`. Ejemplo sin coincidencias:

```json
{"status":"success","data":[],"page":1,"limit":5,"total":0,"totalPages":0}
```

## Reservas, confirmación y cancelación

### Reservar

Enviar `POST /api/tickets/reserve` con cookie de usuario autenticado:

```json
{"eventId":"{{eventId}}","sector":"General","quantity":2}
```

El sector se selecciona por nombre. La cantidad debe ser entera positiva; el evento debe estar publicado y ser futuro. Se valida cupo suficiente y ausencia de otra reserva o entrada activa del mismo usuario para ese evento, incluso si pertenece a otro sector.

La operación descuenta disponibilidad y crea el ticket en una transacción. Responde 201 con `success: true` y `payload`, que incluye ID, referencias de usuario/evento/sector, cantidad, estado `reserved`, `reservationCode`, `expiresAt`, `createdAt` y `cancelledAt`.

### Confirmar

Enviar `PATCH /api/tickets/{{ticketId}}/confirm`, sin cuerpo y antes del vencimiento. Cambia `reserved` a `sold` sin descontar cupos nuevamente. El evento debe seguir publicado y no haber comenzado. Después de confirmar se intenta enviar el correo de la entrada.

### Cancelar

Enviar `PATCH /api/tickets/{{ticketId}}/cancel`, sin cuerpo. Solo el comprador propietario puede cancelar un ticket en estado `reserved`. La operación cambia a `cancelled`, informa `cancelledAt` y devuelve los cupos en una transacción; no elimina el documento. Las entradas `sold` no se cancelan por esta ruta.

Los tickets cancelados permiten una nueva reserva. La actualización condicional impide devolver dos veces los cupos del mismo ticket.

### Consultar tickets

`GET /api/tickets/my-tickets` devuelve los tickets propios con datos básicos del evento poblados: título, fecha, ubicación y estado. `GET /api/tickets/:ticketId` consulta un ticket propio.

`GET /api/events/:eventId/tickets` permite al organizer propietario o al admin consultar todos los estados de tickets del evento. Incluye nombre, apellido y email del comprador, sin contraseña.

Las respuestas de tickets utilizan `success: true` y `payload`; el listado por evento utiliza `status: "success"` y `payload`.

### Expiración automática

Las reservas vencen a los **15 minutos**. El job se inicia con el servidor y utiliza `setInterval` para revisar vencimientos cada **60 segundos**, con hasta 100 tickets por ejecución.

La expiración cambia `reserved` a `cancelled` y devuelve cupos dentro de una transacción. Confirmar después de `expiresAt` devuelve 409, aunque el job aún no haya procesado la reserva. Una reserva vencida sigue ocupando cupo y bloqueando duplicados hasta que cambie de estado.

El modelo declara un índice único parcial por usuario y evento para los estados `reserved` y `sold`, además de las validaciones del servicio.

## Correos con Nodemailer y Ethereal

Configurar `MAIL_USER`, `MAIL_PASS` y `MAIL_FROM` con la cuenta de pruebas de [Ethereal Email](https://ethereal.email/). El servicio verifica el transporte SMTP al importarse.

Al confirmar una entrada, Nodemailer envía nombre del comprador, título del evento y código de reserva. Ethereal captura el mensaje para consultarlo en su interfaz sin entregarlo a un destinatario real. Si el envío falla, se registra el error y la entrada permanece confirmada; no hay reintento automático.

## Errores y respuestas

Un middleware centralizado gestiona errores de negocio, validaciones de Mongoose y duplicados MongoDB.

| Código | Uso |
| --- | --- |
| 400 | Datos o identificadores inválidos; transición no permitida |
| 401 | Credenciales incorrectas o cookie ausente, inválida o vencida |
| 403 | Rol insuficiente o intento de administrar un evento ajeno |
| 404 | Recurso inexistente, evento no publicado o ticket ajeno |
| 409 | Duplicado activo, falta de cupos, reserva vencida o conflicto de estado |
| 500 | Error interno inesperado |

Reservar un evento inexistente devuelve 409 por no estar disponible. Passport puede responder `Unauthorized` como texto. Ejemplo de error de negocio:

```json
{"status":"error","message":"La reserva venció"}
```

## Pruebas con Postman

El backend fue probado manualmente por el autor con Postman, MongoDB Atlas y Ethereal: autenticación, roles, eventos, reservas, confirmaciones, cancelaciones, expiración y notificaciones. La actualización de este README no implicó ejecutar pruebas nuevas.

Crear un entorno con `baseUrl`, `categoryId`, `eventId`, `ticketId` y los IDs de usuarios. Usar Body → raw → JSON y conservar cookies. Para reproducir los flujos:

1. Registrar una cuenta con `first_name`, `last_name`, `email` y `password`; iniciar sesión con email y contraseña.
2. Consultar current, hacer logout y comprobar que current responde 401.
3. Intentar crear un evento como user: debe responder 403.
4. Preparar los roles de prueba, crear categoría y crear/publicar un evento como organizer.
5. Reservar como comprador, consultar my-tickets y confirmar antes del vencimiento; revisar el correo en Ethereal.
6. Probar duplicado activo y cantidad superior al cupo disponible: ambos deben responder 409.
7. Reservar en otro evento, cancelar antes de confirmar y verificar cupos y posibilidad de reservar nuevamente.
8. Consultar tickets como organizer propietario; probar modificación de evento ajeno como organizer (403) y como admin.
9. Crear una reserva independiente y esperar más de quince minutos y el siguiente ciclo del job para verificar expiración y devolución de cupos.
10. Consultar filtros y paginación; revisar que las respuestas de usuario no incluyan contraseña.

Script de Postman posterior a una reserva:

```javascript
pm.test("Reserva creada", () => pm.response.to.have.status(201));
const body = pm.response.json();
pm.expect(body.payload.status).to.eql("reserved");
pm.environment.set("ticketId", body.payload.id);
```

Al cambiar de usuario, hacer logout/login o separar las cookies de cada sesión. Mantener credenciales, tokens y datos privados fuera de las colecciones exportadas.

## Alcance y próximos pasos

La API administra eventos y entradas sin integrar pagos, reembolsos ni cancelación masiva de tickets al cancelar un evento.

Como evolución futura, se prevé desarrollar un frontend independiente con **React y TypeScript** que consuma la API: catálogo, autenticación, selección de sectores, reservas, entradas y panel de administración. Este frontend todavía no está implementado.
