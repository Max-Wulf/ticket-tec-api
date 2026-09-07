import { bookingModel } from "../../models/booking.model.js";

export class BookingMongoDAO {
  async getAll() {
    return await bookingModel.find().populate("services.service");
  }

  async getById(id) {
    return await bookingModel.findById(id).populate("services.service");
  }

  async create(data) {
    return await bookingModel.create(data);
  }

  async update(id, data) {
    return await bookingModel.findByIdAndUpdate(id,data,{ new: true, runValidators: true });
  }

  async delete(id) {
    return await bookingModel.findByIdAndDelete(id);
  }

  async findByServiceDateAndTime(serviceId, date, time) {
    return await bookingModel.findOne({ "services.service": serviceId, date, time });
  }

  async findByDateAndTime(date, time) {
    return await bookingModel.findOne({ date, time });
  }
};

