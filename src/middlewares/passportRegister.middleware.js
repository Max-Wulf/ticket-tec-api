import passport from "passport";

export const passportRegister = (req, res, next) => {
  passport.authenticate(
    "register",
    { session: false },
    (err, user, info) => {
      if (err) {
        return next(err);
      }

      if (!user) {
        const message = info?.message || "Error en el registro";

        const status =
          message === "Ya existe un usuario con ese email"
            ? 409
            : 400;

        return res.status(status).json({
          status: "error",
          message
        });
      }

      req.user = user;
      return next();
    }
  )(req, res, next);
};