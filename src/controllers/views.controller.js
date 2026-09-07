import { servicesService } from "../services/services.service.js";
import { servicesRepository } from "../repositories/service.repository.js";
import { ServicesMongoDAO } from "../DAO-managers/mongo/services.mongo.dao.js";

import { BookingService } from "../services/bookings.services.js";
import { BookingRepository } from "../repositories/booking.repository.js";
import { BookingMongoDAO } from "../DAO-managers/mongo/booking.mongo.dao.js";


const serviceService = new servicesService(
  new servicesRepository(new ServicesMongoDAO())
);

const bookingService = new BookingService(
  new BookingRepository(new BookingMongoDAO()),
  new servicesRepository(new ServicesMongoDAO())
);

export const renderHome = async (req, res) => {
  try {
    const services = await serviceService.getAllServices();
    const bookings = await bookingService.getAllBookings();

    res.render("home", {
      services: services.map((service) => service.toObject()),
      bookings: bookings.map((booking) => booking.toObject()),
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al cargar la vista");
  }
};