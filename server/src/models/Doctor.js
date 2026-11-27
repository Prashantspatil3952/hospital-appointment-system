import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    speciality: {
      type: String,
      required: true,
      trim: true
    },

    qualification: {
      type: String,
      required: true,
      trim: true
    },

    experienceYears: {
      type: Number,
      required: true,
      min: 0
    },

    consultationFee: {
      type: Number,
      required: true,
      min: 0
    },

    hospital: {
      type: String,
      required: true,
      trim: true
    },

    photoUrl: {
      type: String,
      default: ""
    },

    description: {
      type: String,
      default: ""
    },

    availableDays: {
      type: [String],
      default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    },

    timeSlots: {
      type: [String],
      default: [
        "09:00 AM",
        "10:00 AM",
        "11:00 AM",
        "12:00 PM",
        "02:00 PM",
        "03:00 PM",
        "04:00 PM",
        "05:00 PM"
      ]
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("Doctor", doctorSchema);