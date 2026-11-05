import mongoose from "mongoose";
import { usersRepository } from "../repositories/user.repository.js";

export class UserService {
    constructor(repository) {
        this.userRepository = repository;
    }

    async getAll() {
        return await this.userRepository.getAll();
    }

    async getUserById(id) {

        if (!mongoose.isObjectIdOrHexString(id)) {
            const error = new Error("ID inválido");
            error.statusCode = 400;
            throw error;
        }

        const user = await this.userRepository.getById(id);

        if (!user) {
            const error = new Error("Usuario no encontrado");
            error.statusCode = 404;
            throw error;
        }

        return user;
    }

    async updateRole(userId, role, adminId) {

       
        if (!mongoose.isObjectIdOrHexString(userId)) {
            const error = new Error("ID inválido");
            error.statusCode = 400;
            throw error;
        }

   
        const validRoles = ["user", "organizer", "admin"];

        if (!validRoles.includes(role)) {
            const error = new Error("Rol inválido");
            error.statusCode = 400;
            throw error;
        }


        const user = await this.userRepository.getById(userId);

        if (!user) {
            const error = new Error("Usuario no encontrado");
            error.statusCode = 404;
            throw error;
        }

      
        if  (user._id.equals(adminId) && role !== "admin")  {
            const error = new Error("No podés quitarte tu propio rol de administrador");
            error.statusCode = 403;
            throw error;
        }

        const updatedUser = await this.userRepository.updateRole(userId, role);

        return updatedUser;
    }

    async delete(userId, adminId) {

        if (!mongoose.isObjectIdOrHexString(userId)) {
            const error = new Error("ID inválido");
            error.statusCode = 400;
            throw error;
        }

        const user = await this.userRepository.getById(userId);

        if (!user) {
            const error = new Error("Usuario no encontrado");
            error.statusCode = 404;
            throw error;
        }

        if (user._id.equals(adminId)) {
            const error = new Error("No podés podes borrar tu propia cuenta de administrador");
            error.statusCode = 403;
            throw error;
        }
        const deletedUser = await this.userRepository.delete(userId);

        return deletedUser;
    }
}
export const userService = new UserService(usersRepository);
