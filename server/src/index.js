import "dotenv/config";

import express from "express";
import cors from "cors";

import { connectDB } from "./config/db.js";

import authRoutes from "./routes/auth.js";
import doctorRoutes from "./routes/doctors.js";
import appointmentRoutes from "./routes/appointments.js";
import userRoutes from "./routes/users.js";
import adminRoutes from "./routes/admin.js";


const app = express();


// Required environment settings
if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is missing in server/.env");
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is missing in server/.env");
  process.exit(1);
}


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


// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "hospital-appointment-api"
  });
});


// API routes
app.use("/api/auth", authRoutes);

app.use("/api/doctors", doctorRoutes);

app.use("/api/appointments", appointmentRoutes);

app.use("/api/users", userRoutes);

app.use("/api/admin", adminRoutes);


// Unknown route
app.use((req, res) => {
  res.status(404).json({
    message: "API route not found."
  });
});


// General error handler
app.use((error, req, res, next) => {
  console.error(error);

  res.status(500).json({
    message: "Internal server error."
  });
});


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