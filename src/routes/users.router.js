import { Router } from "express";
import passport from "passport";
import { authorizeRoles } from "../middlewares/auth.middleware.js"
import { getUsers, getUserById, userRole, deleteUser} from "../controllers/users.controller.js"


const router = Router();

router.get ( "/", 
    passport.authenticate("current", { session: false }),
    authorizeRoles("admin"),
    getUsers
);

router.get("/:userId", 
    passport.authenticate("current", { session: false }),
    authorizeRoles("admin"),
    getUserById
);

router.patch("/:userId/role",
    passport.authenticate("current", { session: false }),
    authorizeRoles("admin"),
    userRole
);

router.delete("/:userId",
    passport.authenticate("current", { session: false }),
    authorizeRoles("admin"),
    deleteUser
);

export default router
