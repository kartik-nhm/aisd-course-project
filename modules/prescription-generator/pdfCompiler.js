/**
 * Module 3: Automated Prescription & Clinical Records
 * File: pdfCompiler.js
 * 
 * Generates clean, high-contrast, professional medical prescriptions and consultation summaries using jsPDF.
 */

const { sanitizePrescriptionItems } = require('./dosageParser');

/**
 * Builds a standardized PDF document for prescriptions.
 * Compatible with both client-side (import 'jspdf') and server-side environments.
 * 
 * @param {object} jsPDF - jsPDF constructor
 * @param {object} consultation - Structured consultation data
 * @returns {object} Compiled jsPDF document instance
 */
function compilePrescriptionPDF(jsPDF, consultation) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = margin;

  const doctor = consultation.doctor || {
    name: 'Dr. Jane Smith, MD',
    specialty: 'General Medicine & Telehealth',
    regNumber: 'MCI-894721',
    clinicName: 'Smart Telehealth Virtual Clinic',
  };

  const patient = consultation.patient || {
    name: 'John Doe',
    age: '34',
    gender: 'Male',
    phone: '+91 9876543210',
    bloodType: 'O+',
    allergies: ['Penicillin'],
  };

  const clinical = consultation.clinicalData || {};
  const medications = sanitizePrescriptionItems(clinical.prescription);

  // Helper for text wrapping
  const printWrapped = (text, x, y, maxW, size = 10, style = 'normal', color = [15, 23, 42]) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', style);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(String(text || ''), maxW);
    doc.text(lines, x, y);
    return y + lines.length * (size * 0.42);
  };

  const checkPageBreak = (neededHeight) => {
    if (cursorY + neededHeight > pageHeight - margin) {
      doc.addPage();
      cursorY = margin;
      return true;
    }
    return false;
  };

  // 1. Clinic Header
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(margin, cursorY, contentWidth, 22, 'F');

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(doctor.clinicName.toUpperCase(), margin + 6, cursorY + 9);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text('Smart Remote Clinical Care & Digital Prescription System', margin + 6, cursorY + 16);

  cursorY += 28;

  // 2. Doctor Info & Visit Date (Side-by-Side)
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(doctor.name, margin, cursorY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`${doctor.specialty} | Reg: ${doctor.regNumber}`, margin, cursorY + 5);

  const dateStr = `Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(dateStr, pageWidth - margin - doc.getTextWidth(dateStr), cursorY);

  cursorY += 12;

  // Divider Line
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, cursorY, pageWidth - margin, cursorY);
  cursorY += 6;

  // 3. Patient Demographic Card
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.roundedRect(margin, cursorY, contentWidth, 24, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, cursorY, contentWidth, 24, 2, 2, 'D');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Patient: ${patient.name}`, margin + 5, cursorY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Age: ${patient.age || 'N/A'} | Gender: ${patient.gender || 'N/A'} | Blood: ${patient.bloodType || 'N/A'} | Phone: ${patient.phone}`, margin + 5, cursorY + 14);

  const allergiesText = Array.isArray(patient.allergies) && patient.allergies.length > 0 ? patient.allergies.join(', ') : 'No known allergies reported';
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 38, 38); // Crimson Red for Allergies
  doc.text(`Allergies: ${allergiesText}`, margin + 5, cursorY + 20);

  cursorY += 30;

  // 4. Vitals Summary Bar (if available)
  const vitals = clinical.vitals || {};
  if (vitals.bloodPressure || vitals.pulse || vitals.temperature || vitals.spo2) {
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, cursorY, contentWidth, 10, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);

    const vitalsStr = `VITALS: BP: ${vitals.bloodPressure || '--'} | Pulse: ${vitals.pulse || '--'} bpm | Temp: ${vitals.temperature || '--'} | SpO2: ${vitals.spo2 || '--'}%`;
    doc.text(vitalsStr, margin + 5, cursorY + 6.5);
    cursorY += 15;
  }

  // 5. Clinical Diagnosis & Chief Complaints
  if (clinical.diagnosis && clinical.diagnosis.length > 0) {
    cursorY = printWrapped('PROVISIONAL DIAGNOSIS:', margin, cursorY, contentWidth, 10, 'bold', [15, 23, 42]);
    cursorY += 1;
    for (const d of clinical.diagnosis) {
      cursorY = printWrapped(`• ${d}`, margin + 4, cursorY, contentWidth - 4, 9, 'normal', [51, 65, 85]);
      cursorY += 1;
    }
    cursorY += 4;
  }

  // 6. Formal Prescription (Rx) Table
  cursorY = printWrapped('Rx - PRESCRIBED MEDICATIONS', margin, cursorY, contentWidth, 11, 'bold', [29, 78, 216]); // Royal Blue
  cursorY += 3;

  // Table Header
  doc.setFillColor(224, 231, 255); // Indigo 100
  doc.rect(margin, cursorY, contentWidth, 7, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);

  doc.text('#', margin + 3, cursorY + 5);
  doc.text('Medicine & Dosage', margin + 12, cursorY + 5);
  doc.text('Frequency', margin + 75, cursorY + 5);
  doc.text('Duration', margin + 120, cursorY + 5);
  doc.text('Instructions', margin + 145, cursorY + 5);

  cursorY += 8;

  // Table Rows
  if (medications.length === 0) {
    cursorY = printWrapped('No prescription medications recorded for this session.', margin + 3, cursorY + 4, contentWidth, 9, 'italic', [100, 116, 139]);
    cursorY += 6;
  } else {
    for (const med of medications) {
      checkPageBreak(14);
      doc.setFillColor(med.id % 2 === 0 ? 248 : 255, med.id % 2 === 0 ? 250 : 255, med.id % 2 === 0 ? 252 : 255);
      doc.rect(margin, cursorY - 1, contentWidth, 9, 'F');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);

      doc.text(String(med.id), margin + 3, cursorY + 4);
      doc.setFont('helvetica', 'bold');
      doc.text(`${med.medicine} (${med.dosage})`, margin + 12, cursorY + 4);

      doc.setFont('helvetica', 'normal');
      doc.text(med.frequency, margin + 75, cursorY + 4);
      doc.text(med.duration, margin + 120, cursorY + 4);
      doc.text(med.instructions || 'With food', margin + 145, cursorY + 4);

      cursorY += 10;
    }
  }

  cursorY += 6;

  // 7. Lifestyle Advice & Follow-Up Plan
  if (clinical.lifestyle_advice && clinical.lifestyle_advice.length > 0) {
    checkPageBreak(20);
    cursorY = printWrapped('ADVICE & DIETARY GUIDELINES:', margin, cursorY, contentWidth, 9, 'bold', [15, 23, 42]);
    cursorY += 1;
    for (const adv of clinical.lifestyle_advice) {
      cursorY = printWrapped(`• ${adv}`, margin + 4, cursorY, contentWidth - 4, 8.5, 'normal', [71, 85, 105]);
      cursorY += 1;
    }
    cursorY += 4;
  }

  if (clinical.follow_up_plan && clinical.follow_up_plan.length > 0) {
    checkPageBreak(15);
    cursorY = printWrapped('FOLLOW-UP INSTRUCTIONS:', margin, cursorY, contentWidth, 9, 'bold', [15, 23, 42]);
    cursorY += 1;
    for (const plan of clinical.follow_up_plan) {
      cursorY = printWrapped(`• ${plan}`, margin + 4, cursorY, contentWidth - 4, 8.5, 'normal', [71, 85, 105]);
      cursorY += 1;
    }
    cursorY += 6;
  }

  // 8. Doctor Signoff & Footer
  checkPageBreak(30);
  const signoffY = pageHeight - margin - 22;
  doc.setDrawColor(203, 213, 225);
  doc.line(pageWidth - margin - 50, signoffY, pageWidth - margin, signoffY);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(doctor.name, pageWidth - margin - 50, signoffY + 4);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Digitally Verified Prescriber', pageWidth - margin - 50, signoffY + 8);

  // Legal Disclaimer Footer
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('This digital prescription was generated electronically via the Smart Telehealth Platform in compliance with telemedicine regulations.', margin, pageHeight - margin);

  return doc;
}

module.exports = {
  compilePrescriptionPDF,
};
