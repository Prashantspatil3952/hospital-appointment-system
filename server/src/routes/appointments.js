import { Router } from "express";

import mongoose from "mongoose";

import Appointment from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";

import {
  requireAuth,
  requireAdmin,
  requirePatient
} from "../middleware/auth.js";

const router = Router();

function isValidDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "")) {
    return false;
  }

  const parsed = new Date(`${date}T00:00:00.000Z`);

  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === date
  );
}

function weekdayFromDate(date) {
  const parsed = new Date(`${date}T00:00:00.000Z`);

  return [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ][parsed.getUTCDay()];
}

function isPastDate(date) {
  const today = new Date().toISOString().slice(0, 10);

  return date < today;
}

function isDuplicateSlot(error) {
  return error?.code === 11000;
}


// Get available slots for one doctor and date
router.get(
  "/availability/:doctorId",
  async (req, res) => {
    try {
      const { date } = req.query;

      if (!isValidDate(date)) {
        return res.status(400).json({
          message: "Select a valid appointment date."
        });
      }

      if (isPastDate(date)) {
        return res.status(400).json({
          message: "You cannot book an appointment in the past."
        });
      }

      const doctor = await Doctor.findOne({
        _id: req.params.doctorId,
        isActive: true
      });

      if (!doctor) {
        return res.status(404).json({
          message: "Doctor not found or unavailable."
        });
      }

      const day = weekdayFromDate(date);

      if (!doctor.availableDays.includes(day)) {
        return res.json({
          availableSlots: [],
          bookedSlots: doctor.timeSlots,
          message: "This doctor is not available on the selected day."
        });
      }

      const bookedAppointments = await Appointment.find({
        doctor: doctor._id,
        appointmentDate: date,
        activeSlot: true
      }).select("timeSlot");

      const bookedSlots = bookedAppointments.map(
        (appointment) => appointment.timeSlot
      );

      const availableSlots = doctor.timeSlots.filter(
        (slot) => !bookedSlots.includes(slot)
      );

      res.json({
        availableSlots,
        bookedSlots
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Could not check appointment availability."
      });
    }
  }
);


// Patient: book appointment
router.post(
  "/",
  requireAuth,
  requirePatient,
  async (req, res) => {
    try {
      const {
        doctorId,
        appointmentDate,
        timeSlot,
        reason
      } = req.body;

      if (
        !mongoose.isValidObjectId(doctorId) ||
        !isValidDate(appointmentDate) ||
        !timeSlot
      ) {
        return res.status(400).json({
          message: "Please provide valid appointment details."
        });
      }

      if (isPastDate(appointmentDate)) {
        return res.status(400).json({
          message: "You cannot book an appointment in the past."
        });
      }

      const doctor = await Doctor.findOne({
        _id: doctorId,
        isActive: true
      });

      if (!doctor) {
        return res.status(404).json({
          message: "This doctor is not currently available."
        });
      }

      const day = weekdayFromDate(appointmentDate);

      if (!doctor.availableDays.includes(day)) {
        return res.status(400).json({
          message: `This doctor is not available on ${day}.`
        });
      }

      if (!doctor.timeSlots.includes(timeSlot)) {
        return res.status(400).json({
          message: "Please select a valid time slot."
        });
      }

      const appointment = await Appointment.create({
        patient: req.user._id,
        doctor: doctor._id,
        appointmentDate,
        timeSlot,
        reason: String(reason || "").trim(),
        status: "pending",
        activeSlot: true
      });

      const populatedAppointment =
        await Appointment.findById(appointment._id)
          .populate(
            "doctor",
            "name speciality qualification consultationFee hospital photoUrl"
          );

      res.status(201).json({
        message: "Appointment booked successfully. Waiting for admin confirmation.",
        appointment: populatedAppointment
      });
    } catch (error) {
      if (isDuplicateSlot(error)) {
        return res.status(409).json({
          message: "Sorry, this time slot has just been booked. Please select another slot."
        });
      }

      console.error(error);

      res.status(500).json({
        message: "Could not book appointment."
      });
    }
  }
);


// Patient: get own appointments
router.get(
  "/mine",
  requireAuth,
  requirePatient,
  async (req, res) => {
    try {
      const appointments = await Appointment.find({
        patient: req.user._id
      })
        .populate(
          "doctor",
          "name speciality qualification consultationFee hospital photoUrl"
        )
        .sort({
          appointmentDate: -1,
          createdAt: -1
        });

      res.json({ appointments });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Could not load your appointments."
      });
    }
  }
);


// Admin: get all appointments
router.get(
  "/",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const filter = {};

      if (req.query.status && req.query.status !== "all") {
        filter.status = req.query.status;
      }

      if (req.query.date) {
        if (!isValidDate(req.query.date)) {
          return res.status(400).json({
            message: "Invalid appointment date filter."
          });
        }

        filter.appointmentDate = req.query.date;
      }

      const appointments = await Appointment.find(filter)
        .populate(
          "patient",
          "name email phone"
        )
        .populate(
          "doctor",
          "name speciality consultationFee hospital"
        )
        .sort({
          appointmentDate: -1,
          createdAt: -1
        });

      res.json({ appointments });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Could not load appointments."
      });
    }
  }
);


// Patient: cancel own appointment
router.patch(
  "/:id/cancel",
  requireAuth,
  requirePatient,
  async (req, res) => {
    try {
      const appointment = await Appointment.findOne({
        _id: req.params.id,
        patient: req.user._id
      });

      if (!appointment) {
        return res.status(404).json({
          message: "Appointment not found."
        });
      }

      if (
        !["pending", "confirmed"].includes(appointment.status)
      ) {
        return res.status(400).json({
          message: "This appointment can no longer be cancelled."
        });
      }

      if (isPastDate(appointment.appointmentDate)) {
        return res.status(400).json({
          message: "Past appointments cannot be cancelled."
        });
      }

      appointment.status = "cancelled";
      appointment.activeSlot = false;

      await appointment.save();

      res.json({
        message: "Appointment cancelled successfully.",
        appointment
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Could not cancel appointment."
      });
    }
  }
);


// Admin: update appointment status
router.patch(
  "/:id/status",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const allowedStatuses = [
        "confirmed",
        "rejected",
        "completed"
      ];

      const { status } = req.body;

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid appointment status."
        });
      }

      const appointment = await Appointment.findById(
        req.params.id
      );

      if (!appointment) {
        return res.status(404).json({
          message: "Appointment not found."
        });
      }

      if (
        ["cancelled", "rejected", "completed"].includes(
          appointment.status
        )
      ) {
        return res.status(400).json({
          message: "This appointment is already closed."
        });
      }

      appointment.status = status;
      appointment.activeSlot = status === "confirmed";

      await appointment.save();

      res.json({
        message: `Appointment ${status} successfully.`,
        appointment
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Could not update appointment."
      });
    }
  }
);

export default router;