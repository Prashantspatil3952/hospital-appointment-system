import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";

    const token = header.startsWith("Bearer ")
      ? header.substring(7)
      : null;

    if (!token) {
      return res.status(401).json({
        message: "Please log in first."
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.sub).select(
      "-passwordHash -otpHash"
    );

    if (!user || !user.isEmailVerified) {
      return res.status(401).json({
        message: "Your session is invalid. Please log in again."
      });
    }

    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Session expired. Please log in again."
    });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      message: "Admin access required."
    });
  }

  next();
}

export function requirePatient(req, res, next) {
  if (!req.user || req.user.role !== "patient") {
    return res.status(403).json({
      message: "Patient access required."
    });
  }

  next();
}