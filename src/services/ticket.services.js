import mongoose from "mongoose";
import crypto from "node:crypto";
import TicketRepository  from "../repositories/ticket.repository.js";
import { eventsRepository } from "../repositories/events.repository.js";
import { sendTicketConfirmationEmail } from "./email.services.js";


export class TicketService {
    constructor (ticketRepository, eventRepository) {
        this.ticketRepository= ticketRepository ;
        this.eventRepository = eventRepository;
    }

    async findAll(userId) {
        if (!mongoose.isObjectIdOrHexString(userId)) {
            const error = new Error("ID de usuario inválido");
            error.statusCode = 400;
            throw error;
        }

        return await this.ticketRepository.findByUserId(userId);
    }

    async findById(userId, ticketId) {

        if (!mongoose.isObjectIdOrHexString(userId)) {
            const error = new Error("ID de usuario inválido");
            error.statusCode = 400;
            throw error;
        }

        if (!mongoose.isObjectIdOrHexString(ticketId)) {
            const error = new Error("ID del ticket inválido");
            error.statusCode = 400;
            throw error;
        }
        
        const ticket= await this.ticketRepository.getById(ticketId);

        if (!ticket){
            const error =new Error ("El ticket es Inexistente");
            error.statusCode = 404;
            throw error;
        }

        if(ticket.user.toString() !=userId.toString()) {
            const error=new Error("Ticket no encontrado");
            error.statusCode = 404;
            throw error;
        }

        return ticket;



    }

    async reserve(userId, { eventId, sector, quantity }) {

            if (!mongoose.isObjectIdOrHexString(eventId)) {
                const error = new Error("ID de evento inválido");
                error.statusCode = 400;
                throw error;
            }

            if (!mongoose.isObjectIdOrHexString(userId)) {
                const error = new Error("ID de usuario inválido");
                error.statusCode = 400;
                throw error;
            }        

            if (!Number.isInteger(quantity) || quantity <1) {
                const error = new Error("La cantidad debe ser un número entero positivo");
                error.statusCode = 400;
                throw error;
            }

            const event = await this.eventRepository.getById(eventId);

            if(!event){
                const error = new Error("El evento no esta disponible");
                error.statusCode = 409;
                throw error;
            }

            if (event.status !== "published"){
                const error = new Error ("el evento no esta disponible")
                error.statusCode = 409;
                throw error;
            }

            const now = new Date();
            const eventDate = new Date (event.date);

            if (now >= eventDate) {
                const error = new Error("El evento ya ha comenzado");
                error.statusCode = 409;
                throw error;       
            }

            const selectedSector = event.sectors.find(
                (s) => s.name === sector
            );

            if (!selectedSector) {
                const error = new Error("El sector seleccionado no es válido");
                error.statusCode = 400;
                throw error;
            }

            if (selectedSector.available < quantity) {
                const error = new Error("No hay suficientes entradas disponibles en el sector seleccionado");
                error.statusCode = 409;
                throw error;
            }

            const reservationCode = crypto.randomUUID();

            const expiresAt = new Date(Date.now() + 15 * 60 * 1000);


            const session = await mongoose.startSession();

            try {
                const ticket = await session.withTransaction(async () => {

                    const existingTicket =
                        await this.ticketRepository.findActiveByUserAndEvent(
                            userId,
                            eventId,
                            session
                        );

                    if (existingTicket) {
                        const error = new Error(
                            "Ya tenés una reserva o entrada activa para este evento"
                        );
                        error.statusCode = 409;
                        throw error;
                    }

                    const seatsReserved = await this.eventRepository.reserveSeats({
                        eventId,
                        sectorId: selectedSector._id,
                        quantity,
                        session
                    });

                    if (!seatsReserved) {
                        const error = new Error("No hay entradas disponibles");
                        error.statusCode = 409;
                        throw error;
                    }

                    const newTicket = await this.ticketRepository.create(
                        {
                            user: userId,
                            event: eventId,
                            sector: selectedSector._id,
                            quantity,
                            reservationCode,
                            expiresAt,
                            status: "reserved"
                        },
                        session
                    );

                    return newTicket;
                });

                return ticket;

            } finally {
                await session.endSession();
            
        }
    }

