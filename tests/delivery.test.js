import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { createServiceSchema, updateServiceSchema, serviceQuerySchema } from "../src/validators/service.validator.js";
import { createBookingSchema, updateBookingSchema } from "../src/validators/booking.validator.js";
import { BookingService } from "../src/services/bookings.services.js";
import { BookingMongoDAO } from "../src/DAO-managers/mongo/booking.mongo.dao.js";
import { ServicesMongoDAO } from "../src/DAO-managers/mongo/services.mongo.dao.js";
import { bookingModel } from "../src/models/booking.model.js";
import { serviceModel } from "../src/models/services.model.js";
import { createBooking, updateBooking } from "../src/controllers/booking.controller.js";
import { updateService } from "../src/controllers/service.controller.js";
import { configureSocket, getIO } from "../src/sockets/socket.manager.js";

const id = "507f1f77bcf86cd799439011";
const data = { clientName: "Ana", services: [{ service: id, quantity: 1 }], date: "2099-01-05", time: "10:00" };
const response = () => ({ status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } });

test("Zod valida create y updates parciales sin operadores ni campos desconocidos", () => {
  assert.equal(createServiceSchema.safeParse({}).success, false);
  assert.equal(createBookingSchema.safeParse(data).success, true);
  for (const schema of [updateServiceSchema, updateBookingSchema]) {
    for (const body of [{}, { $set: { price: -1 } }, { available: true }]) {
      assert.equal(schema.safeParse(body).success, false);
    }
  }
  assert.equal(updateServiceSchema.safeParse({ price: -1 }).success, false);
  assert.equal(updateServiceSchema.safeParse({ availability: false }).success, true);
  for (const quantity of [0, -1, 1.5, "1", 2]) {
    assert.equal(updateBookingSchema.safeParse({ services: [{ service: id, quantity }] }).success, false);
  }
  assert.equal(updateBookingSchema.safeParse({ services: [{ service: "invalid", quantity: 1 }] }).success, false);
});

test("updates inválidos devuelven 400 sin consultar MongoDB", async () => {
  const serviceRead = mock.method(serviceModel, "findById", () => { throw new Error("No debe consultar DB"); });
  const bookingRead = mock.method(bookingModel, "findById", () => { throw new Error("No debe consultar DB"); });
  try {
    for (const handler of [updateService, updateBooking]) {
      const res = response();
      await handler({ params: { id }, body: { $set: {} } }, res);
      assert.equal(res.code, 400);
    }
    assert.equal(serviceRead.mock.callCount(), 0);
    assert.equal(bookingRead.mock.callCount(), 0);
  } finally { mock.restoreAll(); }
});

test("create y update rechazan servicios inexistentes antes de escribir", async () => {
  let writes = 0;
  const repository = {
    getById: async () => data,
    findByDateAndTime: async () => null,
    create: async () => { writes++; },
    update: async () => { writes++; },
  };
  const service = new BookingService(repository, { getById: async () => null });
  await assert.rejects(service.createBooking(data), { statusCode: 400 });
  await assert.rejects(service.updateBooking(id, { services: data.services }), { statusCode: 400 });
  assert.equal(writes, 0);
});

test("create y update aceptan referencias existentes", async () => {
  const service = new BookingService({
    getById: async () => data,
    findByDateAndTime: async () => null,
    create: async (value) => value,
    update: async (_, value) => value,
  }, { getById: async () => ({ _id: id }) });
  assert.deepEqual((await service.createBooking(data)).services, data.services);
  assert.deepEqual((await service.updateBooking(id, { services: data.services })).services, data.services);
});

test("query params válidos y rechazo de paginación, orden o filtros inválidos", () => {
  assert.deepEqual(serviceQuerySchema.parse({ page: "2", limit: "5", sort: "desc", category: "Kinesiología" }),
    { page: 2, limit: 5, sort: "desc", category: "Kinesiología" });
  for (const query of [{ page: "0" }, { page: "1.5" }, { limit: "-1" }, { limit: "abc" }, { sort: "other" }, { category: { $ne: "" } }]) {
    assert.equal(serviceQuerySchema.safeParse(query).success, false);
  }
});

test("DAO aplica categoría, paginación y orden por precio", async () => {
  const calls = {};
  const query = { sort(v) { calls.sort = v; return this; }, skip(v) { calls.skip = v; return this; }, limit(v) { calls.limit = v; return this; } };
  mock.method(serviceModel, "find", (filter) => { calls.filter = filter; return query; });
  try {
    await new ServicesMongoDAO().getAll({ category: "Kinesiología", page: 2, limit: 5, sort: "desc" });
    assert.deepEqual(calls, { filter: { availability: true, category: "Kinesiología" }, sort: { price: -1 }, skip: 5, limit: 5 });
  } finally { mock.restoreAll(); }
});

test("ambas consultas de reservas usan populate", async () => {
  const paths = [];
  const query = () => ({ populate(path) { paths.push(path); return []; } });
  mock.method(bookingModel, "find", query);
  mock.method(bookingModel, "findById", query);
  try {
    const dao = new BookingMongoDAO();
    await dao.getAll();
    await dao.getById(id);
    assert.deepEqual(paths, ["services.service", "services.service"]);
  } finally { mock.restoreAll(); }
});

test("Socket.IO recibe configuración y emite bookingCreated después de guardar", async () => {
  const events = [];
  const io = { on(event) { assert.equal(event, "connection"); }, emit(event, payload) { events.push([event, payload]); } };
  configureSocket(io);
  assert.equal(getIO(), io);
  mock.method(serviceModel, "findById", async () => ({ _id: id }));
  mock.method(bookingModel, "findOne", async () => null);
  mock.method(bookingModel, "create", async (value) => { assert.equal(events.length, 0); return value; });
  try {
    const res = response();
    await createBooking({ body: data }, res);
    assert.equal(res.code, 201);
    assert.deepEqual(events, [["bookingCreated", data]]);
    await createBooking({ body: {} }, response());
    assert.equal(events.length, 1);
  } finally { mock.restoreAll(); }
});
