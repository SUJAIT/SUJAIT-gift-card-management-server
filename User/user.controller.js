import bcrypt from "bcrypt";
import userModel from "./user.model.js";
import jwt from "jsonwebtoken";
import { config } from "../App/config/config.js";


const createUser = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: "Missing email, password, or role." });
    }

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(200).json({ message: "User already exists.", user: existingUser });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await userModel.create({
      email,
      password: hashedPassword,
      role,
    });

    // ✅ Generate JWT token
    const token = jwt.sign(
      {
        email: newUser.email,
        role: newUser.role,
      },
      config.jwtSecret,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "User created.",
      token,
      user: {
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "User creation failed.", error });
  }
};
// login +++++

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required." });
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "User not found." });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Incorrect password." });
    }

    // ✅ Generate token without user._id
    const token = jwt.sign(
      {
        email: user.email,
        role: user.role,
      },
      config.jwtSecret,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error });
  }
};

// login -----


export const userController = {
  createUser,
  loginUser
};
