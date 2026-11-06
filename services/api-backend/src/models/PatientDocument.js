const mongoose = require('mongoose');

const patientDocumentSchema = new mongoose.Schema(
  {
    patientPhoneNumber: { type: String, required: true, index: true },
    fileName: { type: String, required: true },
    fileType: { type: String, required: true },
    fileUrl: { type: String, required: true },
    uuid: { type: String, required: true, unique: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PatientDocument', patientDocumentSchema);
