import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    passwordHash: {
      type: String,
      required: true
    },

    role: {
      type: String,
      enum: ["patient", "admin"],
      default: "patient"
    },

    isEmailVerified: {
      type: Boolean,
      default: false
    },

    otpHash: {
      type: String,
      default: null
    },

    otpExpiresAt: {
      type: Date,
      default: null
    },

    otpLastSentAt: {
      type: Date,
      default: null
    },

    otpAttempts: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("User", userSchema);