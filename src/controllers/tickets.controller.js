
import { ticketService } from "../services/ticket.services.js"
import { ticketDTO } from "../DTO/ticket.dto.js";

export const getMyTickets = async (req, res, next) => {
    try{
        const tickets = await ticketService.findAll(req.user._id);
        return res.status(200).json ({
            success: true,
            payload: tickets.map(ticketDTO)
        });
    }catch(error){
        next(error)
    }
};

export const getTicketById = async (req, res, next) => {
    try {
        const { ticketId } = req.params;

        const ticket = await ticketService.findById(
            req.user._id,
            ticketId
        );

        return res.status(200).json({
            success: true,
            payload: ticketDTO(ticket)
        });

    } catch (error) {
        next(error);
    }
};

export const confirmTicket = async (req , res, next) => {
    try{
        const {ticketId} = req.params;
        const userId = req.user._id;
        const ticket= await ticketService.confirm (
            userId, ticketId
        );
        return res.status(200).json ({
            success: true,
            payload: ticketDTO(ticket)
        });
    } catch (error){
        next(error)
    }
};

export const cancelTicket = async (req, res, next) => {
     try{
        const {ticketId} = req.params;
        const userId = req.user._id;
        const ticket= await ticketService.cancel (
            userId, ticketId
        );
        return res.status(200).json ({
            success: true,
            payload: ticketDTO(ticket)
        });
    } catch (error){
        next(error)
    }
};

export const reserveTicket = async (req, res, next)=> {
     try{
        const userId = req.user._id;
        const ticket= await ticketService.reserve (
            userId, req.body
        );
        return res.status(201).json ({
            success: true,
            payload: ticketDTO(ticket)
        });
    } catch (error){
        next(error)
    }
}