    async confirm(userId, ticketId) {

        if (!mongoose.isObjectIdOrHexString(userId)) {
            const error = new Error("ID de usuario inválido");
            error.statusCode = 400;
            throw error;
        }

        if (!mongoose.isObjectIdOrHexString(ticketId)) {
            const error = new Error("ID de ticket inválido");
            error.statusCode = 400;
            throw error;
        }

        const session = await mongoose.startSession();

        try {
            const confirmedTicket = await session.withTransaction(async () => {

                const ticket = await this.ticketRepository.getById(
                    ticketId,
                    session
                );

                if (!ticket || ticket.user.toString() !== userId.toString()) {
                    const error = new Error("Ticket no encontrado");
                    error.statusCode = 404;
                    throw error;
                }

                if (ticket.status !== "reserved") {
                    const error = new Error("El ticket no está reservado");
                    error.statusCode = 409;
                    throw error;
                }

                const now = new Date();

                if (!ticket.expiresAt || ticket.expiresAt <= now) {
                    const error = new Error("La reserva venció");
                    error.statusCode = 409;
                    throw error;
                }

                const event = await this.eventRepository.getById(
                    ticket.event,
                    session
                );

                if (!event || event.status !== "published" || event.date <= now) {
                    const error = new Error("El evento ya no está disponible");
                    error.statusCode = 409;
                    throw error;
                }

                const updatedTicket = await this.ticketRepository.confirmIfReserved(
                    ticketId,
                    userId,
                    new Date(),
                    session
                );

                if (!updatedTicket) {
                    const error = new Error("La reserva ya no puede confirmarse");
                    error.statusCode = 409;
                    throw error;
                }

                return updatedTicket;
            });

            try {
                const ticketWithDetails = await this.ticketRepository.getById(
                    confirmedTicket._id
                );

                await ticketWithDetails.populate("user", "first_name email");
                await ticketWithDetails.populate("event", "title");

                await sendTicketConfirmationEmail({
                    to: ticketWithDetails.user.email,
                    userName: ticketWithDetails.user.first_name,
                    eventTitle: ticketWithDetails.event.title,
                    ticketCode: confirmedTicket.reservationCode
                });

                console.log("Correo de confirmación enviado");

            } catch (error) {
                console.error(
                    "Error al enviar el correo de confirmación:",
                    error.message
                );
            }

            return confirmedTicket;

        } finally {
            await session.endSession();
        }
    }
    
    async cancel(userId, ticketId) {

        if (!mongoose.isObjectIdOrHexString(userId)) {
            const error = new Error("ID de usuario inválido");
            error.statusCode = 400;
            throw error;
        }

        if (!mongoose.isObjectIdOrHexString(ticketId)) {
            const error = new Error("ID del ticket inválido");
            error.statusCode = 400;
            throw error;
        }

        const session = await mongoose.startSession();

        try {
            const cancelledTicket = await session.withTransaction(async () => {

                const ticket = await this.ticketRepository.getById(
                    ticketId,
                    session
                );

                if (!ticket) {
                    const error = new Error("El ticket no existe");
                    error.statusCode = 404;
                    throw error;
                }

                if (ticket.user.toString() !== userId.toString()) {
                    const error = new Error("Ticket no encontrado");
                    error.statusCode = 404;
                    throw error;
                }

                if (ticket.status !== "reserved") {
                    const error = new Error("El ticket no está reservado");
                    error.statusCode = 409;
                    throw error;
                }

                const event = await this.eventRepository.getById(
                    ticket.event,
                    session
                );

                if (!event) {
                    const error = new Error("El evento asociado al ticket no existe");
                    error.statusCode = 404;
                    throw error;
                }

                const sector = event.sectors.id(ticket.sector);

                if (!sector) {
                    const error = new Error("El sector asociado al ticket no existe");
                    error.statusCode = 404;
                    throw error;
                }

                if (sector.available + ticket.quantity > sector.capacity) {
                    const error = new Error("La devolución supera la capacidad del sector");
                    error.statusCode = 409;
                    throw error;
                }

                const updatedTicket =
                    await this.ticketRepository.updateStatusIfReserved(
                        ticketId,
                        {
                            status: "cancelled",
                            cancelledAt: new Date()
                        },
                        session
                    );

                if (!updatedTicket) {
                    const error = new Error("El ticket ya no está reservado");
                    error.statusCode = 409;
                    throw error;
                }

               
                const updatedEvent = await this.eventRepository.releaseSeats({
                    eventId: ticket.event,
                    sectorId: ticket.sector,
                    quantity: ticket.quantity,
                    session
                });

                if (!updatedEvent) {
                    const error = new Error("No se pudieron devolver las entradas");
                    error.statusCode = 409;
                    throw error;
                }

                return updatedTicket;
            });

            return cancelledTicket;

        } finally {
            await session.endSession();
        }
    }

    async expireReservations() {
        const now = new Date();

        const expiredTickets =
            await this.ticketRepository.findExpiredReservations(now);

        let expiredCount = 0;

        for (const expiredTicket of expiredTickets) {
            const session = await mongoose.startSession();

            try {
                const expired = await session.withTransaction(async () => {
                    const ticket = await this.ticketRepository.expireIfReserved(
                        expiredTicket._id,
                        new Date(),
                        session
                    );

                    if (!ticket) {
                        return false;
                    }

                    const event = await this.eventRepository.getById(
                        ticket.event,
                        session
                    );

                    if (!event) {
                        throw new Error("Evento asociado inexistente");
                    }

                    const sector = event.sectors.id(ticket.sector);

                    if (!sector) {
                        throw new Error("Sector asociado inexistente");
                    }

                    const released = await this.eventRepository.releaseSeats({
                        eventId: ticket.event,
                        sectorId: ticket.sector,
                        quantity: ticket.quantity,
                        session
                    });

                    if (!released) {
                        throw new Error("No se pudieron devolver los cupos");
                    }

                    return true;
                });

                if (expired) {
                    expiredCount++;
                }
            } catch (error) {
                console.error(
                    `Error al expirar ticket ${expiredTicket._id}:`,
                    error.message
                );
            } finally {
                await session.endSession();
            }
        }

        return { expiredCount };
    }



    }
export const ticketService = new TicketService(
    TicketRepository,
    eventsRepository
);