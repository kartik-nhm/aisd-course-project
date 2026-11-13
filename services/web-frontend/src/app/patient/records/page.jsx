'use client';

import React, { useState, useEffect } from 'react';
import Header from '../../../components/Header';
import {
  FileText,
  Download,
  AlertTriangle,
  User,
  Calendar,
  Stethoscope,
  Activity,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building2
} from 'lucide-react';
import Link from 'next/link';

export default function PatientRecordsPage() {
  const [phone, setPhone] = useState('9876543210');
  const [patient, setPatient] = useState({
    name: 'Kartik Narayana',
    phone: '9876543210',
    age: '22',
    gender: 'Male',
    bloodType: 'O+',
    allergies: 'Penicillin, Cephalosporins',
    pincode: '560001',
  });

  const [history, setHistory] = useState([
    {
      _id: 'consult-demo-001',
      meetingUuid: 'meet-demo-101',
      doctorName: 'Dr. Priya Sharma, MD',
      doctorSpecialty: 'Cardiology & General Medicine',
      datetime: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      summary_data: {
        diagnosis: ['Acute Upper Respiratory Tract Infection (Viral)'],
        symptoms: ['High fever (100.8 F)', 'Dry cough', 'Body aches', 'Scratchy throat', 'Fatigue'],
        vitals: { bloodPressure: '118/76 mmHg', pulse: '78 bpm', spo2: '98%', temperature: '100.8°F' },
        prescription: [
          { drug: 'Paracetamol', dosage: '650mg', frequency: 'TDS (Three times daily)', duration: '3 days', instructions: 'After meals' },
          { drug: 'Cetirizine', dosage: '10mg', frequency: 'OD (Once daily)', duration: '5 days', instructions: 'At bedtime' },
          { drug: 'Saline Nasal Spray', dosage: '2 puffs', frequency: 'BD (Twice daily)', duration: '5 days', instructions: 'Both nostrils' },
        ],
        lifestyle_advice: ['Steam inhalation twice daily', 'Adequate fluid hydration (3L/day)', 'Complete bed rest'],
        follow_up_plan: ['Virtual follow-up in 3 days if symptoms persist'],
      },
      triage: {
        severity: 'Low',
        rationale: 'Stable respiratory vitals (SpO2 98%) with localized upper respiratory symptoms',
        recommendedUrgencyHours: 48,
      },
    },
  ]);

  const [loading, setLoading] = useState(false);

  // Load records from backend
  useEffect(() => {
    fetch(`http://localhost:8080/api/consultation/records/${phone}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.patient) setPatient(data.patient);
        if (data.history && data.history.length > 0) {
          setHistory(data.history);
        }
      })
      .catch(() => {});
  }, [phone]);

  const downloadPdf = (consultationId) => {
    window.open(`http://localhost:8080/api/consultation/prescription/pdf/${consultationId}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-6 border-b border-slate-800 gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Patient Electronic Health Records
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Longitudinal consultation summaries, clinical vital history, and instant printable signed PDF prescription records.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/patient/consultation"
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-sm flex items-center gap-1.5 transition"
            >
              <Stethoscope className="w-3.5 h-3.5" />
              New Telehealth Consultation
            </Link>
          </div>
        </div>

        {/* Patient Profile & Safety Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-500/10">
                <User className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  {patient.name}
                  <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    Ph: {patient.phone}
                  </span>
                </h2>
                <div className="text-xs text-slate-400 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                  <span>Age: <strong>{patient.age}</strong></span>
                  <span>Gender: <strong>{patient.gender}</strong></span>
                  <span>Blood Type: <strong>{patient.bloodType}</strong></span>
                  <span>Region Pincode: <strong>{patient.pincode}</strong></span>
                </div>
              </div>
            </div>

            {/* Allergy Warning Pill */}
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3 max-w-md">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <strong className="block text-rose-200">Patient Recorded Drug Allergies:</strong>
                <span>{patient.allergies}</span>
              </div>
            </div>
          </div>

          {/* Vitals Baseline Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Latest BP</span>
              <span className="font-mono text-sm font-bold text-emerald-400">118/76 mmHg</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Pulse</span>
              <span className="font-mono text-sm font-bold text-emerald-400">78 bpm</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">SpO2 Oxygen</span>
              <span className="font-mono text-sm font-bold text-emerald-400">98%</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Temperature</span>
              <span className="font-mono text-sm font-bold text-emerald-400">100.8°F</span>
            </div>
          </div>
        </div>

        {/* Consultation Records Timeline */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" />
              Consultation & Prescription History ({history.length} records)
            </h3>
          </div>

          {history.map((record, index) => (
            <div
              key={record._id || index}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6"
            >
              {/* Record Top Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {record.doctorName || 'Dr. Priya Sharma, MD'}
                    </h4>
                    <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>{new Date(record.datetime).toLocaleDateString()} at {new Date(record.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>·</span>
                      <span className="text-blue-400 font-mono text-[11px]">{record.meetingUuid}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
                    Triage: {record.triage?.severity || 'Low'}
                  </span>

                  {/* Download Prescription PDF Button */}
                  <button
                    type="button"
                    onClick={() => downloadPdf(record._id)}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/20 flex items-center gap-2 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Prescription (PDF)
                  </button>
                </div>
              </div>

              {/* Diagnosis & Symptoms Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-xs text-slate-400 uppercase tracking-wider block font-medium mb-1">
                    Clinical Diagnosis
                  </span>
                  <div className="text-sm font-semibold text-white">
                    {record.summary_data?.diagnosis?.join(', ') || 'Acute Upper Respiratory Tract Infection'}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-xs text-slate-400 uppercase tracking-wider block font-medium mb-1">
                    Reported Symptoms
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {record.summary_data?.symptoms?.map((s, i) => (
                      <span key={i} className="text-xs px-2.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Prescribed Medications Table */}
              <div>
                <h5 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Official Prescribed Medications
                </h5>
                <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-mono">
                      <tr>
                        <th className="p-3">Medicine Name</th>
                        <th className="p-3">Dosage</th>
                        <th className="p-3">Standard Frequency</th>
                        <th className="p-3">Duration</th>
                        <th className="p-3">Patient Instructions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-200">
                      {record.summary_data?.prescription?.map((rx, i) => (
                        <tr key={i} className="hover:bg-slate-900/40">
                          <td className="p-3 font-semibold text-white">{rx.drug || rx.medicine}</td>
                          <td className="p-3">{rx.dosage}</td>
                          <td className="p-3 font-mono text-purple-400">{rx.frequency}</td>
                          <td className="p-3">{rx.duration}</td>
                          <td className="p-3 text-slate-400">{rx.instructions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Doctor Guidance & Follow-up */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row justify-between gap-4 text-xs">
                <div>
                  <strong className="text-slate-300 block mb-1">Lifestyle & Home Care:</strong>
                  <span className="text-slate-400">{record.summary_data?.lifestyle_advice?.join(' · ')}</span>
                </div>
                <div className="sm:text-right shrink-0">
                  <strong className="text-slate-300 block mb-1">Recommended Follow-up:</strong>
                  <span className="text-purple-400">{record.summary_data?.follow_up_plan?.[0] || 'In 3 days if symptoms persist'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
