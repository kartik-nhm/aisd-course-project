const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, unique: true },
    age: { type: String, default: '' },
    gender: { type: String, default: '' },
    bloodType: { type: String, default: '' },
    allergies: { type: String, default: '' },
    pincode: { type: String, default: '', index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Patient', patientSchema);
