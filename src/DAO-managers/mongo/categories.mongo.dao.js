import { categoryModel } from "../../models/category.model.js";

export class CategoriesMongoDao {

    async create(data) {
        return await categoryModel.create(data);
    }

   async getByName(name) {
        const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        return await categoryModel.findOne({
            name: {
                $regex: `^${escapedName}$`,
                $options: "i"
            }
        });
    }

    async getById(id) {
        return await categoryModel.findById(id);
    }
}