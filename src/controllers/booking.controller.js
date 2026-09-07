import { BookingService } from "../services/bookings.services.js";
import { BookingRepository } from "../repositories/booking.repository.js";
import { BookingMongoDAO } from "../DAO-managers/mongo/booking.mongo.dao.js";
import { getIO } from "../sockets/socket.manager.js";
import { createBookingSchema, updateBookingSchema } from "../validators/booking.validator.js";
import { servicesRepository } from "../repositories/service.repository.js";
import { ServicesMongoDAO } from "../DAO-managers/mongo/services.mongo.dao.js";

const dao = new BookingMongoDAO();
const repository = new BookingRepository(dao);
const booking = new BookingService(repository, new servicesRepository(new ServicesMongoDAO()));


export const getAllBookings = async (req, res) => {
  try {
    const bookings = await booking.getAllBookings();

    return res.status(200).json({status: "success",payload: bookings});

    } catch (error) {
        return res.status(500).json({status: "error",message: "Error al obtener las reservas"});
    }
};

export const getBookingById = async (req, res) => {
    try{
        const { id }= req.params;
        const bookingById = await booking.getBookingById(id);
            if(!bookingById){
                return res.status(404).json({status:"error", message: `No existe esa reserva con ese id ${id}`});
            }
            return res.status(200).json({status: "success", payload: bookingById});
        } catch (error) {
          return res.status(error.statusCode || 500).json({
          status: "error",
          message: error.message || "Error al buscar la reserva"
        });
    }
};

export const createBooking = async (req, res) => {
    try {
        const validation = createBookingSchema.safeParse(req.body);

        if(!validation.success){
          return res.status(400).json({status: "error", message: validation.error.issues});
        }

        const newBooking = await booking.createBooking(validation.data);

        const io = getIO();
        if (io) {
          io.emit("bookingCreated", newBooking);
        }

        return res.status(201).json({status: "success",payload: newBooking});

    } catch (error) {
      return res.status(error.statusCode || 500).json({
        status: "error",
        message: error.message || "Error al crear la reserva"
      });
    }
};

export const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const validation = updateBookingSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ status: "error", message: validation.error.issues });
    }
    const changes = validation.data;

    const updatedBooking = await booking.updateBooking(id, changes);

    if (!updatedBooking) {
      return res.status(404).json({status: "error", message: `No existe una reserva con el id ${id}`});
    }
    return res.status(200).json({status: "success", payload: updatedBooking});
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      status: "error",
      message: error.message || "Error al actualizar la reserva"
    });
  }
};

export const deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedBooking = await booking.deleteBooking(id);
    if (!deletedBooking) {
      return res.status(404).json({status: "error",message: `No existe una reserva con el id ${id}`});
    }

    return res.status(200).json({ status: "success", payload: deletedBooking});

  } catch (error) {
    return res.status(error.statusCode || 500).json({
      status: "error",
      message: error.message || "Error al borrar la reserva"
    });
  }
};
