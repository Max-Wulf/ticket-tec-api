import { Router } from "express";
import passport from "passport";
import { authorizeRoles } from "../middlewares/auth.middleware.js";
import {createCategory} from "../controllers/category.controller.js"

const router = Router ();

router.post(
    "/",
    passport.authenticate("current", { session: false }),
    authorizeRoles("admin"),
    createCategory
);

export default router