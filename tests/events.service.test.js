import test from "node:test";
import assert from "node:assert/strict";
import { EventsService } from "../src/services/events.services.js";

const id = "507f1f77bcf86cd799439011";
const valid = () => ({
    title: " Evento ", description: "Descripción", category: id,
    date: new Date(Date.now() + 86400000).toISOString(),
    location: { venue: " Sala ", address: "Calle 1", city: "Ciudad" },
    sectors: [{ name: "General", capacity: 10, price: 100, available: 999 }],
    organizer: "ignorado", status: "published"
});

test("create prepara ubicación, disponibilidad y organizador autenticado", async () => {
    const service = new EventsService({ create: async data => data });
    const event = await service.create(valid(), id);
    assert.equal(event.title, "Evento");
    assert.equal(event.location.venue, "Sala");
    assert.equal(event.sectors[0].available, 10);
    assert.equal(event.organizer, id);
    assert.equal(event.status, undefined);
    await assert.rejects(service.create({ ...valid(), location: "Sala" }, id), { statusCode: 400 });
});

test("listado prepara filtros, búsqueda literal y paginación", async () => {
    const service = new EventsService({ getAll: async (filter, sort, skip, limit) => {
        assert.equal(filter.$or[0].title.$regex, "a\\.b");
        assert.equal(sort.date, -1);
        assert.equal(skip, 10);
        assert.equal(limit, 10);
        return { events: [], total: 21 };
    } });
    const result = await service.getAll({ search: "a.b", page: "2", sort: "-date" });
    assert.equal(result.pagination.totalPages, 3);
    await assert.rejects(service.getAll({ page: 0 }), { statusCode: 400 });
    await assert.rejects(service.getAll({ fromDate: "2030-02-01", toDate: "2030-01-01" }), { statusCode: 400 });
});

test("update filtra campos protegidos y bloquea eventos terminados", async () => {
    let status = "draft";
    const service = new EventsService({
        getById: async () => ({ status }),
        update: async (eventId, data) => {
            assert.equal(eventId, id);
            assert.deepEqual(data, { title: "Nuevo" });
            return data;
        }
    });
    await service.update(id, { title: "Nuevo", organizer: id, status: "finished", sectors: [] });
    status = "finished";
    await assert.rejects(service.update(id, { title: "Nuevo" }), { statusCode: 409 });
});

test("estado valida transición y envía el estado anterior al repository", async () => {
    const service = new EventsService({
        getById: async () => ({ status: "draft" }),
        updateStatus: async (...args) => {
            assert.deepEqual(args, [id, "published", "draft"]);
            return { status: "published" };
        }
    });
    assert.equal((await service.updateStatus(id, "published")).status, "published");
    await assert.rejects(service.updateStatus(id, "finished"), { statusCode: 409 });
    await assert.rejects(service.getById("incorrecto"), { statusCode: 400 });
    const missing = new EventsService({ getById: async () => null });
    await assert.rejects(missing.getById(id), { statusCode: 404 });
});
