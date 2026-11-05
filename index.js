import "dotenv/config";
import { app } from "./src/app.js";
import mongoose from "mongoose";
import dns from "node:dns";
import http from "node:http";
import { startExpirationJob } from "./src/jobs/expireReservation.job.js";

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const PORT = process.env.PORT || 3000;

await mongoose.connect(process.env.MONGODB_URI);
console.log("MongoDB conectado");

const httpServer = http.createServer(app);

httpServer.listen(PORT, () => {
  console.log(`Servidor funcionando en puerto ${PORT}`);

  startExpirationJob();
  console.log("Job de expiración de reservas iniciado");

});
