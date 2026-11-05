import { categoriesService } from "../services/category.services.js";

export const createCategory = async (req, res, next) => {
    try {
        const category = await categoriesService.create(req.body);

        return res.status(201).json({
            status: "success",
            payload: category
        });
    } catch (error) {
        next(error);
    }
};