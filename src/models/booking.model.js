import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
    {

        clientName: {
            type: String,
            required: true
        },

        services: [
        {
            service: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "services",
            required: true
            },

            quantity: {
            type: Number,
            required: true,
            min: 1,
            max: 1,
            default: 1
            }
        }
        ],

        date: {
            type: String,
            required: true
        },

        time: {
            type: String,
            required: true
        }
    },

    {
        timestamps: true
    }
);

export const bookingModel= mongoose.model('bookings', bookingSchema)