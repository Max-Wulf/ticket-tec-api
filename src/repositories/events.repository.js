import { eventsMongoDao } from "../DAO-managers/mongo/events.mongo.dao.js";


export class EventsRepository {
    constructor(dao) {
        this.dao = dao;
    }

    async create(data) {
        return await this.dao.create(data);
    }

    async getAll(filter, sort, skip, limit) {
        return await this.dao.getAll(filter, sort, skip, limit);
    }

    async getById(id, session = null) {
        return await this.dao.getById(id, session);
    }

    async reserveSeats({ eventId, sectorId, quantity, session = null }) {
        return await this.dao.reserveSeats({ 
            eventId, 
            sectorId, 
            quantity,
            session
        });
    }

    async releaseSeats({ eventId, sectorId, quantity, session = null }) {
        return await this.dao.releaseSeats({
            eventId,
            sectorId,
            quantity,
            session
        });
    }



    async update(id, data) {
        return await this.dao.update(id, data);
    }

    async updateStatus(id, status, previousStatus) {
        return await this.dao.updateStatus(id, status, previousStatus);
    }

    async delete(id) {
        return await this.dao.delete(id);
    }
}

export const eventsRepository = new EventsRepository(new eventsMongoDao());
