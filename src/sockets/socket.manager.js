// guarda la instancia en ioinstance y registra que hacer cuando un navegador se conecta o desconecta y getIO permite obtenerla despues de emitir los eventos desde el backend


let ioInstance;

export const configureSocket = (io) => {
  ioInstance = io;

  io.on("connection", (socket) => {
    console.log("Cliente conectado:", socket.id);

    socket.on("disconnect", () => {
      console.log("Cliente desconectado:", socket.id);
    });
  });
};

export const getIO = () => {
  return ioInstance;
};