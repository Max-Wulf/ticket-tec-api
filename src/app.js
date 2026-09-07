import express from "express";
import handlebars from "express-handlebars";
import serviceRouter from "./routes/services.router.js";
import bookingRouter from "./routes/booking.router.js";
import viewsRouter from "./routes/views.router.js";

export const app = express();

app.engine("handlebars", handlebars.engine());
app.set("views", "./src/views");
app.set("view engine", "handlebars");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("./src/public"));

app.use("/", viewsRouter);

app.use("/api/services", serviceRouter);
app.use("/api/bookings", bookingRouter);