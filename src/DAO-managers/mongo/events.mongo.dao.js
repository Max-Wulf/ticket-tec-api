import mongoose from "mongoose";
import { eventModel } from "../../models/event.model.js";

export class eventsMongoDao {

    async create (data ) {
        return await eventModel.create(data)
    }

    async getAll(filter, sort, skip, limit) {
        const events = await eventModel
            .find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit);

        const total = await eventModel.countDocuments(filter);

        return { events, total };
    }

    async getById(id, session = null) {
        return await eventModel.findById(id).session(session);
    }

    async reserveSeats({ eventId, sectorId, quantity, session = null }) {
        const sectorObjectId = new mongoose.Types.ObjectId(sectorId);

        return await eventModel.findOneAndUpdate(
            {
                _id: eventId,
                status: "published",
                date: { $gt: new Date() },
                sectors: {
                    $elemMatch: {
                        _id: sectorObjectId,
                        available: { $gte: quantity }
                    }
                }
            },
            {
                $inc: {
                    "sectors.$.available": -quantity
                }
            },
            {
                new: true,
                runValidators: true,
                session
            }
        );
    }

    async releaseSeats({ eventId, sectorId, quantity, session = null }) {
        const sectorObjectId = new mongoose.Types.ObjectId(sectorId);

        return await eventModel.findOneAndUpdate(
            {
                _id: eventId,
                sectors: {
                    $elemMatch: {
                        _id: sectorObjectId
                    }
                },
                $expr: {
                    $gte: [
                        {
                            $let: {
                                vars: {
                                    sector: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: "$sectors",
                                                    as: "s",
                                                    cond: {
                                                        $eq: ["$$s._id", sectorObjectId]
                                                    }
                                                }
                                            },
                                            0
                                        ]
                                    }
                                },
                                in: {
                                    $subtract: [
                                        "$$sector.capacity",
                                        "$$sector.available"
                                    ]
                                }
                            }
                        },
                        quantity
                    ]
                }
            },
            {
                $inc: {
                    "sectors.$.available": quantity
                }
            },
            {
                new: true,
                session
            }
        );
    }

   async update(id, data) {
        return await eventModel.findOneAndUpdate(
            {
                _id: id,
                status: { $nin: ["cancelled", "finished"] }
            },
            { $set: data },
            { new: true, runValidators: true }
        );
    }

    async updateStatus(id, status, previousStatus) {
        return await eventModel.findOneAndUpdate(
            { _id: id, status: previousStatus },
            { $set: { status } },
            { new: true, runValidators: true }
        );
    }

    async delete (id) {
        return await eventModel.findOneAndDelete({
            _id: id,
            status: "draft"
        });

    }
}
