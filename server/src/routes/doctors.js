import { Router } from "express";

import Doctor from "../models/Doctor.js";

import {
  requireAuth,
  requireAdmin
} from "../middleware/auth.js";

const router = Router();

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];

const DEFAULT_SLOTS = [
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM"
];

function validateDoctor(body) {
  const {
    name,
    speciality,
    qualification,
    experienceYears,
    consultationFee,
    hospital
  } = body;

  if (
    !name?.trim() ||
    !speciality?.trim() ||
    !qualification?.trim() ||
    !hospital?.trim()
  ) {
    return "Please fill all required doctor fields.";
  }

  const experience = Number(experienceYears);
  const fee = Number(consultationFee);

  if (
    !Number.isFinite(experience) ||
    experience < 0 ||
    !Number.isFinite(fee) ||
    fee < 0
  ) {
    return "Enter valid experience and consultation fee.";
  }

  const days = body.availableDays ?? DAYS.slice(0, 6);
  const slots = body.timeSlots ?? DEFAULT_SLOTS;

  if (
    !Array.isArray(days) ||
    days.length === 0 ||
    days.some((day) => !DAYS.includes(day))
  ) {
    return "Select valid available days.";
  }

  if (
    !Array.isArray(slots) ||
    slots.length === 0 ||
    slots.some(
      (slot) =>
        typeof slot !== "string" ||
        !/^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/.test(slot)
    )
  ) {
    return "Enter valid time slots, such as 09:00 AM.";
  }

  return null;
}

function doctorData(body) {
  return {
    name: body.name.trim(),
    speciality: body.speciality.trim(),
    qualification: body.qualification.trim(),
    experienceYears: Number(body.experienceYears),
    consultationFee: Number(body.consultationFee),
    hospital: body.hospital.trim(),
    photoUrl: body.photoUrl || "",
    description: body.description || "",
    availableDays: body.availableDays ?? DAYS.slice(0, 6),
    timeSlots: body.timeSlots ?? DEFAULT_SLOTS
  };
}


// Public: get active doctors
router.get("/", async (req, res) => {
  try {
    const doctors = await Doctor.find({
      isActive: true
    }).sort({ createdAt: -1 });

    res.json({ doctors });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Could not load doctors."
    });
  }
});


// Admin: get all doctors, including inactive doctors
router.get(
  "/manage/all",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const doctors = await Doctor.find().sort({
        createdAt: -1
      });

      res.json({ doctors });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Could not load doctor management list."
      });
    }
  }
);


// Admin: add doctor
router.post(
  "/",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const error = validateDoctor(req.body);

      if (error) {
        return res.status(400).json({
          message: error
        });
      }

      const doctor = await Doctor.create(
        doctorData(req.body)
      );

      res.status(201).json({
        message: "Doctor added successfully.",
        doctor
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Could not add doctor."
      });
    }
  }
);


// Admin: update doctor
router.put(
  "/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const error = validateDoctor(req.body);

      if (error) {
        return res.status(400).json({
          message: error
        });
      }

      const doctor = await Doctor.findByIdAndUpdate(
        req.params.id,
        doctorData(req.body),
        {
          new: true,
          runValidators: true
        }
      );

      if (!doctor) {
        return res.status(404).json({
          message: "Doctor not found."
        });
      }

      res.json({
        message: "Doctor updated successfully.",
        doctor
      });
    } catch (error) {
      console.error(error);

      res.status(400).json({
        message: "Could not update doctor."
      });
    }
  }
);


// Admin: activate or deactivate doctor
router.patch(
  "/:id/status",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      if (typeof req.body.isActive !== "boolean") {
        return res.status(400).json({
          message: "A valid active status is required."
        });
      }

      const doctor = await Doctor.findByIdAndUpdate(
        req.params.id,
        {
          isActive: req.body.isActive
        },
        {
          new: true
        }
      );

      if (!doctor) {
        return res.status(404).json({
          message: "Doctor not found."
        });
      }

      res.json({
        message: req.body.isActive
          ? "Doctor activated successfully."
          : "Doctor deactivated successfully.",
        doctor
      });
    } catch (error) {
      console.error(error);

      res.status(400).json({
        message: "Could not update doctor status."
      });
    }
  }
);


// Public: get one active doctor
router.get("/:id", async (req, res) => {
  try {
    const doctor = await Doctor.findOne({
      _id: req.params.id,
      isActive: true
    });

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found."
      });
    }

    res.json({ doctor });
  } catch (error) {
    res.status(400).json({
      message: "Invalid doctor ID."
    });
  }
});


// Admin: deactivate doctor
router.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const doctor = await Doctor.findByIdAndUpdate(
        req.params.id,
        {
          isActive: false
        },
        {
          new: true
        }
      );

      if (!doctor) {
        return res.status(404).json({
          message: "Doctor not found."
        });
      }

      res.json({
        message: "Doctor deactivated successfully."
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Could not deactivate doctor."
      });
    }
  }
);

export default router;