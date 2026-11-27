import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true
    },

    appointmentDate: {
      type: String,
      required: true
    },

    timeSlot: {
      type: String,
      required: true
    },

    reason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ""
    },

    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "cancelled",
        "rejected",
        "completed"
      ],
      default: "pending"
    },

    // Only active appointments reserve a doctor/time slot.
    activeSlot: {
      type: Boolean,
      default: true,
      select: false
    }
  },
  {
    timestamps: true
  }
);

// Prevent two active appointments from using the same slot.
appointmentSchema.index(
  {
    doctor: 1,
    appointmentDate: 1,
    timeSlot: 1
  },
  {
    unique: true,
    partialFilterExpression: {
      activeSlot: true
    }
  }
);

appointmentSchema.index({
  patient: 1,
  createdAt: -1
});

appointmentSchema.index({
  appointmentDate: 1,
  status: 1
});

export default mongoose.model("Appointment", appointmentSchema);