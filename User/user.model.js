import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },

  password: {
    type: String,
    required: true,
  },

  role: {
    type: String,
    enum: ["admin", "buyer"],
    required: true,
  },

  dues: {
    twoDollarPrevious: {
      type: Number,
      default: 0, // Admin manually reduce করলে এইখানে সেভ হবে
    },
    fiveDollarPrevious: {
      type: Number,
      default: 0,
    },
    twoDollarTotal: {
      type: Number,
      default: 0, // Claimed amount * 2$ rate
    },
    fiveDollarTotal: {
      type: Number,
      default: 0,
    }
  },

  createdAt: {
    type: Date,
    default: Date.now,
  }
});

const userModel = mongoose.model("User", userSchema);
export default userModel;
