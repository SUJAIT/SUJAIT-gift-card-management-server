import mongoose from "mongoose";

const giftCardSchema = new mongoose.Schema({
code: {
  type: String,
  required: true,
  unique: true,
  trim: true,
  uppercase: true,
},

  amount: {
    type: Number,
    enum: [2, 5],
    required: true,
  },
  rate: {
    type: Number,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  isClaimed: {
    type: Boolean,
    default: false,
  },
  claimedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  claimedAt: {
    type: Date,
    default: null,
  },
});

// 💡 Pre-save hook to set rate based on amount
giftCardSchema.pre("save", function (next) {
  if (this.amount === 2) {
    this.rate = 200;
  } else if (this.amount === 5) {
    this.rate = 515;
  }
  next();
});

const GiftCard = mongoose.model("GiftCard", giftCardSchema);

export default GiftCard;
