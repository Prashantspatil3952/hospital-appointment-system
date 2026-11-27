import "dotenv/config";

import express from "express";
import cors from "cors";

import { connectDB } from "./config/db.js";

import authRoutes from "./routes/auth.js";
import doctorRoutes from "./routes/doctors.js";


const app = express();


// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173"
  })
);

app.use(
  express.json({
    limit: "20kb"
  })
);


// Server test route
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "hospital-appointment-api"
  });
});


// Authentication routes
app.use("/api/auth", authRoutes);


// Doctor routes
app.use("/api/doctors", doctorRoutes);


// Start server
const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`API running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start server:", error);

    process.exit(1);
  });