import TicketsDAO from "../DAO-managers/mongo/tickets.mongo.dao.js";


class TicketRepository {
    constructor(ticketsDAO) {
        this.ticketsDAO = ticketsDAO;
    }

    async findByUserId(userId) {
        return await this.ticketsDAO.findByUserId(userId);
    }

    async findActiveByUserAndEvent(userId, eventId, session = null) {
        return await this.ticketsDAO.findActiveByUserAndEvent(
            userId,
            eventId,
            session
        );
    }

    async findExpiredReservations(now, limit = 100) {
        return await this.ticketsDAO.findExpiredReservations(
            now,
            limit
        );
    }

    async getById(ticketId, session = null) {
        return await this.ticketsDAO.getById(ticketId, session);
    }

    async create(ticketData, session = null) {
        return await this.ticketsDAO.create(ticketData, session);
    }

    async update(ticketId, updateData) {
        return await this.ticketsDAO.update(ticketId, updateData);
    }

    async updateStatusIfReserved(ticketId, updateData, session) {
        return await this.ticketsDAO.updateStatusIfReserved(
            ticketId,
            updateData,
            session
        );
    }

    async expireIfReserved(ticketId, now, session = null) {
        return await this.ticketsDAO.expireIfReserved(
            ticketId,
            now,
            session
        );
    }

    async confirmIfReserved(ticketId, userId, now, session = null) {
        return await this.ticketsDAO.confirmIfReserved(
            ticketId,
            userId,
            now,
            session
        );
    }
    
    async findByEventId(eventId) {
    return await this.ticketsDAO.findByEventId(eventId);
}
}

export default new TicketRepository(TicketsDAO);