import mongoose from "mongoose";


const eventSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            required: true
        },

        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: true
        },

        date: {
            type: Date,
            required: true
        },

        location: {
            venue: {
                type: String,
                required: true,
                trim: true
            },
            address: {
                type: String,
                required: true,
                trim: true
            },
            city: {
                type: String,
                required: true,
                trim: true
            }
        },

        sectors: {
            type: [
            {
                name: {
                    type: String,
                    required: true,
                    trim: true
                },
                capacity: {
                    type: Number,
                    required: true,
                    min: 1,
                    validate: {
                        validator: Number.isInteger,
                        message: "La capacidad debe ser un numero entero"
                    }
                },
                price: {
                    type: Number,
                    required: true,
                    min: 0
                },
                available: {
                    type: Number,
                    required: true,
                    default: function() {
                        return this.capacity;
                    },  
                    min: 0,
                    validate:  [
                        {
                            validator: Number.isInteger,
                            message: "La disponibilidad debe ser un numero entero",
                        },
                        {
                            validator: function(value) {
                                return value <= this.capacity;
                            },
                            message: "La disponilidad no puede superar la capacidad"
                        }
                    ]
                }
            }
            ],
            validate: {
                validator: function(value) {
                    return Array.isArray(value) && value.length > 0;
                },
                message: "El evento debe tener al menos un sector"
            }
        },

        status: {
            type: String,
            enum: ["draft", "published", "cancelled", "finished"],
            default: "draft"
        },

        organizer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        artists: [
            {
                name: {
                    type: String,
                    required: true,
                    trim: true
                },
                role: {
                    type: String,
                    enum: ["headliner", "support"],
                    required: true
                }
            }
        ],

        genre: {
            type: String,
            trim: true
        },

        ageRestriction: {
            type: Number,
            min: 0,
            default: 0
        },

        image: {
            type: String,
            default: null,
            required: false
        },


    },

    {
        timestamps: true
    }
);

export const eventModel = mongoose.model("Event", eventSchema);
