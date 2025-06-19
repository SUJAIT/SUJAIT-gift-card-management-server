import { config } from "../config/config"
import jwt from "jsonwebtoken";

export const generateToken = (user) => {
   return jwt.sign(
    {
        email:user.email,
        role: user.role,
        id: user._id,
    },
    config.jwtSecret,
    {
        expiresIn: "30d",
    }
   )
}

export const verifyToken = (token) => {
  return jwt.verify (token, secret);
};