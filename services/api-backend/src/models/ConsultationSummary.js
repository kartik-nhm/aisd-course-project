const mongoose = require('mongoose');

const consultationSummarySchema = new mongoose.Schema(
  {
    context: { type: String, default: '' },
    patient_phonenumber: { type: String, required: true, index: true },
    doctor_email_id: { type: String, required: true, index: true },
    meetingUuid: { type: String, default: '' },
    triage: {
      severity: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
      rationale: { type: String, default: '' },
      recommendedUrgencyHours: { type: Number, default: 24 },
    },
    summary_data: {
      symptoms: { type: [String], default: [] },
      diagnosis: { type: [String], default: [] },
      prescription: [
        {
          medicine: { type: String, default: '' },
          dosage: { type: String, default: '' },
          frequency: { type: String, default: '' },
          duration: { type: String, default: '' },
          instructions: { type: String, default: '' },
        },
      ],
      vitals: {
        bloodPressure: { type: String, default: '' },
        pulse: { type: String, default: '' },
        temperature: { type: String, default: '' },
        spo2: { type: String, default: '' },
      },
      lifestyle_advice: { type: [String], default: [] },
      tests_recommended: { type: [String], default: [] },
      follow_up_plan: { type: [String], default: [] },
    },
    datetime: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

consultationSummarySchema.index({ patient_phonenumber: 1, datetime: -1 });
consultationSummarySchema.index({ doctor_email_id: 1, datetime: -1 });
consultationSummarySchema.index({ 'triage.severity': 1 });

module.exports = mongoose.model('ConsultationSummary', consultationSummarySchema);
