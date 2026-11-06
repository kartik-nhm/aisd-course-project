const mongoose = require('mongoose');

const doctorProfileSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    name: { type: String, required: true, trim: true },
    specialty: { type: String, default: 'General Medicine' },
    regNumber: { type: String, default: 'MCI-REG' },
    clinicName: { type: String, default: 'Smart Telehealth Clinic' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DoctorProfile', doctorProfileSchema);
