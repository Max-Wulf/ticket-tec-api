import bcrypt from "bcrypt";
import  { userModel } from "../models/user.model.js";

export const register = async (req, res) => {
    try {
        const { first_name, last_name, email, password } = req.body;

        if (!first_name || !last_name || !email || !password) {
            return res.status(400).json({
                message: "Todos los campos son requeridos"
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const userExists = await userModel.findOne({
            email: normalizedEmail
        });

        if (userExists) {
            return res.status(409).json({
                message: "Ya existe un usuario con ese email"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await userModel.create({
            first_name,
            last_name,
            email: normalizedEmail,
            password: hashedPassword,
            role: "user"
        });

        return res.status(201).json({
            message: "Usuario registrado exitosamente",
            payload: {
                id: newUser._id,
                first_name: newUser.first_name,
                last_name: newUser.last_name,
                email: newUser.email,
                role: newUser.role
            }
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor"
        });
    }
};