import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
    {
        name: {
        type: String,
        required: true,
        },

        description: {
        type: String,
        required: true
        },

        duration: {
        type: Number,
        required: true
        },

        price: {
        type: Number,
        required: true
        },

        category: {
        type: String,
        required: true
        },

        availability: {
        type: Boolean,
        required: true
        },
    

    },
    {
        timestamps: true
    }
);

export const serviceModel= mongoose.model('services', serviceSchema);