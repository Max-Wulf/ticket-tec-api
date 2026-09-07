import { z } from "zod";

export const createBookingSchema = z.object({
  clientName: z.string().trim().min(1, "El nombre es obligatorio"),

  services: z.array(
    z.object({
      service: z.string().regex(
        /^[a-fA-F0-9]{24}$/,
        "El ID del servicio no es válido"
      ),
      quantity: z.literal(1),
    })
  ).min(1, "Debe incluir al menos un servicio"),

  date: z.string().refine((value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return false;
    }

    const date = new Date(`${value}T00:00:00Z`);

    return (
      !Number.isNaN(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
    );
  }, {
    message: "Debe ser una fecha válida con formato YYYY-MM-DD",
  }),

  time: z.string().regex(
    /^([01]\d|2[0-3]):[0-5]\d$/,
    "La hora debe tener formato HH:mm"
  ),
});

export const updateBookingSchema = createBookingSchema.partial().strict().refine(
  (data) => Object.keys(data).length > 0,
  { message: "Debe incluir al menos un campo para actualizar" }
);
