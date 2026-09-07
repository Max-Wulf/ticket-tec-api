import mongoose from "mongoose";


export class servicesService {
  constructor(servicesRepository) {
    this.servicesRepository = servicesRepository;
  }

  async getAllServices(options={}) {
    const services = await this.servicesRepository.getAll(options);
    const availableServices = services.filter(
        service => service.availability === true
    );

    return availableServices;
  }

  async getServiceById(id) {
    if (!id) {
      throw new Error("El ID del servicio es obligatorio");
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error("El ID del servicio no es válido");
      error.statusCode = 400;
      throw error;
    }

    const service = await this.servicesRepository.getById(id);
    if (!service) {
      return null;
    }

    return service;
  }

  async createService(data) {
    const { name, duration, description, price, availability, category } = data;

    if (
      !name ||
      duration === undefined ||
      description === undefined ||
      price === undefined ||
      availability === undefined ||
      !category
    ) {
      const error  = new Error(
        "name, duration, description, price, availability y category son obligatorios"
      );
      error.statusCode = 400;
      throw error;
    }

    if (typeof price !== "number" || !Number.isFinite(price)) {
      const error = new Error("El precio debe ser un número válido");
      error.statusCode = 400;
      throw error;
    }

    if (price < 0) {
      const error= new Error("El precio no puede ser negativo");
      error.statusCode = 400;
      throw error;
    }

    if (typeof availability !== "boolean") {
        const error = new Error("La disponibilidad debe ser true o false");
        error.statusCode = 400;
        throw error;
    }

    if (typeof duration !== "number" || !Number.isFinite(duration)) {
      const error = new Error("La duración debe ser un número válido");
      error.statusCode = 400;
      throw error;
    }

    if (duration <= 0) {
      const error = new Error("La duración debe ser mayor a 0");
      error.statusCode = 400;
      throw error;
    }

    return this.servicesRepository.create({
      name,
      duration,
      description,
      price,
      availability,
      category,
    });
  }

  async updateService(id, data) {
  if (!id) {
    const error = new Error("El ID del servicio es obligatorio");
    error.statusCode = 400;
    throw error;
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error("El ID del servicio no es válido");
    error.statusCode = 400;
    throw error;
  }

  const existing = await this.servicesRepository.getById(id);

    if (!existing) {
      return null;
    }

    if (
      data.price !== undefined &&
      (typeof data.price !== "number" || !Number.isFinite(data.price))
    ) {
      const error = new Error("El precio debe ser un número válido");
      error.statusCode = 400;
      throw error;
    }

    if (data.price !== undefined && data.price < 0) {
      const error = new Error("El precio no puede ser negativo");
      error.statusCode = 400;
      throw error;
    }

    if (
      data.duration !== undefined &&
      (typeof data.duration !== "number" || !Number.isFinite(data.duration))
    ) {
      const error = new Error("La duración debe ser un número válido");
      error.statusCode = 400;
      throw error;
    }

    if (data.duration !== undefined && data.duration <= 0) {
      const error = new Error("La duración debe ser mayor a 0");
      error.statusCode = 400;
      throw error;
    }

    if (data.description !== undefined && !data.description) {
      const error = new Error("La descripción no puede estar vacía");
      error.statusCode = 400;
      throw error;
    }

    if (data.name !== undefined && !data.name) {
      const error = new Error("El nombre no puede estar vacío");
      error.statusCode = 400;
      throw error;
    }

    if (
      data.availability !== undefined &&
      typeof data.availability !== "boolean"
    ) {
      const error = new Error("La disponibilidad debe ser true o false");
      error.statusCode = 400;
      throw error;
    }

    if (data.category !== undefined && !data.category) {
      const error = new Error("La categoría no puede estar vacía");
      error.statusCode = 400;
      throw error;
    }

    return this.servicesRepository.update(id, data);
  }

  async deleteService(id) {


    if (!id) {
      const error = new Error("El ID del servicio es obligatorio");
      error.statusCode = 400;
      throw error;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error("El ID del servicio no es válido");
      error.statusCode = 400;
      throw error;
    }
    const existing = await this.servicesRepository.getById(id);

    if (!existing) {
      return null;
    }

    return this.servicesRepository.delete(id);
  }

  async softDeleteService(id) {
    
    if (!id) {
      const error = new Error("El ID del servicio es obligatorio");
      error.statusCode = 400;
      throw error;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error("El ID del servicio no es válido");
      error.statusCode = 400;
      throw error;
    }

    const existing = await this.servicesRepository.getById(id);

    if (!existing) {
        return null;
    }

    if (existing.availability === false) {
      throw new Error("El servicio ya está deshabilitado");
      error.statusCode = 409;
    throw error;
    }

    return this.servicesRepository.update(id, {
        availability: false
    });
  }
  
  async getServiceByPrice(price) {

    if (price === undefined) {
        throw new Error("El precio es requerido");
    }

    const services = await this.servicesRepository.getByPrice(price);

    return services;
  }
}