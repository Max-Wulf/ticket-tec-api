import { userService } from "../services/users.services.js";
import { currentUserDTO } from "../DTO/currentUser.dto.js";

export const getUsers = async (req, res, next) => {
    try {
        const users = await userService.getAll();

        const userDTO = users.map(
            user => new currentUserDTO(user)
        );

        return res.status(200).json({
            status: "success",
            payload: userDTO
        });
    } catch (error) {
        next(error);
    }
};

export const getUserById = async (req, res, next) => {
    try {
        const user = await userService.getUserById(req.params.userId);

        return res.status(200).json({
            status: "success",
            payload: new currentUserDTO(user)
        });
    } catch (error) {
        next(error);
    }
};

export const userRole = async (req, res, next) => {
    try {
        const user = await userService.updateRole(
            req.params.userId,
            req.body.role,
            req.user._id
        );

        return res.status(200).json({
            status: "success",
            message: "Rol asignado correctamente",
            payload: new currentUserDTO(user)
        });
    } catch (error) {
        next(error);
    }
};

export const deleteUser = async (req, res, next) => {
    try {
        const user = await userService.delete(req.params.userId, req.user._id);

        return res.status(200).json({ status: "success", message: "Usuario eliminado correctamente"});
    } catch (error) {
        next(error);
    }
};
