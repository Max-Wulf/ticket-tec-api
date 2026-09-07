import { serviceModel } from "../../models/services.model.js";


export class ServicesMongoDAO {
    async getAll(options = {}) {
        const { page = 1, limit = 10, sort, category } = options;

        const filter = {
            availability: true
        };

        if (category) {
            filter.category = category;
        }

        const query = serviceModel.find(filter);

        if (sort === "asc") {
            query.sort({ price: 1 });
        }

        if (sort === "desc") {
            query.sort({ price: -1 });
        }

        const pageNumber = Number(page);
        const limitNumber = Number(limit);

        query
            .skip((pageNumber - 1) * limitNumber)
            .limit(limitNumber);

        return await query;
    }

    async getById (id){
        return await serviceModel.findById(id);
    }

    async create (data){
        return await serviceModel.create(data);
    }

    async update(id, data){
        return await serviceModel.findByIdAndUpdate(id, data, { new: true, runValidators: true});
    }

    async delete (id) {
        return await serviceModel.findByIdAndDelete(id);
    }

    async getByPrice(price) {
        return await serviceModel.find({ price });
    }

   

}