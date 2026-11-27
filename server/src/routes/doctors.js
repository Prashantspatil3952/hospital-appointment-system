import { Router } from "express";

import Doctor from "../models/Doctor.js";

import {
  requireAuth,
  requireAdmin
} from "../middleware/auth.js";

const router = Router();


// Get all active doctors
// Patients can also access this API
router.get("/", async (req, res) => {
  try {
    const doctors = await Doctor.find({
      isActive: true
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      doctors
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Could not load doctors."
    });
  }
});


// Get one doctor by ID
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

    res.json({
      success: true,
      doctor
    });

  } catch (error) {
    res.status(400).json({
      message: "Invalid doctor ID."
    });
  }
});


// Add a new doctor
// Admin only
router.post(
  "/",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const {
        name,
        speciality,
        qualification,
        experienceYears,
        consultationFee,
        hospital,
        photoUrl,
        description
      } = req.body;

      if (
        !name ||
        !speciality ||
        !qualification ||
        !hospital
      ) {
        return res.status(400).json({
          message: "Please fill all required fields."
        });
      }

      const experience = Number(experienceYears);
      const fee = Number(consultationFee);

      if (
        !Number.isFinite(experience) ||
        experience < 0 ||
        !Number.isFinite(fee) ||
        fee < 0
      ) {
        return res.status(400).json({
          message: "Enter valid experience and consultation fee."
        });
      }

      const doctor = await Doctor.create({
        name,
        speciality,
        qualification,
        experienceYears: experience,
        consultationFee: fee,
        hospital,
        photoUrl: photoUrl || "",
        description: description || ""
      });

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


// Update doctor information
// Admin only
router.put(
  "/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const {
        name,
        speciality,
        qualification,
        experienceYears,
        consultationFee,
        hospital,
        photoUrl,
        description
      } = req.body;

      if (
        !name ||
        !speciality ||
        !qualification ||
        !hospital
      ) {
        return res.status(400).json({
          message: "Please fill all required fields."
        });
      }

      const experience = Number(experienceYears);
      const fee = Number(consultationFee);

      if (
        !Number.isFinite(experience) ||
        experience < 0 ||
        !Number.isFinite(fee) ||
        fee < 0
      ) {
        return res.status(400).json({
          message: "Enter valid experience and consultation fee."
        });
      }

      const doctor = await Doctor.findOne({
        _id: req.params.id,
        isActive: true
      });

      if (!doctor) {
        return res.status(404).json({
          message: "Doctor not found."
        });
      }

      doctor.name = name;
      doctor.speciality = speciality;
      doctor.qualification = qualification;
      doctor.experienceYears = experience;
      doctor.consultationFee = fee;
      doctor.hospital = hospital;
      doctor.photoUrl = photoUrl || "";
      doctor.description = description || "";

      await doctor.save();

      res.json({
        message: "Doctor updated successfully.",
        doctor
      });

    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Could not update doctor."
      });
    }
  }
);


// Deactivate doctor
// Admin only
router.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
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

      // We deactivate instead of permanently deleting.
      doctor.isActive = false;

      await doctor.save();

      res.json({
        message: "Doctor removed successfully."
      });

    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Could not remove doctor."
      });
    }
  }
);

export default router;