import mongoose from "mongoose";
import { eventsRepository } from "../repositories/events.repository.js";
import { categoriesRepository } from "../repositories/category.repository.js";
import ticketRepository from "../repositories/ticket.repository.js";




const editableFields = [
    "title",
    "description",
    "category",
    "date",
    "location",
    "artists",
    "genre",
    "ageRestriction",
    "image"
];

const transitions = {
    draft: ["published", "cancelled"],
    published: ["finished", "cancelled"],
    finished: [],
    cancelled: []
};


export class EventsService {
    constructor(repository) {
        this.eventsRepository = repository;
    }


    async getAll(query) {
        const {
            category,
            location,
            artists,
            genre,
            fromDate,
            toDate,
            search,
            page = 1,
            limit = 10,
            sort = "date"
        } = query;

        const filter = {status: "published"};

        if (category) filter.category = category;
        if (location) filter["location.city"] = location;
        if (artists) filter["artists.name"] = artists;
        if (genre) filter.genre = genre;

        if (fromDate || toDate) {
            filter.date = {};

            if (fromDate) filter.date.$gte = new Date(fromDate);
            if (toDate) filter.date.$lte = new Date(toDate);
        }

        if (search) {
            const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

            filter.$or = [
                { title: { $regex: safeSearch, $options: "i" } },
                { description: { $regex: safeSearch, $options: "i" } }
            ];
        }

        const currentPage = Math.max(1, Number(page) || 1);
        const currentLimit = Math.max(1, Math.min(100, Number(limit) || 10));
        const skip = (currentPage - 1) * currentLimit;

        const { events, total } = await this.eventsRepository.getAll(
            filter,
            sort,
            skip,
            currentLimit
        );

        return {
            data: events,
            page: currentPage,
            limit: currentLimit,
            total,
            totalPages: Math.ceil(total / currentLimit)
        };
    }

    async getById(id) {
        if (!mongoose.isObjectIdOrHexString(id)) {
            const error = new Error("ID inválido");
            error.statusCode = 400;
            throw error;
        }

        const event = await this.eventsRepository.getById(id);

        if (!event) {
            const error = new Error("Evento no encontrado");
            error.statusCode = 404;
            throw error;
        }

        return event;
    }

    async getPublicById(id) {
        const event = await this.getById(id);

        if (event.status !== "published") {
            const error = new Error("Evento no encontrado");
            error.statusCode = 404;
            throw error;
        }

        return event;
    }

    async getEventTickets(eventId) {
        const event = await this.getById(eventId);

        return await ticketRepository.findByEventId(event._id);
    }

    async create(data, organizerId) {
       
        if (!data || typeof data !== "object" || Array.isArray(data)) {
            const error = new Error("Datos del evento inválidos");
            error.statusCode = 400;
            throw error;
        }

        const {
            title,
            description,
            category,
            date,
            location,
            sectors
        } = data;

        if (
            !title ||
            !description ||
            !category ||
            !date ||
            !location ||
            !sectors
        ) {
            const error = new Error("Faltan campos obligatorios");
            error.statusCode = 400;
            throw error;
        }

        const eventDate = new Date(date);

        if (Number.isNaN(eventDate.getTime())) {
            const error = new Error("La fecha del evento no es válida");
            error.statusCode = 400;
            throw error;
        }

        if (eventDate <= new Date()) {
            const error = new Error("No se pueden crear eventos con fechas pasadas");
            error.statusCode = 400;
            throw error;
        }

        if (!Array.isArray(sectors) || sectors.length === 0) {
            const error = new Error("Debe existir al menos un sector");
            error.statusCode = 400;
            throw error;
        }

        if (sectors.some(sector =>
            !sector ||
            typeof sector !== "object" ||
            Array.isArray(sector)
        )) {
            const error = new Error("Los sectores deben ser objetos válidos");
            error.statusCode = 400;
            throw error;
        } 
        
        if (!mongoose.isObjectIdOrHexString(category)) {
            const error = new Error("ID de categoría inválido");
            error.statusCode = 400;
            throw error;
        }
        
        const categoryExists = await categoriesRepository.getById(data.category);

        if (!categoryExists) {
            const error = new Error("La categoría no existe");
            error.statusCode = 404;
            throw error;
        }

        const eventData = {
            organizer: organizerId,
            status: "draft",
            sectors: sectors.map(sector => ({
                name: sector.name,
                capacity: sector.capacity,
                price: sector.price,
                available: sector.capacity
            }))
        };

        for (const field of editableFields) {
            if (Object.hasOwn(data, field)) {
                eventData[field] = data[field];
            }
        }

        return await this.eventsRepository.create(eventData);
    };

