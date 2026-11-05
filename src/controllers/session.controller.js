import { generateToken } from "../utils/jwt.utils.js";
import { currentUserDTO } from "../DTO/currentUser.dto.js";

export const logout = async (req, res) => {
    try {
        res.clearCookie("currentUser", {
            httpOnly: true, 
            sameSite: "lax", 
            secure: process.env.NODE_ENV === "production"
        });
        res.status(200).json({ message: "Sesión cerrada correctamente" });
    } catch (error) {
        res.status(500).json({ message: "Error interno del servidor" });
    }
}

export const registerResponse= (req, res) => {
    res.status(201).json({
        message: "Usuario registrado exitosamente", 
        payload: {
            id: req.user._id,
            first_name: req.user.first_name,
            last_name: req.user.last_name,
            email: req.user.email,
            role: req.user.role
        }
    });
}

export const loginResponse = (req, res) => {
    const tokenUserc = { 
        id: req.user._id,
        email: req.user.email,
        role: req.user.role
    }

    const token = generateToken(tokenUserc);

    res.cookie("currentUser", token, {
        httpOnly: true,
        maxAge: 60 * 60 * 1000,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production"
    });

    res.status(200).json({
        message: "Inicio de sesión exitoso",
    });
}

export const getCurrentUser = (req, res) => {
    const userDTO = new currentUserDTO(req.user);

    res.status(200).json({
        status: "success",
        payload: userDTO
    })
}
