const mongoose = require('mongoose');

const pharmacySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, unique: true },
    phone: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true, index: true },
    address: { type: String, default: '' },
    licenseNumber: { type: String, required: true, trim: true },
    alertNotificationsEnabled: { type: Boolean, default: true },
    inventory: [
      {
        medicineName: { type: String, required: true },
        quantity: { type: Number, default: 0 },
        batchNumber: { type: String, default: '' },
        expiryDate: { type: Date },
        minimumRequired: { type: Number, default: 20 },
      },
    ],
  },
  { timestamps: true }
);

pharmacySchema.index({ pincode: 1, email: 1 });

module.exports = mongoose.model('Pharmacy', pharmacySchema);
