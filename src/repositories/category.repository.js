import { CategoriesMongoDao } from "../DAO-managers/mongo/categories.mongo.dao.js";

export class CategoriesRepository {
    constructor(dao) {
        this.dao = dao;
    }

    async create(data) {
        return await this.dao.create(data);
    }

    async getByName(name) {
        return await this.dao.getByName(name);
    }

    async getById(id) {
        return await this.dao.getById(id);
    }
}

export const categoriesRepository = new CategoriesRepository(
    new CategoriesMongoDao()
);