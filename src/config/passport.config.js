import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import {Strategy as JwtStrategy} from "passport-jwt";
import { userModel } from "../models/user.model.js";
import { hashPassword, isValidPassword } from "../utils/password.utils.js";

const initializePassport = () => {

    passport.use(
        "register",
        new LocalStrategy(
            {
                usernameField: "email",
                passReqToCallback: true
            },
            async (req, email, password, done) => {
                try {
                    const { first_name, last_name } = req.body;

                    if (
                        typeof first_name !== "string" || !first_name.trim() ||
                        typeof last_name !== "string" || !last_name.trim()
                    ) { 
                        return done(null, false, {
                            message: "El nombre y apellido deben ser validos"
                        });
                    }

                    if (!email || !password) {
                        return done(null, false, {
                            message: "Todos los campos son requeridos"
                        });
                    }

                    if (typeof email !== "string" ||  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
                        return done(null, false, {
                            message: "El email debe ser valido"
                        });
                    }
                    const normalizedEmail = email.toLowerCase().trim();

                    const userExists = await userModel.findOne({
                        email: normalizedEmail
                    });

                    if (userExists) {
                        return done(null, false, {
                            message: "Ya existe un usuario con ese email"
                        });
                    }

                    if (typeof password !== "string" || password.length < 6) {
                        return done(null, false, {
                            message: "La contraseña debe tener al menos 6 caracteres"
                        });
                    }

                    const hashedPassword = await hashPassword(password);

                    const newUser = await userModel.create({
                        first_name,
                        last_name,
                        email: normalizedEmail,
                        password: hashedPassword,
                        role: "user"
                    });

                    return done(null, newUser);

                } catch (error) {
                    return done(error);
                }
            }
        )
    );

    passport.use(
        "login",
        new LocalStrategy(
            {
                usernameField: "email"
            },
            async (email, password, done) => {
                try {
                    if (
                        typeof email !== "string" || !email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
                        typeof password !== "string" || !password
                    ) {
                        return done(null, false, {
                            message: "Email y contraseña deben ser válidos"
                        });
                    }

                    const normalizedEmail = email.toLowerCase().trim();

                    const user = await userModel.findOne({
                        email: normalizedEmail
                    });

                    if (!user) {
                        return done(null, false, {
                            message: "Usuario no encontrado"
                        });
                    }

                    const validPassword = await isValidPassword(password, user.password);

                    if (!validPassword) {
                        return done(null, false, {
                            message: "Credenciales invalidas"
                        });
                    }

                    return done(null, user);

                } catch (error) {
                    return done(error);
                }
            }
        )
    );

    const cookieExtractor = (req) => {
        let token= null;

        if (req && req.cookies) {
            token =req.cookies.currentUser;
        }

        return token;
    }

    passport.use(
        "current",
        new JwtStrategy(
            {
                jwtFromRequest: cookieExtractor,
                secretOrKey: process.env.JWT_SECRET           
            },
            async (jwtPayload, done) => {
                try {
                    const user= await userModel.findById(jwtPayload.id);

                    if (!user) {
                        return done(null, false, {
                            message: "Usuario no encontrado"
                        });
                    }

                    return done(null, user);
                } catch (error) {
                    return done(error);
                }
            }
        )
    )
}

export default initializePassport;
