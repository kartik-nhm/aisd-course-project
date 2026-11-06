const mongoose = require('mongoose');

const pharmacyAlertSchema = new mongoose.Schema(
  {
    alertId: { type: String, required: true, unique: true },
    pincode: { type: String, required: true, index: true },
    condition: { type: String, required: true, index: true },
    queryCount: { type: Number, required: true },
    threshold: { type: Number, default: 5 },
    severity: { type: String, enum: ['ELEVATED_SURGE', 'CRITICAL_SURGE'], default: 'ELEVATED_SURGE' },
    recommendedMedicines: { type: [String], default: [] },
    status: { type: String, enum: ['ACTIVE', 'RESOLVED', 'ACKNOWLEDGED'], default: 'ACTIVE' },
    dispatchedToCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

pharmacyAlertSchema.index({ pincode: 1, createdAt: -1 });

module.exports = mongoose.model('PharmacyAlert', pharmacyAlertSchema);
