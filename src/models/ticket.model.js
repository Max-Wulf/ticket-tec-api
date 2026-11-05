import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        event: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event",
            required: true
        },

        sector: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },

        quantity: {
            type: Number,
            required: true,
            min: 1,
            validate: {
                validator: Number.isInteger,
                message: "La cantidad debe ser un número entero"
            }
        },

        status: {
            type: String,
            enum: ["reserved", "sold", "cancelled"],
            default: "reserved"
        },

        reservationCode: {
            type: String,
            required: true,
            unique: true
        },

        expiresAt: {
            type: Date,
            required: true
        },

        cancelledAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

ticketSchema.index(
    { user: 1, event: 1 },
    {
        unique: true,
        partialFilterExpression: {
            status: { $in: ["reserved", "sold"] }
        }
    }
);

export const ticketModel = mongoose.model("Ticket", ticketSchema);