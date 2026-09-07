import { Router } from 'express';
import {getAllBookings, getBookingById, createBooking, updateBooking, deleteBooking} from '../controllers/booking.controller.js';

const router = Router();    

router.get('/', getAllBookings); //este endpoint nos trae todas las reservas
router.get('/:id', getBookingById); //este endpoint nos trae una reserva por su id
router.post('/', createBooking); //este endpoint nos permite crear una nueva reserva
router.put('/:id', updateBooking);//este endpoint nos permte actualizar una reserva
router.delete("/:id",deleteBooking) //este endpoint nos permite eleiminar una reserva

export default router