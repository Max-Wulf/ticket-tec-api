export const errorHandler = (err, req, res, next) => {
  if (err.code === 11000) {
    return res.status(409).json({
      status: "error",
      message: "Ya existe un registro con esos datos"
    });
  }

  if (err.name === "ValidationError" || err.name === "CastError") {
    return res.status(400).json({ status: "error", message: err.message });
  }

  if (Number.isInteger(err.statusCode) && err.statusCode >= 400 && err.statusCode < 500) {
    return res.status(err.statusCode).json({ status: "error", message: err.message });
  }

  console.error(err);

  return res.status(500).json({
    status: "error",
    message: "Error interno del servidor"
  });
};
