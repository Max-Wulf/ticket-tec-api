import { eventsService } from "../services/events.services.js";
import { EventDTO } from "../DTO/event.dto.js";
import { ticketDTO } from "../DTO/ticket.dto.js";

export const getEvents = async (req, res, next) => {
    try {
        const result = await eventsService.getAll(req.query);

        return res.status(200).json({
            status: "success",
            ...result,
            data: result.data.map(event => new EventDTO(event))
        });
    } catch (error) {
        next(error);
    }
};

export const getEventById = async (req, res, next) => {
    try {
        const event = await eventsService.getPublicById(req.params.eventId);

        return res.status(200).json({
            status: "success",
            payload: new EventDTO(event)
        });
    } catch (error) {
        next(error);
    }
};

export const createEvent = async (req, res, next) => {
    try {
        const event = await eventsService.create(req.body, req.user._id);
        return res.status(201).json({
            status: "success",
            payload: new EventDTO(event)
        });
    } catch (error) {
        next(error);
    }
};

export const updateEvent = async (req, res, next) => {
    try {
        const event = await eventsService.update(req.params.eventId, req.body);
        return res.status(200).json({
            status: "success",
            payload: new EventDTO(event)
        });
    } catch (error) {
        next(error);
    }
};

export const updateEventStatus = async (req, res, next) => {
    try {
        const event = await eventsService.updateStatus(req.params.eventId, req.body?.status);
        return res.status(200).json({
            status: "success",
            payload: new EventDTO(event)
        });
    } catch (error) {
        next(error);
    }
};

export const deleteEvent = async (req, res, next) => {
    try {
         await eventsService.delete(req.params.eventId);

        return res.status(200).json({
            status: "success",
            message: "Evento eliminado correctamente"
        });
    } catch (error) {
        next(error);
    }
};

export const getEventTickets = async (req, res, next) => {
    try {
        const { eventId } = req.params;

        const tickets = await eventsService.getEventTickets(eventId);

        return res.status(200).json({
            status: "success",
            payload: tickets.map(ticketDTO)
        });

    } catch (error) {
        next(error);
    }
};

