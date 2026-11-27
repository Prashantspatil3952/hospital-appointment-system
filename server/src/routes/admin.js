import { Router } from "express";

import User from "../models/User.js";
import Doctor from "../models/Doctor.js";
import Appointment from "../models/Appointment.js";

import {
  requireAuth,
  requireAdmin
} from "../middleware/auth.js";

const router = Router();

router.use(requireAuth, requireAdmin);


// Dashboard statistics
router.get("/stats", async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const [
      totalPatients,
      totalDoctors,
      activeDoctors,
      totalAppointments,
      pendingAppointments,
      confirmedAppointments,
      upcomingAppointments
    ] = await Promise.all([
      User.countDocuments({ role: "patient" }),

      Doctor.countDocuments(),

      Doctor.countDocuments({ isActive: true }),

      Appointment.countDocuments(),

      Appointment.countDocuments({
        status: "pending"
      }),

      Appointment.countDocuments({
        status: "confirmed"
      }),

      Appointment.countDocuments({
        appointmentDate: { $gte: today },
        status: { $in: ["pending", "confirmed"] }
      })
    ]);

    res.json({
      stats: {
        totalPatients,
        totalDoctors,
        activeDoctors,
        totalAppointments,
        pendingAppointments,
        confirmedAppointments,
        upcomingAppointments
      }
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Could not load dashboard statistics."
    });
  }
});


// Get and search patients
router.get("/patients", async (req, res) => {
  try {
    const search = String(
      req.query.search || ""
    ).trim();

    const filter = {
      role: "patient"
    };

    if (search) {
      const safeSearch = search.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      filter.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { email: { $regex: safeSearch, $options: "i" } },
        { phone: { $regex: safeSearch, $options: "i" } }
      ];
    }

    const patients = await User.find(filter)
      .select("name email phone address isEmailVerified createdAt")
      .sort({ createdAt: -1 })
      .limit(200);

    res.json({ patients });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Could not load patients."
    });
  }
});

export default router;