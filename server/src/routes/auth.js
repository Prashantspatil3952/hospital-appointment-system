import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { generateOtp, hashOtp } from "../utils/otp.js";
import { sendOtpEmail } from "../utils/sendOtpEmail.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const OTP_TTL_MS = 5 * 60 * 1000;
const RESEND_WAIT_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "");
}

async function issueOtp(user) {
  const otp = generateOtp();
  user.otpHash = hashOtp(otp);
  user.otpExpiresAt = new Date(Date.now() + OTP_TTL_MS);
  user.otpLastSentAt = new Date();
  user.otpAttempts = 0;
  await user.save();
  await sendOtpEmail(user.email, user.name, otp);
}

router.post("/register", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    if (name.length < 2) return res.status(400).json({ message: "Enter your full name." });
    if (!validEmail(email)) return res.status(400).json({ message: "Enter a valid email address." });
    if (password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters." });

    let user = await User.findOne({ email });
    if (user?.isEmailVerified) return res.status(409).json({ message: "An account with this email already exists." });

    const passwordHash = await bcrypt.hash(password, 12);
    if (!user) user = new User({ name, email, passwordHash, role: "patient" });
    else {
      user.name = name;
      user.passwordHash = passwordHash;
      user.role = "patient";
    }

    await issueOtp(user);
    return res.status(201).json({ message: "Verification code sent. Check your email.", email });
  } catch (error) {
    console.error(error);
    return res.status(502).json({ message: error.message || "Registration could not be completed." });
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const otp = String(req.body.otp || "").trim();
    const user = await User.findOne({ email });

    if (!user || user.isEmailVerified || !user.otpHash) {
      return res.status(400).json({ message: "No pending email verification found. Please register again." });
    }
    if (!user.otpExpiresAt || user.otpExpiresAt.getTime() < Date.now()) {
      return res.status(400).json({ message: "Code expired. Request a new OTP." });
    }
    if (user.otpAttempts >= MAX_ATTEMPTS) {
      return res.status(429).json({ message: "Too many incorrect attempts. Request a new OTP." });
    }

    user.otpAttempts += 1;
    if (hashOtp(otp) !== user.otpHash) {
      await user.save();
      return res.status(400).json({ message: "Incorrect verification code." });
    }

    user.isEmailVerified = true;
    user.otpHash = null;
    user.otpExpiresAt = null;
    user.otpAttempts = 0;
    await user.save();
    return res.json({ message: "Email verified. You can now log in." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "OTP verification failed." });
  }
});

router.post("/resend-otp", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const user = await User.findOne({ email });
    if (!user || user.isEmailVerified) return res.status(400).json({ message: "No pending verification found." });

    const waitRemaining = RESEND_WAIT_MS - (Date.now() - (user.otpLastSentAt?.getTime() || 0));
    if (waitRemaining > 0) {
      return res.status(429).json({ message: `Please wait ${Math.ceil(waitRemaining / 1000)} seconds before requesting another code.` });
    }

    await issueOtp(user);
    return res.json({ message: "A new verification code has been sent." });
  } catch (error) {
    console.error(error);
    return res.status(502).json({ message: error.message || "Could not resend OTP." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid email or password." });

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) return res.status(401).json({ message: "Invalid email or password." });
    if (!user.isEmailVerified) return res.status(403).json({ message: "Please verify your email before logging in." });

    const token = jwt.sign(
      { sub: user._id.toString(), role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );

    return res.json({
      message: "Login successful.",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Login failed." });
  }
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: { id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role } });
});

export default router;
