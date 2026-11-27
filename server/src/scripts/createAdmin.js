import "dotenv/config";

import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import { connectDB } from "../config/db.js";

import User from "../models/User.js";


async function createAdmin() {
  try {

    // Read admin details from .env
    const name = process.env.ADMIN_NAME;

    const email = process.env.ADMIN_EMAIL
      ?.trim()
      .toLowerCase();

    const password = process.env.ADMIN_PASSWORD;


    // Check required values
    if (!name || !email || !password) {
      throw new Error(
        "Please add ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD to your server/.env file."
      );
    }

    if (password.length < 10) {
      throw new Error(
        "Admin password must contain at least 10 characters."
      );
    }


    // Connect to MongoDB
    await connectDB();


    // Hash the admin password
    const passwordHash = await bcrypt.hash(
      password,
      12
    );


    // Check whether admin email already exists
    let admin = await User.findOne({ email });


    if (admin) {

      // Update the existing account
      admin.name = name;
      admin.passwordHash = passwordHash;
      admin.role = "admin";

    } else {

      // Create a new admin account
      admin = new User({
        name,
        email,
        passwordHash,
        role: "admin"
      });

    }


    // Admin does not need registration OTP
    admin.isEmailVerified = true;

    admin.otpHash = null;
    admin.otpExpiresAt = null;
    admin.otpLastSentAt = null;
    admin.otpAttempts = 0;


    await admin.save();


    console.log("--------------------------------");
    console.log("Admin account created successfully!");
    console.log("Admin email:", email);
    console.log("--------------------------------");

  } catch (error) {

    console.error("Admin creation failed:", error);

    process.exitCode = 1;

  } finally {

    await mongoose.disconnect();

  }
}


createAdmin();