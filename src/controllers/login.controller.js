import { userModel } from "../models/user.model.js";
import { generateToken } from "../utils/jwt.utils.js";
import { isValidPassword } from "../utils/password.utils.js";

export const login = async (req, res) =>{
    try{
        const { email, password} =req.body 

        if (!email || !password) {
            return res.status(400).json({ message: "El email y la contraseña son obligatorios " });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const user = await userModel.findOne ({email: normalizedEmail})

        if (!user) {
            return res.status (401).json({ message: "Credeciales inválidas" });
        }

        const validPassword = await isValidPassword (password, user.password)

        if (!validPassword) {
            return res.status(401).json({ message: "Credeciales inválidas" });
        }

        const tokenUser = {
            id : user._id,
            email: user.email,
            role: user.role
        }

        const token = generateToken(tokenUser)
        res.cookie ("currentUser", token, {
            httpOnly: true,
            maxAge: 60 * 60 * 1000,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production"
        }),

        res.status(200).json({
            message: "Inicio de sesión exitoso", token
        })
    }catch (error) {
        res.status(500).json({
            message: "Error interno del servidor"
        })
    }
}



















