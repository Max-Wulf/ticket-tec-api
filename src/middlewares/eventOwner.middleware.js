import { eventsService } from "../services/events.services.js";

export const authEventOwner = async (req, res, next) => {
    try {
        const { eventId } = req.params;
        const event = await eventsService.getById(eventId);

        const isAdmin = req.user.role === "admin";
        const isOwner =
            event.organizer.toString() === req.user._id.toString();

        if (!isAdmin && !isOwner) {
            return res.status(403).json({
                message: "No tenés los permisos necesarios para realizar esta acción"
            });
        }

        req.event = event;
        next();

    } catch (error) {
        next(error);
    }
};