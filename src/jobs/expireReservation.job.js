import mongoose from "mongoose";
import ticketRepository from "../repositories/ticket.repository.js";
import {eventsRepository} from "../repositories/events.repository.js";

export async function expireReservations() {
    const now = new Date();

    const expiredTickets= await ticketRepository.findExpiredReservations(now);

    for (const ticket of expiredTickets) {
        const session = await mongoose.startSession();

        try {
            await session.withTransaction(async () => {
                const expired = await ticketRepository.expireIfReserved(
                    ticket._id,
                    now,
                    session
                );

                if (!expired) {
                    return;
                }

                const event = await eventsRepository.releaseSeats({
                    eventId: expired.event,
                    sectorId: expired.sector,
                    quantity: expired.quantity,
                    session,
                });

                if (!event) {
                    throw new Error(`No se pudieron liberar los cupos del ticket ${expired._id}`);
                }

            });
        } catch (error) {
            console.error(`Error al expirar ticket ${ticket._id}:`, error.message               
            );
        } finally {
            await session.endSession();
        }
    }
}

export function startExpirationJob() {
    const interval= setInterval(() => {
        expireReservations().catch((error) => {
            console.error("Error en el job de expiracion de reservas:", error);
        });
    }, 60*1000);
    return interval;
}