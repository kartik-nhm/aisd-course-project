const mongoose = require('mongoose');

const chatQueryLogSchema = new mongoose.Schema(
  {
    queryText: { type: String, required: true },
    detectedCondition: { type: String, required: true, index: true },
    pincode: { type: String, required: true, index: true },
    detectedLanguage: { type: String, default: 'English' },
    isVernacular: { type: Boolean, default: false },
    userId: { type: String, default: 'anonymous' },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

// Sliding 24-hour window queries index
chatQueryLogSchema.index({ pincode: 1, detectedCondition: 1, createdAt: -1 });

module.exports = mongoose.model('ChatQueryLog', chatQueryLogSchema);
