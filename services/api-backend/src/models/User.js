const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phone: { type: String, required: true, trim: true },
    role: { type: String, required: true, enum: ['01', '02', '03'], trim: true }, // 01: Patient, 02: Doctor, 03: Pharmacist
  },
  { timestamps: true }
);

userSchema.index({ email: 1, role: 1 }, { unique: true });
userSchema.index({ phone: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);
