import { usersMongoDao } from "../DAO-managers/users.mongo.dao.js";

export class UserRepository {
    constructor(dao) {
        this.dao = dao;
    }

    async getAll() {
        return await this.dao.getAll();
    }

    async getById(id) {
        return await this.dao.getById(id);
    }

    async getByEmail(email) {
        return await this.dao.getByEmail(email);
    }

    async create(userData) {
        return await this.dao.create(userData);
    }

    async updateRole(id, role) {
        return await this.dao.updateRole(id, role);
    }

    async delete(id) {
        return await this.dao.delete(id);
    }
}

export const usersRepository = new UserRepository(new usersMongoDao());