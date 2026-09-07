import { z } from "zod";

export const createServiceSchema = z.object({
    name: z.string().min(1, "El nombre es obligatorio"),

    description: z.string().min(1, "La descripción es obligatoria"),

    duration: z.number().positive(" La duracion debe ser mayor a 0"),

    price: z.number().min(0, "El precio no puede ser negativo"),

    category:z.string().min(1, "La categoria es obligatoria"),
    
    availability: z.boolean() 

});

export const updateServiceSchema = createServiceSchema.partial().strict().refine(
    (data) => Object.keys(data).length > 0,
    { message: "Debe incluir al menos un campo para actualizar" }
);

export const serviceQuerySchema = z.object({
    page: z.string().regex(/^[1-9]\d*$/).transform(Number).pipe(z.number().int().positive()).optional(),
    limit: z.string().regex(/^[1-9]\d*$/).transform(Number).pipe(z.number().int().positive()).optional(),
    sort: z.enum(["asc", "desc"]).optional(),
    category: z.string().min(1).optional(),
});
