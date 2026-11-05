import { ticketModel } from "../../models/ticket.model.js";

class TicketsDao {

    constructor() {
        this.model = ticketModel;
    }

    async findByUserId(userId) {
        return await this.model
            .find({ user: userId })
            .populate("event", "title date location status");
    }

    async findActiveByUserAndEvent(userId, eventId, session = null) {
        return await this.model.findOne({
            user: userId,
            event: eventId,
            status: { $in: ["reserved", "sold"] }
        }).session(session);
    }

    async findExpiredReservations(now, limit = 100) {
        return await this.model.find({
            status: "reserved",
            expiresAt: { $lte: now }
        })
        .sort({ expiresAt: 1 })
        .limit(limit);
    }

    async getById(ticketId, session = null) {
        return await this.model.findById(ticketId).session(session);
    }

   async create(data, session = null) {
        const [ticket] = await this.model.create(
            [data],
            { session }
        );

        return ticket;
    }

    async update(ticketId, updateData) {
        return await this.model.findByIdAndUpdate(
            ticketId,
            { $set: updateData },
            {
                returnDocument: "after",
                runValidators: true
            }
        );
    }

    async updateStatusIfReserved(ticketId, updateData, session) {
        return await this.model.findOneAndUpdate(
            {
                _id: ticketId,
                status: "reserved"
            },
            {
                $set: updateData
            },
            {
                returnDocument: "after",
                runValidators: true,
                session
            }
        );
    }

    async expireIfReserved(ticketId, now, session = null) {
        return await this.model.findOneAndUpdate(
            {
                _id: ticketId,
                status: "reserved",
                expiresAt: { $lte: now }
            },
            {
                $set: {
                    status: "cancelled",
                    cancelledAt: now
                }
            },
            {
                returnDocument: "after",
                runValidators: true,
                session
            }
        );
    }

    async confirmIfReserved(ticketId, userId, now, session = null) {
        return await this.model.findOneAndUpdate(
            {
                _id: ticketId,
                user: userId,
                status: "reserved",
                expiresAt: { $gt: now }
            },
            {
                $set: { status: "sold" }
            },
            {
                returnDocument: "after",
                runValidators: true,
                session
            }
        );
    }

    async findByEventId(eventId) {
        return await this.model
            .find({ event: eventId })
            .populate("user", "first_name last_name email");
    }
}

export default new TicketsDao();