import { app } from "./src/app.js";
import dotenv from "dotenv";
import mongoose from "mongoose";
import dns from "node:dns";
import http from "node:http";
import { Server } from "socket.io";
import { configureSocket } from "./src/sockets/socket.manager.js";  

dns.setServers(["1.1.1.1", "8.8.8.8"]);

dotenv.config();

const PORT = process.env.PORT || 3000;

await mongoose.connect(process.env.MONGODB_URI);
console.log("MongoDB conectado");

const httpServer = http.createServer(app);

const io = new Server(httpServer);

configureSocket(io);

httpServer.listen(PORT, () => {
  console.log(`Servidor funcionando en puerto ${PORT}`);
});