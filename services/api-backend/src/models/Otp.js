const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, lowercase: true, trim: true, unique: true },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Otp', otpSchema);
