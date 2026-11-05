import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        first_name:{
            type: String,
            required: true,
            trim: true 
        },
        last_name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
            minlength: 6
        },
        role: {
            type: String,
            enum: ["user", "admin", "organizer"],
            default: "user"
        }

    },
    { 
        timestamps: true 
    }
    
)

export const userModel = mongoose.model("User", userSchema);