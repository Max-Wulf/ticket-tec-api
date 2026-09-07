import { servicesService } from "../services/services.service.js";
import { servicesRepository } from "../repositories/service.repository.js";
import { ServicesMongoDAO } from "../DAO-managers/mongo/services.mongo.dao.js";
import { createServiceSchema, updateServiceSchema, serviceQuerySchema } from "../validators/service.validator.js";

const dao = new ServicesMongoDAO();
const repository = new servicesRepository(dao);
const service = new servicesService(repository);


export const getAllServices = async (req, res) => {
  try {
    const validation = serviceQuerySchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({ status: "error", message: validation.error.issues });
    }
    const { page, limit, sort, category } = validation.data;

    const services = await service.getAllServices({
      page,
      limit,
      sort,
      category
    });

    return res.status(200).json({
      status: "success",
      payload: services
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      status: "error",
      message: "Error al obtener los servicios"
    });
  }
};

export const getServiceById = async (req, res) => {
   try{
        const {id} = req.params; // Obtener el ID del servicio de los parámetros de la solicitud
        const serviceById = await service.getServiceById(id); // Llamar al método getById del servicio para obtener el servicio por su ID

        if(!serviceById){
            return res.status(404).json({status: "error", message:`No existe un servicio con ese id ${id}`});
        }
        res.status(200).json({status: "success", payload: serviceById});// Devolver el servicio encontrado en la respuesta
        } catch (error) {
        console.error(error);

        return res.status(error.statusCode || 500).json({
            status: "error",
            message: error.message || "Error al obtener el servicio"
        });
    }
};

export const createService = async (req, res) => {
  try {
    const validation = createServiceSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        status: "error",
        message: validation.error.issues
      });
    }

    const newService = await service.createService(validation.data);

    return res.status(201).json({
      status: "success",
      payload: newService
    });

  } catch (error) {
    console.error(error);

    return res.status(error.statusCode || 500).json({
      status: "error",
      message: error.message || "Error al crear el servicio"
    });
  }
};

export const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const validation = updateServiceSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ status: "error", message: validation.error.issues });
    }
    const changes = validation.data;

    const updatedService = await service.updateService(id, changes);

    if (!updatedService) {
      return res.status(404).json({
        status: "error",
        message: `No existe un servicio con el id ${id}`
      });
    }

    return res.status(200).json({
      status: "success",
      payload: updatedService
    });

  } catch (error) {
    console.error(error);

    return res.status(error.statusCode || 500).json({
      status: "error",
      message: error.message || "Error al actualizar el servicio"
    });
  }
};

export const deleteService = async (req, res) => {
  try {
        const { id }  = req.params;   
        const deletedService = await service.deleteService(id);
        if (!deletedService) {
            return res.status(404).json({status: "error", message:`No existe un servicio con ese id ${id}`});
        }
        res.status(200).json({status: "success", payload: deletedService});
    } catch (error) {
        console.error(error);

        return res.status(error.statusCode || 500).json({
        status: "error",
        message: error.message || "Error al obtener el servicio"
        });
    }
};


export const softDeleteService = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedService = await service.softDeleteService(id);

    if (!updatedService) {
      return res.status(404).json({status: "error",message: `No existe un servicio con el id ${id}`});
    }
    return res.status(200).json({status: "success",payload: updatedService});

    } catch (error) {
    console.error(error);

    return res.status(error.statusCode || 500).json({
        status: "error",
        message: error.message || "Error al obtener el servicio"
    });
    }
};


export const getServiceByPrice = async (req, res) => {
  try {
    const { price } = req.query;

    if (price === undefined) {
      return res.status(400).json({
        status: "error",
        message: "El precio es requerido"
      });
    }

    const numericPrice = Number(price);

    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      return res.status(400).json({
        status: "error",
        message: "El precio debe ser un número válido"
      });
    }

    const services = await service.getServiceByPrice(numericPrice);

    if (services.length === 0) {
      return res.status(404).json({
        status: "error",
        message: `No existen servicios con ese precio ${numericPrice}`
      });
    }

    return res.status(200).json({
      status: "success",
      payload: services
    });

  } catch (error) {
    console.error(error);

    return res.status(error.statusCode || 500).json({
      status: "error",
      message: error.message || "Error al obtener los servicios por precio"
    });
  }
};
