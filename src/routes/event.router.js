import { Router } from "express";
import passport from "passport";
import { getEvents, getEventById, createEvent, updateEvent, updateEventStatus, deleteEvent, getEventTickets } from "../controllers/events.controller.js";
import { reserveTicket } from "../controllers/tickets.controller.js";
import { authorizeRoles } from "../middlewares/auth.middleware.js";
import { authEventOwner } from "../middlewares/eventOwner.middleware.js";

const router = Router();

router.get ("/", getEvents)
router.get("/:eventId", getEventById);

router.get(
    "/:eventId/tickets",
    passport.authenticate("current", { session: false }),
    authorizeRoles("organizer", "admin"),
    authEventOwner,
    getEventTickets
);

router.post(
    "/",
    passport.authenticate("current", { session: false }),
    authorizeRoles("organizer", "admin"),
    createEvent
);

router.put(
    "/:eventId",
    passport.authenticate("current", { session: false }),
    authorizeRoles("organizer", "admin"),
    authEventOwner,
    updateEvent
);

router.patch (
    "/:eventId/status",
    passport.authenticate ("current", {session:false}),
    authorizeRoles("organizer", "admin"),
    authEventOwner,
    updateEventStatus
);


router.delete(
    "/:eventId", 
    passport.authenticate ("current", {session: false}),
    authorizeRoles ("organizer", "admin"),
    authEventOwner,
    deleteEvent
);

router.post(
    "/:eid/tickets",
    passport.authenticate("current", { session: false }),
    reserveTicket
);






export default router;