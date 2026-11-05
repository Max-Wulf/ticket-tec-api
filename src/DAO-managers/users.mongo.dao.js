import { userModel } from "../models/user.model.js"

export class usersMongoDao {
    constructor() {
        this.model = userModel;
    }

    async getAll() {
        return await this.model.find();
    }

    async getById(id) {
        return await this.model.findById(id);
    }

    async updateRole(id, role) {
        return await this.model.findByIdAndUpdate(
            id,
            { role },
            { new: true, runValidators: true }
        );
    }

    async delete(id) {
        return await this.model.findByIdAndDelete(id);
    }
}