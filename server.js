import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import router from "./routes/routes.js";
import connectDB from "./App/config/db.js";

dotenv.config();
const app = express();
connectDB();

app.use(cors());
app.use(express.json());

// Routes
app.use('/',router)

app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});