    async update(id, data) {
        const event = await this.eventsRepository.getById(id);

        if (!event) {
            const error = new Error("Evento no encontrado");
            error.statusCode = 404;
            throw error;
        }

        if (["cancelled", "finished"].includes(event.status)) {
            const error = new Error("No se puede modificar este evento");
            error.statusCode = 400;
            throw error;
        }

        if (!data || typeof data !== "object" || Array.isArray(data)) {
            const error = new Error("Datos de actualización inválidos");
            error.statusCode = 400;
            throw error;
        }

        const changes = {};

        for (const field of editableFields) {
            if (Object.hasOwn(data, field)) {
                changes[field] = data[field];
            }
        }

        if (Object.keys(changes).length === 0) {
            const error = new Error("No se enviaron campos editables");
            error.statusCode = 400;
            throw error;
        }

        if (Object.hasOwn(changes, "date")) {

            const eventDate = new Date(changes.date);

            if (Number.isNaN(eventDate.getTime())) {
                const error = new Error("Fecha inválida");
                error.statusCode = 400;
                throw error;
            }

            if (eventDate <= new Date()) {
                const error = new Error("No se puede asignar una fecha pasada al evento");
                error.statusCode = 400;
                throw error;
            }
        }
        if (Object.hasOwn(changes, "category")) {

            if (!mongoose.isObjectIdOrHexString(changes.category)) {
                const error = new Error("ID de categoría inválido");
                error.statusCode = 400;
                throw error;
            }

            const categoryExists = await categoriesRepository.getById(changes.category);

            if (!categoryExists) {
                const error = new Error("La categoría no existe");
                error.statusCode = 404;
                throw error;
            }
        }

        const updatedEvent = await this.eventsRepository.update(id, changes);

        if (!updatedEvent) {
            const error = new Error("El evento ya no admite modificaciones");
            error.statusCode = 409;
            throw error;
        }

        return updatedEvent;

    };

    async updateStatus(id, status) {
        const event = await this.eventsRepository.getById(id);

        if (!event) {
            const error = new Error("Evento no encontrado");
            error.statusCode = 404;
            throw error;
        }

        if (!transitions[event.status]?.includes(status)) {
            const error = new Error("Transición de estado no permitida");
            error.statusCode = 400;
            throw error;
        }

        const eventDate = new Date(event.date);

        if (status === "published" && eventDate <= new Date()) {
            const error = new Error("No se puede publicar un evento con fecha pasada");
            error.statusCode = 400;
            throw error;
        }

        if (status === "finished" && eventDate > new Date()) {
            const error = new Error("No se puede finalizar un evento que todavía no ocurrió");
            error.statusCode = 400;
            throw error;
        }

        const updatedEvent = await this.eventsRepository.updateStatus(
            id,
            status,
            event.status
        );

        if (!updatedEvent) {
            const error = new Error("El estado del evento cambió. Intentá nuevamente");
            error.statusCode = 409;
            throw error;
        }

        return updatedEvent;
    };

    async delete(id) {
        const event = await this.eventsRepository.getById(id);

        if (!event) {
            const error = new Error("Evento no encontrado");
            error.statusCode = 404;
            throw error;
        }

        if (event.status !== "draft") {
            const error = new Error("Solo se pueden eliminar eventos en borrador");
            error.statusCode = 409;
            throw error;
        }

        const deletedEvent = await this.eventsRepository.delete(id);

        if (!deletedEvent) {
            const error = new Error("No se pudo eliminar el evento");
            error.statusCode = 409;
            throw error;
        }

        return deletedEvent;
    }
};

export const eventsService = new EventsService(eventsRepository);