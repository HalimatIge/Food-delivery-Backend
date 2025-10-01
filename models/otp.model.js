const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }, 
  expiresAt: { type: Date, required: true } 
});
otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 400 });

module.exports = mongoose.model("Otp", otpSchema);
