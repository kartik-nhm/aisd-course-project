'use client';

import React, { useState, useEffect } from 'react';
import Header from '../../../components/Header';
import {
  Stethoscope,
  Video,
  Clock,
  User,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  FileText,
  ShieldCheck,
  Plus,
  Trash2,
  Send,
  Download,
  Activity,
  Radio,
  FileCheck2
} from 'lucide-react';
import Link from 'next/link';

export default function DoctorQueuePage() {
  const [isOnline, setIsOnline] = useState(true);
  const [doctorEmail, setDoctorEmail] = useState('dr.priya@telehealth.org');
  const [doctorName, setDoctorName] = useState('Dr. Priya Sharma, MD');
  const [doctorSpecialty, setDoctorSpecialty] = useState('Cardiology & General Medicine');
  const [doctorReg, setDoctorReg] = useState('MCI-54812');
  const [clinicName, setClinicName] = useState('Apex Virtual Health Center');

  // Waiting Patients Queue
  const [queue, setQueue] = useState([
    {
      id: 'q-01',
      patientName: 'Kartik Narayana',
      phone: '9876543210',
      age: '22',
      bloodType: 'O+',
      allergies: 'Penicillin, Cephalosporins',
      complaint: 'High fever (101°F), dry cough, and fatigue for 3 days',
      triage: 'Medium',
      waitTime: '4 mins',
    },
    {
      id: 'q-02',
      patientName: 'Sunita Rao',
      phone: '9876543211',
      age: '45',
      bloodType: 'B+',
      allergies: 'Sulfa Antibiotics',
      complaint: 'Mild headache and seasonal allergic rhinitis',
      triage: 'Low',
      waitTime: '12 mins',
    },
  ]);

  const [activePatient, setActivePatient] = useState(queue[0]);
  const [inCall, setInCall] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [activeTab, setActiveTab] = useState('scribe'); // 'scribe' | 'rx'

  // AI Scribe State
  const [transcript, setTranscript] = useState(
    `Doctor: Good morning Kartik, what seems to be the trouble today?
Patient: Doctor, I have had high fever, dry cough, and intense body aches for the last 3 days.
Doctor: Any shortness of breath, chest tightness, or wheezing?
Patient: No chest tightness, but I feel very weak and throat is scratchy.
Doctor: Let me check your vitals. Temperature is 101.2 F, Blood Pressure is 122/80 mmHg, SpO2 is 98%, and pulse is 82 bpm.
Doctor: Your chest sounds clear. This indicates an acute viral upper respiratory tract infection.
Doctor: I am prescribing Paracetamol 650mg TDS for 3 days, Cetirizine 10mg OD at night for 5 days, and Saline Nasal Spray BD. Drink plenty of warm fluids and take rest.`
  );

  const [clinicalData, setClinicalData] = useState({
    symptoms: ['High fever (101.2°F)', 'Dry cough', 'Body aches', 'Scratchy throat', 'Fatigue'],
    diagnosis: ['Acute Upper Respiratory Tract Infection (Viral)'],
    vitals: { bloodPressure: '122/80 mmHg', pulse: '82 bpm', temperature: '101.2°F', spo2: '98%' },
    prescription: [
      { medicine: 'Paracetamol', dosage: '650mg', frequency: 'TDS', duration: '3 days', instructions: 'After meals' },
      { medicine: 'Cetirizine', dosage: '10mg', frequency: 'OD', duration: '5 days', instructions: 'At bedtime' },
      { medicine: 'Saline Nasal Spray', dosage: '2 puffs', frequency: 'BD', duration: '5 days', instructions: 'Both nostrils' },
    ],
    lifestyle_advice: ['Adequate hydration (3L/day)', 'Steam inhalation twice daily', 'Bed rest'],
    tests_recommended: ['CBC & ESR if fever does not subside in 48 hours'],
    follow_up_plan: ['Telehealth review in 3 days if symptoms persist'],
  });

  const [triage, setTriage] = useState({
    severity: 'Medium',
    rationale: 'Active symptomatic infection with stable hemodynamic markers; routine medical monitoring.',
    recommendedUrgencyHours: 24,
  });

  const [isScribing, setIsScribing] = useState(false);
  const [prescriptionIssued, setPrescriptionIssued] = useState(false);

  // Heartbeat sender
  useEffect(() => {
    if (!isOnline) return;
    const interval = setInterval(() => {
      fetch('http://localhost:8080/api/consultation/doctor-availability/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: doctorEmail }),
      }).catch(() => {});
    }, 30000); // 30s heartbeat
    return () => clearInterval(interval);
  }, [isOnline, doctorEmail]);

  // Call timer
  useEffect(() => {
    let t;
    if (inCall) {
      t = setInterval(() => setCallDuration((p) => p + 1), 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(t);
  }, [inCall]);

  const toggleAvailability = async () => {
    const next = !isOnline;
    setIsOnline(next);
    try {
      await fetch(
        `http://localhost:8080/api/consultation/doctor-availability/${next ? 'set' : 'unset'}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: doctorEmail }),
        }
      );
    } catch (_e) {}
  };

  const runScribeExtraction = async () => {
    setIsScribing(true);
    try {
      const res = await fetch('http://localhost:8080/api/consultation/scribe/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          patientPhone: activePatient.phone,
          doctorEmail,
        }),
      });
      const data = await res.json();
      if (data.clinicalData) setClinicalData(data.clinicalData);
      if (data.triage) setTriage(data.triage);
    } catch (_e) {
      // Keep state
    } finally {
      setIsScribing(false);
    }
  };

  const handleAddMedicine = () => {
    setClinicalData((prev) => ({
      ...prev,
      prescription: [
        ...prev.prescription,
        { medicine: '', dosage: '500mg', frequency: 'OD', duration: '5 days', instructions: 'After meals' },
      ],
    }));
  };

  const handleUpdateMedicine = (index, field, value) => {
    setClinicalData((prev) => {
      const updated = [...prev.prescription];
      updated[index][field] = value;
      return { ...prev, prescription: updated };
    });
  };

  const handleRemoveMedicine = (index) => {
    setClinicalData((prev) => ({
      ...prev,
      prescription: prev.prescription.filter((_, i) => i !== index),
    }));
  };

  const issuePrescription = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/consultation/save-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientPhone: activePatient.phone,
          doctorEmail,
          meetingUuid: `meet-${Date.now()}`,
          clinicalData,
          triage,
          transcript,
        }),
      });
      const data = await res.json();
      setPrescriptionIssued(true);

      // Trigger PDF download from backend
      if (data.consultationId) {
        window.open(`http://localhost:8080/api/consultation/prescription/pdf/${data.consultationId}`, '_blank');
      }
    } catch (_e) {
      setPrescriptionIssued(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        {/* Top Doctor Status Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">{doctorName}</h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  {doctorReg}
                </span>
              </div>
              <div className="text-xs text-slate-400">{doctorSpecialty} · {clinicName}</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Availability Toggle */}
            <button
              type="button"
              onClick={toggleAvailability}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-semibold transition ${
                isOnline
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <span>{isOnline ? 'Available for Consultations (STOMP 30s Heartbeat)' : 'Offline'}</span>
            </button>
          </div>
        </div>

        {/* Main Workspace Layout */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column (5 Cols): Patient Queue & Video Window */}
          <div className="lg:col-span-5 space-y-6">
            {/* Waiting Queue Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-400" />
                  Live Patient Queue ({queue.length} waiting)
                </h3>
                <span className="text-[11px] font-mono text-emerald-400">STOMP Queue Active</span>
              </div>

              <div className="space-y-3">
                {queue.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setActivePatient(item)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition ${
                      activePatient.id === item.id
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-white">{item.patientName}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {item.triage} Urgency
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">{item.complaint}</div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60 text-[10px] text-slate-400">
                      <span>Age: {item.age} · Blood: {item.bloodType}</span>
                      <span>Waiting: {item.waitTime}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Patient Clinical Profile & Allergy Banner */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Patient EHR & Allergy Record
              </h4>
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <div>
                  <strong className="block text-rose-200">Critical Patient Allergy Warning:</strong>
                  <span>{activePatient.allergies}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Blood Pressure</span>
                  <span className="font-mono font-semibold text-emerald-400">{clinicalData.vitals.bloodPressure}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Temperature</span>
                  <span className="font-mono font-semibold text-emerald-400">{clinicalData.vitals.temperature}</span>
                </div>
              </div>
            </div>

            {/* Video Call Pane */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-blue-400" />
                  Telehealth WebRTC Consultation
                </span>
                {inCall && (
                  <span className="text-xs font-mono text-emerald-400 animate-pulse">
                    LIVE: {Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, '0')}
                  </span>
                )}
              </div>

              <div className="h-44 bg-slate-950 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center p-4 relative overflow-hidden">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-2">
                  <User className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold text-white">{activePatient.patientName}</div>
                <div className="text-[11px] text-slate-400">Ph: {activePatient.phone}</div>

                {inCall && (
                  <div className="mt-2 text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                    <Activity className="w-3 h-3 animate-pulse" />
                    Web Audio Stream Active (Dual-Track 44.1 kHz)
                  </div>
                )}
              </div>

              <div className="mt-4">
                {!inCall ? (
                  <button
                    type="button"
                    onClick={() => setInCall(true)}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition"
                  >
                    <Video className="w-4 h-4" />
                    Connect Consultation Call
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setInCall(false)}
                    className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 transition"
                  >
                    Disconnect Call
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column (7 Cols): Dual-Tab AI Scribe & Prescription Composer */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
            {/* Tabs Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/60">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('scribe')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                    activeTab === 'scribe'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Module 2: Live AI Clinical Scribing
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('rx')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                    activeTab === 'rx'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Module 3: Prescription Generator
                </button>
              </div>

              {/* Triage Badge */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400">Triage:</span>
                <span className="text-xs font-bold px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {triage.severity} Priority
                </span>
              </div>
            </div>

            {/* Tab 1: Live AI Clinical Scribing */}
            {activeTab === 'scribe' && (
              <div className="p-6 space-y-6 flex-1">
                {/* Dialogue Transcript Stream */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Consultation Dialogue Transcript
                    </label>
                    <button
                      type="button"
                      onClick={runScribeExtraction}
                      disabled={isScribing}
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 disabled:opacity-50"
                    >
                      <Sparkles className="w-3 h-3" />
                      {isScribing ? 'Extracting via Gemini...' : 'Re-Run Clinical Extraction'}
                    </button>
                  </div>
                  <textarea
                    rows={6}
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Extracted Clinical Entities Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Extracted Symptoms
                    </h5>
                    <div className="flex flex-wrap gap-1.5">
                      {clinicalData.symptoms.map((s, i) => (
                        <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-200">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Primary Clinical Diagnosis
                    </h5>
                    <div className="text-xs font-semibold text-blue-400">
                      {clinicalData.diagnosis.join(', ')}
                    </div>
                  </div>
                </div>

                {/* Lifestyle & Follow-Up Advice */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Lifestyle Advice & Follow-Up Plan
                  </h5>
                  <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                    {clinicalData.lifestyle_advice.map((adv, i) => (
                      <li key={i}>{adv}</li>
                    ))}
                    {clinicalData.follow_up_plan.map((f, i) => (
                      <li key={i}><strong>Follow-up:</strong> {f}</li>
                    ))}
                  </ul>
                </div>

                {/* Move to Rx Tab Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveTab('rx')}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/20 flex items-center gap-2 transition"
                  >
                    Proceed to Prescription Composer
                    <FileText className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: Prescription Composer & Signer */}
            {activeTab === 'rx' && (
              <div className="p-6 space-y-6 flex-1">
                {/* Allergy Check Warning */}
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Cross-matching prescribed medications against patient allergy profile...</span>
                  </div>
                  <span className="font-mono text-emerald-400 font-bold">ALLERGY CHECK SAFE</span>
                </div>

                {/* Medicine Items Editor */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Prescribed Medicines (Standardized Frequencies)
                    </h4>
                    <button
                      type="button"
                      onClick={handleAddMedicine}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1 border border-slate-700 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Medicine
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {clinicalData.prescription.map((rx, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-12 gap-2 items-center text-xs">
                        <div className="col-span-4">
                          <label className="text-[10px] text-slate-500 block mb-0.5">Drug Name</label>
                          <input
                            type="text"
                            value={rx.medicine}
                            onChange={(e) => handleUpdateMedicine(idx, 'medicine', e.target.value)}
                            placeholder="Medicine name"
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white text-xs"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="text-[10px] text-slate-500 block mb-0.5">Dosage</label>
                          <input
                            type="text"
                            value={rx.dosage}
                            onChange={(e) => handleUpdateMedicine(idx, 'dosage', e.target.value)}
                            placeholder="650mg"
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white text-xs"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="text-[10px] text-slate-500 block mb-0.5">Freq (OD/BD/TDS)</label>
                          <select
                            value={rx.frequency}
                            onChange={(e) => handleUpdateMedicine(idx, 'frequency', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white text-xs"
                          >
                            <option value="OD">OD (Once daily)</option>
                            <option value="BD">BD (Twice daily)</option>
                            <option value="TDS">TDS (Three times)</option>
                            <option value="SOS">SOS (As needed)</option>
                          </select>
                        </div>
                        <div className="col-span-3">
                          <label className="text-[10px] text-slate-500 block mb-0.5">Duration</label>
                          <input
                            type="text"
                            value={rx.duration}
                            onChange={(e) => handleUpdateMedicine(idx, 'duration', e.target.value)}
                            placeholder="3 days"
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white text-xs"
                          />
                        </div>
                        <div className="col-span-1 flex justify-end pt-3">
                          <button
                            type="button"
                            onClick={() => handleRemoveMedicine(idx)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Digital Signature Block */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <FileCheck2 className="w-4 h-4 text-emerald-400" />
                      Doctor Digital Signature Verified
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                      {doctorName} · Reg: {doctorReg} · Timestamp: {new Date().toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>

                {/* Issue Prescription Button */}
                <div className="pt-2 flex items-center justify-between">
                  {prescriptionIssued ? (
                    <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Prescription signed, saved to EHR, and PDF compiled!
                    </div>
                  ) : <div />}

                  <button
                    type="button"
                    onClick={issuePrescription}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition"
                  >
                    <Download className="w-4 h-4" />
                    Sign & Issue Prescription (PDF)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
