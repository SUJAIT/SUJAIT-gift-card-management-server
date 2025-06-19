import express from "express";
import { userController } from "./user.controller.js"; // ✅ Add `.js`

const user = express.Router();

user.post('/user-register', userController.createUser);
user.post('/user-login', userController.loginUser);

export default user;
