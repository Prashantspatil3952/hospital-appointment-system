import { Router } from "express";

import bcrypt from "bcryptjs";

import { requireAuth } from "../middleware/auth.js";

const router = Router();


// Get current user profile
router.get(
  "/me",
  requireAuth,
  (req, res) => {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        phone: req.user.phone || "",
        address: req.user.address || ""
      }
    });
  }
);


// Update current user profile
router.patch(
  "/me",
  requireAuth,
  async (req, res) => {
    try {
      const name = String(req.body.name || "").trim();
      const phone = String(req.body.phone || "").trim();
      const address = String(req.body.address || "").trim();

      if (name.length < 2) {
        return res.status(400).json({
          message: "Name must contain at least 2 characters."
        });
      }

      if (phone && !/^[0-9+\-\s()]{7,20}$/.test(phone)) {
        return res.status(400).json({
          message: "Enter a valid phone number."
        });
      }

      if (address.length > 300) {
        return res.status(400).json({
          message: "Address must be under 300 characters."
        });
      }

      req.user.name = name;
      req.user.phone = phone;
      req.user.address = address;

      await req.user.save();

      res.json({
        message: "Profile updated successfully.",
        user: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
          phone: req.user.phone,
          address: req.user.address
        }
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Could not update profile."
      });
    }
  }
);


// Change password
router.patch(
  "/me/password",
  requireAuth,
  async (req, res) => {
    try {
      const currentPassword = String(
        req.body.currentPassword || ""
      );

      const newPassword = String(
        req.body.newPassword || ""
      );

      if (newPassword.length < 8) {
        return res.status(400).json({
          message: "New password must contain at least 8 characters."
        });
      }

      const matches = await bcrypt.compare(
        currentPassword,
        req.user.passwordHash
      );

      if (!matches) {
        return res.status(400).json({
          message: "Your current password is incorrect."
        });
      }

      req.user.passwordHash = await bcrypt.hash(
        newPassword,
        12
      );

      await req.user.save();

      res.json({
        message: "Password changed successfully. Please log in again."
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Could not change password."
      });
    }
  }
);

export default router;