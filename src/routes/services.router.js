import { Router } from "express";
import {getAllServices, getServiceById, createService, updateService, deleteService, softDeleteService, getServiceByPrice } from '../controllers/service.controller.js';

const router = Router();

router.get('/', getAllServices); //este endpoint nos trae todos los servicios 
router.get("/price", getServiceByPrice); //este endpoint nos trae un servicio por su precio
router.get('/:id', getServiceById); //este endpoint nos trae un servicio por su id
router.post('/', createService); //este endpoint nos permite crear un nuevo servicio
router.put('/:id', updateService); //este endpoint nos permite actualizar un servicio existente
router.delete('/:id', deleteService); //este endpoint nos permite eliminar un servicio
router.patch("/:id/soft-delete", softDeleteService); //este endpoint nos permite "eliminar" el servicio sacando su disponibilidad

export default router;