import express from "express";
import cookieParser from "cookie-parser";
import passport from "passport";

import { logger } from "./middlewares/log.js";
import { errorHandler } from "./middlewares/error.middleware.js";

import initializePassport from "./config/passport.config.js";

import sessionRouter from "./routes/sessions.router.js";
import eventsRouter from "./routes/event.router.js";
import categoriesRouter  from "./routes/category.router.js";
import usersRouter from "./routes/users.router.js";
import ticketRouter from "./routes/tickets.router.js"



export const app = express();

// Registramos las estrategias de Passport
initializePassport();

// Middlewares generales
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);
app.use(cookieParser());

// Inicializamos Passport
app.use(passport.initialize());

// Rutas
app.use("/api/sessions", sessionRouter);
app.use("/api/events", eventsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/users",usersRouter);
app.use("/api/tickets", ticketRouter);

// Manejador global de errores
app.use(errorHandler);

export default app;
