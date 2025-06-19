import dotenv from "dotenv";
dotenv.config(); // must be top

export const config = {
  jwtSecret: process.env.JWT_SECRET,
};


