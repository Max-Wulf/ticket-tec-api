import { categoriesRepository } from "../repositories/category.repository.js";

export class CategoriesService {
    constructor(repository) {
        this.categoriesRepository = repository;
    }

    async create(data) {
        if (!data || typeof data.name !== "string" || !data.name.trim()) {
            const error = new Error("El nombre de la categoría es obligatorio");
            error.statusCode = 400;
            throw error;
        }

        const name = data.name.trim();

        const existingCategory = await this.categoriesRepository.getByName(name);

        if (existingCategory) {
            const error = new Error("La categoría ya existe");
            error.statusCode = 409;
            throw error;
        }

        return await this.categoriesRepository.create({ name });
    }
}

export const categoriesService = new CategoriesService(categoriesRepository);