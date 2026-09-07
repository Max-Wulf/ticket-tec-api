import mongoose from "mongoose";

export class BookingService {
  constructor(bookingRepository, serviceRepository) {
    this.bookingRepository = bookingRepository;
    this.serviceRepository = serviceRepository;
  }

  async validateExistingServices(services) {
    for (const item of services) {
      const service = await this.serviceRepository.getById(item.service);
      if (!service) {
        const error = new Error(`No existe el servicio con el id ${item.service}`);
        error.statusCode = 400;
        throw error;
      }
    }
  }

  validateBookingDateAndTime(date, time) {
    const fail = (message) => {
      const error = new Error(message);
      error.statusCode = 400;
      throw error;
    };

    // Exigimos los formatos que enviará el formulario.
    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      fail("La fecha debe tener formato YYYY-MM-DD");
    }

    if (typeof time !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
      fail("La hora debe tener formato HH:mm");
    }

    const calendarDate = new Date(`${date}T00:00:00Z`);

    // Evita fechas inexistentes, como 2026-02-30.
    if (
      Number.isNaN(calendarDate.getTime()) ||
      calendarDate.toISOString().slice(0, 10) !== date
    ) {
      fail("La fecha no es válida");
    }

    const day = calendarDate.getUTCDay();

    if (day === 0 || day === 6) {
      fail("La atención es de lunes a viernes");
    }

    const [hours, minutes] = time.split(":").map(Number);
    const startMinutes = hours * 60 + minutes;

    if (hours < 10 || hours > 17 || minutes !== 0) {
      fail("Los turnos son de una hora y comienzan de 10:00 a 17:00");
    }

    // La agenda usa la hora de Argentina, independientemente del servidor.
    const appointment = new Date(`${date}T${time}:00-03:00`);

    if (appointment.getTime() <= Date.now()) {
      fail("No se puede reservar un turno en el pasado");
    }

    return startMinutes;
  }

  async getAllBookings() {
    return this.bookingRepository.getAll();
  }

  async getBookingById(id) {
    if (!id) {
      return null;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error("El ID de la reserva no es válido");
      error.statusCode = 400;
      throw error;
    }

    const booking = await this.bookingRepository.getById(id);

    if (!booking) {
      return null;
    }

    return booking;
  }

  async createBooking(data) {
    const { clientName, services, date, time } = data;

    if (!clientName || !services || !date || !time) {
      const error = new Error(
        "clientName, services, date y time son obligatorios"
      );
      error.statusCode = 400;
      throw error;
    }

    this.validateBookingDateAndTime(date, time);

    if (!Array.isArray(services) || services.length === 0) {
      const error = new Error("Debe incluir al menos un servicio");
      error.statusCode = 400;
      throw error;
    } 


  
    for (const item of services) {
      if (!mongoose.Types.ObjectId.isValid(item.service)) {
        const error = new Error("El ID del servicio no es válido");
        error.statusCode = 400;
        throw error;
      }
    }

   
    await this.validateExistingServices(services);

    const existingBooking =
      await this.bookingRepository.findByDateAndTime(date, time);

    if (existingBooking) {
      const error = new Error("Ese turno ya se encuentra reservado");
      error.statusCode = 409;
      throw error;
    }
   

    return this.bookingRepository.create({
      clientName,
      services,
      date,
      time,
    });
  }

  async updateBooking(id, data) {
    if (!id) {
      return null;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error("El ID de la reserva no es válido");
      error.statusCode = 400;
      throw error;
    }

    const existing = await this.bookingRepository.getById(id);

    if (!existing) {
      return null;
    }

    if (data.clientName !== undefined && !data.clientName) {
      const error = new Error("El nombre del cliente no puede estar vacío");
      error.statusCode = 400;
      throw error;
    }

    if (data.services !== undefined) {
      if (!Array.isArray(data.services) || data.services.length === 0) {
        const error = new Error("Debe incluir al menos un servicio");
        error.statusCode = 400;
        throw error;
      }

      for (const item of data.services) {
        if (
          !item.service ||
          !mongoose.Types.ObjectId.isValid(item.service)
        ) {
          const error = new Error("El ID del servicio no es válido");
          error.statusCode = 400;
          throw error;
        }
      }
    }

    if (data.services !== undefined) {
      await this.validateExistingServices(data.services);
    }

    if (data.date !== undefined && !data.date) {
      const error = new Error("La fecha no puede estar vacía");
      error.statusCode = 400;
      throw error;
    }

    if (data.time !== undefined && !data.time) {
      const error = new Error("El horario no puede estar vacío");
      error.statusCode = 400;
      throw error;
    }

   
    if (data.date !== undefined || data.time !== undefined) {
      const date = data.date ?? existing.date;
      const time = data.time ?? existing.time;

      this.validateBookingDateAndTime(date, time);

      const occupiedBooking =
        await this.bookingRepository.findByDateAndTime(date, time);

      if (occupiedBooking && String(occupiedBooking._id) !== String(id)) {
        const error = new Error("Ese turno ya se encuentra reservado");
        error.statusCode = 409;
        throw error;
      }
    }

    return this.bookingRepository.update(id, data);
  }

  async deleteBooking(id) {
    if (!id) {
      return null;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error("El ID de la reserva no es válido");
      error.statusCode = 400;
      throw error;
    }

    const existing = await this.bookingRepository.getById(id);

    if (!existing) {
      return null;
    }

    return this.bookingRepository.delete(id);
  }
}
