import { Router } from "express";
import passport from "passport";
import { logout, registerResponse, loginResponse, getCurrentUser, } from "../controllers/session.controller.js";
import { passportRegister } from "../middlewares/passportRegister.middleware.js";
import { authorizeRoles } from "../middlewares/auth.middleware.js";
import { getUsers } from "../controllers/users.controller.js";
const router = Router();    

router.post("/register", passportRegister, registerResponse);
router.post("/login", passport.authenticate("login", {session: false}), loginResponse);
router.post("/logout", logout); 
router.get("/current", passport.authenticate("current", {session: false}), getCurrentUser);

router.get("/users", passport.authenticate("current", {session: false}),
authorizeRoles("admin"), getUsers);


export default router;