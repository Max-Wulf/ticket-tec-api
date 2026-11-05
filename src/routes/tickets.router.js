import { Router } from "express";
import passport from "passport";
import { getMyTickets, getTicketById, confirmTicket, cancelTicket, reserveTicket } from "../controllers/tickets.controller.js";

const router = Router();

router.use(passport.authenticate("current", { session: false }));

router.get("/my-tickets", getMyTickets);
router.get("/:ticketId", getTicketById);
router.patch("/:ticketId/confirm", confirmTicket);
router.patch("/:ticketId/cancel", cancelTicket);
router.post("/reserve", reserveTicket);

export default router;