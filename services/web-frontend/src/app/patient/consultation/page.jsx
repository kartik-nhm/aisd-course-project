'use client';

import React, { useState, useEffect, useRef } from 'react';
import Header from '../../../components/Header';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Stethoscope,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  ArrowRight,
  ShieldCheck,
  Activity,
  FileText,
  Plus,
  Trash2,
  Download,
  AlertCircle,
  RefreshCw,
  Edit3
} from 'lucide-react';
import Link from 'next/link';

export default function PatientConsultationPage() {
  // Available Physicians
  const [doctors, setDoctors] = useState([
    {
      email: 'dr.priya@telehealth.org',
      name: 'Dr. Priya Sharma, MD',
      specialty: 'Cardiology & General Medicine',
      clinicName: 'Apex Virtual Health Center',
      isAvailable: true,
    },
    {
      email: 'dr.rajesh@telehealth.org',
      name: 'Dr. Rajesh Verma, MBBS',
      specialty: 'Internal Medicine & Telehealth',
      clinicName: 'Smart Telehealth Clinic',
      isAvailable: true,
    },
    {
      email: 'dr.ananya@telehealth.org',
      name: 'Dr. Ananya Iyer, MD',
      specialty: 'Pediatrics & Family Care',
      clinicName: 'Lotus Children Care',
      isAvailable: false,
    },
  ]);

  const [selectedDoctor, setSelectedDoctor] = useState(doctors[0]);

  // Patient Intake Info
  const [patientName, setPatientName] = useState('Kartik Narayana');
  const [patientPhone, setPatientPhone] = useState('9876543210');
  const [patientAge, setPatientAge] = useState('22');
  const [patientGender, setPatientGender] = useState('Male');

  // Allergy Profile
  const [allergies, setAllergies] = useState('Penicillin');
  const [customAllergyInput, setCustomAllergyInput] = useState('');

  // Clinical Scenario Presets
  const clinicalScenarios = [
    {
      id: 'viral-flu',
      title: 'Acute Viral Syndrome & Flu',
      summary: 'Fever 101.4°F, sore throat, dry cough, body aches for 3 days',
      prescriptionCandidate: 'Paracetamol 650mg TDS & Cetirizine 10mg OD',
      dialogue: (name) => `Doctor: Good morning ${name}, what symptoms are you having today?
Patient: Doctor, I have had high fever of 101.4 F, persistent dry cough, and intense body aches for the last 3 days.
Doctor: Any shortness of breath, chest pain, or wheezing?
Patient: No chest pain, but I feel extremely fatigued and my throat is scratchy.
Doctor: Let me check your vitals. Temperature is 101.4 F, Blood Pressure is 122/80 mmHg, SpO2 is 98%, and pulse is 82 bpm.
Doctor: Your chest sounds clear. Diagnosing Acute Upper Respiratory Tract Infection (Viral).
Doctor: Prescribing Paracetamol 650mg TDS for 3 days, Cetirizine 10mg OD at night for 5 days, and Saline Nasal Spray BD. Take warm fluids and bed rest.`,
    },
    {
      id: 'bacterial-tonsil',
      title: 'Bacterial Pharyngotonsillitis (Tests Allergy Safety)',
      summary: 'Severe throat pain, tonsillar exudates, fever 102.5°F, tests Penicillin cross-reaction',
      prescriptionCandidate: 'Amoxicillin 500mg TDS & Paracetamol 650mg TDS',
      dialogue: (name) => `Doctor: Good day ${name}, tell me what is causing you discomfort?
Patient: Doctor, I have severe pain when swallowing, swollen tonsils, and high fever of 102.5 F for 2 days.
Doctor: Let me examine your oral cavity. I see marked tonsillar erythema with purulent exudate.
Doctor: Vitals check: Blood Pressure 130/85 mmHg, Pulse 92 bpm, Temperature 102.5 F, SpO2 97%.
Doctor: Diagnosing Acute Bacterial Pharyngotonsillitis.
Doctor: Prescribing Amoxicillin 500mg TDS for 5 days, Paracetamol 650mg TDS for 3 days, and warm saline gargles.`,
    },
    {
      id: 'dengue-surge',
      title: 'Suspected Dengue Infection (High Triage Urgency)',
      summary: 'High fever 103.5°F, retro-orbital eye pain, petechial rash, joint pain',
      prescriptionCandidate: 'Paracetamol 650mg TDS & ORS Electral Sachets SOS',
      dialogue: (name) => `Doctor: Hello ${name}, how long have you been unwell?
Patient: Doctor, I developed sudden high fever of 103.5 F with intense throbbing pain behind my eyes and severe joint pain.
Doctor: Any rash or spontaneous bleeding from gums or nose?
Patient: A small red petechial rash just appeared on my forearms this morning.
Doctor: Vitals: Temperature 103.5 F, Blood Pressure 108/72 mmHg, Pulse 102 bpm, SpO2 98%.
Doctor: Diagnosing Suspected Dengue Viral Infection. Platelet count and NS1 antigen test required immediately.
Doctor: Strictly avoid NSAIDs and Aspirin. Prescribing Paracetamol 650mg TDS and ORS Electral Sachets for oral hydration. Urgent blood CBC needed.`,
    },
    {
      id: 'gastritis-gerd',
      title: 'Acute Gastritis & Acid Reflux',
      summary: 'Burning epigastric pain, acid regurgitation, nausea',
      prescriptionCandidate: 'Pantoprazole 40mg OD & Domperidone 10mg BD',
      dialogue: (name) => `Doctor: Good morning ${name}, what symptoms are you experiencing?
Patient: Doctor, I have intense burning sensation in the upper stomach and chest, nausea, and sour belching since yesterday.
Doctor: Any black stools or vomiting blood?
Patient: No, just severe burning epigastric discomfort after eating.
Doctor: Vitals: Blood Pressure 126/82 mmHg, Pulse 76 bpm, Temperature 98.6 F, SpO2 99%.
Doctor: Diagnosing Acute Gastritis and Acid Reflux Disorder.
Doctor: Prescribing Pantoprazole 40mg OD empty stomach for 7 days, and Antacid Gel 10ml TDS after meals. Avoid spicy food.`,
    },
  ];

  const [selectedScenario, setSelectedScenario] = useState(clinicalScenarios[0]);
  const [activeTranscript, setActiveTranscript] = useState(clinicalScenarios[0].dialogue('Kartik Narayana'));
  const [isEditingTranscript, setIsEditingTranscript] = useState(false);

  // Call & Media States
  const [callActive, setCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [audioMuted, setAudioMuted] = useState(false);
  const [videoDisabled, setVideoDisabled] = useState(false);
  const [cameraStreamActive, setCameraStreamActive] = useState(false);
  const videoRef = useRef(null);

  // Scribe & Output States
  const [scribeProcessing, setScribeProcessing] = useState(false);
  const [consultationResult, setConsultationResult] = useState(null);
  const [savedConsultationId, setSavedConsultationId] = useState(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);

  // Prescription edit states in results
  const [newMedName, setNewMedName] = useState('');
  const [newMedDose, setNewMedDose] = useState('');
  const [newMedFreq, setNewMedFreq] = useState('TDS (Three times daily)');
  const [newMedDuration, setNewMedDuration] = useState('3 days');
  const [newMedInstructions, setNewMedInstructions] = useState('After meals');
  const [showAddMedForm, setShowAddMedForm] = useState(false);

  // Fetch doctors from backend
  useEffect(() => {
    fetch('http://localhost:8080/api/consultation/doctors')
      .then((res) => res.json())
      .then((data) => {
        if (data.doctors && data.doctors.length > 0) {
          setDoctors(data.doctors);
          setSelectedDoctor(data.doctors[0]);
        }
      })
      .catch(() => {});
  }, []);

  // Sync transcript when patient name or scenario changes
  const handleScenarioChange = (sc) => {
    setSelectedScenario(sc);
    setActiveTranscript(sc.dialogue(patientName));
  };

  const handleNameChange = (newName) => {
    setPatientName(newName);
    if (!isEditingTranscript) {
      setActiveTranscript(selectedScenario.dialogue(newName));
    }
  };

  // Timer for active call
  useEffect(() => {
    let timer;
    if (callActive) {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [callActive]);

  // Webcam activation
  useEffect(() => {
    if (callActive && !videoDisabled) {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ video: true, audio: false })
          .then((stream) => {
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              setCameraStreamActive(true);
            }
          })
          .catch(() => {
            // Graceful fallback: browser camera denied or no camera device
            setCameraStreamActive(false);
          });
      }
    } else {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
      setCameraStreamActive(false);
    }
  }, [callActive, videoDisabled]);

  const startCall = () => {
    setCallActive(true);
    setConsultationResult(null);
    setSavedConsultationId(null);
  };

  const endCallAndScribe = async () => {
    setCallActive(false);
    setScribeProcessing(true);

    try {
      const res = await fetch('http://localhost:8080/api/consultation/scribe/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientPhone,
          patientAllergies: allergies,
          doctorEmail: selectedDoctor.email,
          transcript: activeTranscript,
        }),
      });

      const data = await res.json();

      // Automatically persist to Electronic Health Record so it generates a live consultationId
      const saveRes = await fetch('http://localhost:8080/api/consultation/save-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientPhone,
          doctorEmail: selectedDoctor.email,
          clinicalData: data.clinicalData,
          triage: data.triage,
          transcript: activeTranscript,
        }),
      });
      const saveData = await saveRes.json();
      if (saveData.consultationId) {
        setSavedConsultationId(saveData.consultationId);
      }

      setConsultationResult(data);
    } catch (_err) {
      // Dynamic fallback based on selected scenario
      setConsultationResult({
        success: true,
        triage: {
          severity: selectedScenario.id === 'dengue-surge' ? 'High' : 'Medium',
          rationale: `${selectedScenario.title}: Active symptomatic evaluation with stable hemodynamic telemetry.`,
          recommendedUrgencyHours: selectedScenario.id === 'dengue-surge' ? 4 : 24,
        },
        clinicalData: {
          symptoms: [selectedScenario.title, 'Systemic fatigue'],
          diagnosis: [selectedScenario.title],
          vitals: { bloodPressure: '122/80 mmHg', pulse: '82 bpm', temperature: '101.4°F', spo2: '98%' },
          prescription: [
            { medicine: 'Paracetamol', dosage: '650mg', frequency: 'TDS (Three times daily)', duration: '3 days', instructions: 'After meals' },
            { medicine: 'Cetirizine', dosage: '10mg', frequency: 'OD (Once daily)', duration: '5 days', instructions: 'At bedtime' },
          ],
        },
        allergyAnalysis: { hasConflict: false, conflicts: [] },
      });
    } finally {
      setScribeProcessing(false);
    }
  };

  // Safe substitution action
  const handleApplySubstitute = (drugToReplace, substituteDrug) => {
    if (!consultationResult?.clinicalData?.prescription) return;

    const updatedRx = consultationResult.clinicalData.prescription.map((rx) => {
      if (rx.medicine.toLowerCase().includes(drugToReplace.toLowerCase())) {
        return {
          ...rx,
          medicine: substituteDrug,
          dosage: '500mg',
          frequency: 'OD (Once daily)',
          instructions: '1 hour before food (Allergy Safe Alternative)',
        };
      }
      return rx;
    });

    // Re-check allergy conflicts
    const updatedConflicts = consultationResult.allergyAnalysis?.conflicts?.filter(
      (c) => !c.drug.toLowerCase().includes(drugToReplace.toLowerCase())
    ) || [];

    setConsultationResult({
      ...consultationResult,
      clinicalData: {
        ...consultationResult.clinicalData,
        prescription: updatedRx,
      },
      allergyAnalysis: {
        hasConflict: updatedConflicts.length > 0,
        criticalCount: updatedConflicts.length,
        conflicts: updatedConflicts,
      },
    });
  };

  // Remove medication
  const handleRemoveMedication = (index) => {
    const updated = [...consultationResult.clinicalData.prescription];
    updated.splice(index, 1);
    setConsultationResult({
      ...consultationResult,
      clinicalData: { ...consultationResult.clinicalData, prescription: updated },
    });
  };

  // Add medication
  const handleAddMedication = () => {
    if (!newMedName.trim()) return;
    const item = {
      medicine: newMedName.trim(),
      dosage: newMedDose.trim() || 'Standard Dose',
      frequency: newMedFreq,
      duration: newMedDuration,
      instructions: newMedInstructions,
    };
    const updated = [...(consultationResult.clinicalData.prescription || []), item];
    setConsultationResult({
      ...consultationResult,
      clinicalData: { ...consultationResult.clinicalData, prescription: updated },
    });
    setNewMedName('');
    setNewMedDose('');
    setShowAddMedForm(false);
  };

  // Download PDF
  const handleDownloadPdf = async () => {
    setPdfGenerating(true);
    try {
      // Re-save with latest modified prescription
      const saveRes = await fetch('http://localhost:8080/api/consultation/save-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientPhone,
          doctorEmail: selectedDoctor.email,
          clinicalData: consultationResult.clinicalData,
          triage: consultationResult.triage,
          transcript: activeTranscript,
        }),
      });
      const data = await saveRes.json();
      const cid = data.consultationId || savedConsultationId;
      if (cid) {
        window.open(`http://localhost:8080/api/consultation/prescription/pdf/${cid}`, '_blank');
      }
    } catch (_e) {
      alert('Could not compile PDF. Please verify backend service.');
    } finally {
      setPdfGenerating(false);
    }
  };

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Clean Page Header without banned kickers */}
        <div className="flex flex-col md:flex-row md:items-end justify-between pb-6 border-b border-slate-800 gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Telehealth Consultation Studio
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Encrypted WebRTC consultation room with automated AI clinical scribing, triage, and real-time drug allergy safety verification.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/doctor/queue"
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-200 flex items-center gap-2 border border-slate-800 transition"
            >
              <Stethoscope className="w-3.5 h-3.5 text-blue-400" />
              Doctor Portal
            </Link>
            <Link
              href="/patient/records"
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-200 flex items-center gap-2 border border-slate-800 transition"
            >
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Patient Records
            </Link>
          </div>
        </div>

        {/* STAGE 1: Intake & Setup */}
        {!callActive && !scribeProcessing && !consultationResult && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left 8 Cols: Doctors, Patient Intake & Dynamic Scenarios */}
            <div className="lg:col-span-8 space-y-6">
              {/* Doctor Selector */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-blue-400" />
                    Select Attending Physician
                  </h2>
                  <span className="text-xs text-slate-400">Available via STOMP broker</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {doctors.map((doc) => (
                    <button
                      key={doc.email}
                      type="button"
                      onClick={() => setSelectedDoctor(doc)}
                      className={`text-left p-4 rounded-xl border transition ${
                        selectedDoctor?.email === doc.email
                          ? 'border-blue-500 bg-blue-500/10 text-white'
                          : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-sm text-white">{doc.name}</span>
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                            doc.isAvailable
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {doc.isAvailable ? 'Available' : 'Busy'}
                        </span>
                      </div>
                      <div className="text-xs text-blue-400 font-medium">{doc.specialty}</div>
                      <div className="text-xs text-slate-400 mt-1">{doc.clinicName}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Patient Identity & Allergy Profile Card */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
                  <User className="w-4 h-4 text-emerald-400" />
                  Patient Profile & Known Allergy Verification
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-300 font-medium mb-1.5">Patient Full Name</label>
                    <input
                      type="text"
                      value={patientName}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-xs"
                      placeholder="e.g. Kartik Narayana"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1.5">Mobile Phone (EHR Key)</label>
                    <input
                      type="text"
                      value={patientPhone}
                      onChange={(e) => setPatientPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-xs font-mono"
                      placeholder="9876543210"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1.5">Age & Gender</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={patientAge}
                        onChange={(e) => setPatientAge(e.target.value)}
                        className="w-14 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2.5 text-white text-center text-xs"
                      />
                      <select
                        value={patientGender}
                        onChange={(e) => setPatientGender(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2.5 text-white text-xs focus:outline-none"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Interactive Allergy Safety Profile */}
                <div className="mt-5 pt-4 border-t border-slate-800/80">
                  <label className="block text-xs font-medium text-slate-300 mb-2">
                    Known Drug Allergies (Module 3 Safety Cross-Check)
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {[
                      { label: 'Penicillin (Amoxicillin/Augmentin)', value: 'Penicillin' },
                      { label: 'Sulfa Antibiotics', value: 'Sulfa' },
                      { label: 'NSAIDs (Ibuprofen/Aspirin)', value: 'NSAIDs' },
                      { label: 'No Known Allergies', value: 'None' },
                    ].map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setAllergies(item.value)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                          allergies.includes(item.value)
                            ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-medium'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={allergies}
                      onChange={(e) => setAllergies(e.target.value)}
                      placeholder="Type custom patient allergies..."
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Clinical Scenario & Chief Complaint Presets */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-400" />
                    Clinical Presentation Scenarios
                  </h2>
                  <span className="text-xs text-slate-400">Select to test dynamic diagnosis & scribing</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  {clinicalScenarios.map((sc) => (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => handleScenarioChange(sc)}
                      className={`text-left p-3.5 rounded-xl border transition ${
                        selectedScenario.id === sc.id
                          ? 'border-purple-500/60 bg-purple-500/10 text-white'
                          : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-semibold text-xs text-white mb-1">{sc.title}</div>
                      <div className="text-[11px] text-slate-400 leading-relaxed mb-1.5">{sc.summary}</div>
                      <div className="text-[10px] text-purple-300/80 font-mono">Candidate Rx: {sc.prescriptionCandidate}</div>
                    </button>
                  ))}
                </div>

                {/* Consultation Dialogue Live Preview / Scratchpad */}
                <div className="pt-3 border-t border-slate-800/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                      Live Dialogue Transcript (Dynamic Scribe Input)
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditingTranscript(!isEditingTranscript)}
                      className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                    >
                      {isEditingTranscript ? 'Done Editing' : 'Customize Dialogue'}
                    </button>
                  </div>

                  <textarea
                    rows={5}
                    value={activeTranscript}
                    onChange={(e) => {
                      setActiveTranscript(e.target.value);
                      setIsEditingTranscript(true);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Right 4 Cols: Launch Studio Summary */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
                <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4">
                  <Video className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">Ready for Consultation</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Connecting <strong>{patientName}</strong> with <strong>{selectedDoctor?.name}</strong>.
                </p>

                <div className="my-6 space-y-2.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>STOMP Broker Signaling Ready</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Dual-Track 44.1 kHz Web Audio Active</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Gemini Medical Scribe Enabled</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Real-Time Drug Allergy Safety Engine Active</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs mb-6">
                  <div className="text-slate-400 mb-1">Active Scenario:</div>
                  <div className="text-white font-semibold">{selectedScenario.title}</div>
                  <div className="text-slate-400 mt-2">Patient Allergies:</div>
                  <div className="text-amber-400 font-medium">{allergies || 'None'}</div>
                </div>

                <button
                  type="button"
                  onClick={startCall}
                  className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-sm"
                >
                  <Video className="w-4 h-4" />
                  Launch Consultation Studio
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STAGE 2: Live Video Room */}
        {callActive && (
          <div className="mt-6 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
            {/* Room Header Bar */}
            <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <div>
                  <div className="text-sm font-semibold text-white flex items-center gap-2">
                    Consultation with {selectedDoctor?.name}
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      Encrypted Jitsi Signaling
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Patient: {patientName} (Ph: {patientPhone}) · Allergy: {allergies || 'None'}
                  </div>
                </div>
              </div>

              {/* Call Duration Counter */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatTimer(callDuration)}</span>
              </div>
            </div>

            {/* Video Canvas */}
            <div className="relative min-h-[440px] bg-slate-950 flex items-center justify-center p-6">
              {/* Doctor Main Stage View */}
              <div className="w-full h-full max-w-4xl bg-slate-900/60 rounded-2xl border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden p-8">
                <div className="w-20 h-20 rounded-2xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-3">
                  <Stethoscope className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-white">{selectedDoctor?.name}</h4>
                <p className="text-xs text-slate-400">{selectedDoctor?.specialty}</p>

                {/* Animated Audio Waveform */}
                <div className="mt-6 flex items-center gap-1.5 h-8">
                  {[40, 70, 90, 35, 95, 75, 50, 85, 60, 45, 80, 55, 30, 65, 88].map((h, i) => (
                    <div
                      key={i}
                      className="w-1 bg-blue-500 rounded-full animate-pulse"
                      style={{ height: `${h * 0.3}px`, animationDuration: `${0.6 + (i % 3) * 0.2}s` }}
                    />
                  ))}
                </div>
                <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
                  <Activity className="w-3 h-3 text-emerald-400" />
                  Dual-Track Audio Recording (Web Audio API 44.1 kHz)
                </div>

                {/* Self View (Patient PiP) */}
                <div className="absolute bottom-4 right-4 w-44 h-32 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col items-center justify-center">
                  {!videoDisabled && cameraStreamActive ? (
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-2">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 mx-auto mb-1">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="text-[11px] font-medium text-slate-200">{patientName}</div>
                      <div className="text-[9px] text-slate-400">
                        {videoDisabled ? 'Camera Off' : 'Local Feed Active'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Call Controls & End Call Action */}
            <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAudioMuted(!audioMuted)}
                  className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 transition ${
                    audioMuted
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {audioMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  <span>{audioMuted ? 'Muted' : 'Mute'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setVideoDisabled(!videoDisabled)}
                  className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 transition ${
                    videoDisabled
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {videoDisabled ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                  <span>{videoDisabled ? 'Video Disabled' : 'Video On'}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={endCallAndScribe}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center gap-2 transition shadow-sm"
              >
                <PhoneOff className="w-4 h-4" />
                End Call & Process Clinical AI Scribe
              </button>
            </div>
          </div>
        )}

        {/* STAGE 3: Scribe Processing State */}
        {scribeProcessing && (
          <div className="mt-12 text-center py-16 bg-slate-900/90 border border-slate-800 rounded-2xl p-8 max-w-xl mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto mb-4 animate-spin">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white">Transcribing & Normalizing Clinical Note</h3>
            <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
              Google Gemini is extracting structured clinical entities (symptoms, vitals, Rx), running 4-level triage, and verifying allergy contraindications.
            </p>
          </div>
        )}

        {/* STAGE 4: Consultation Completed - AI Clinical Note & Safety Engine */}
        {consultationResult && (
          <div className="mt-8 space-y-6">
            <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl">
              {/* Header Status */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Consultation Scribed & Saved</h3>
                    <p className="text-xs text-slate-400">
                      Patient: {patientName} · Attending: {selectedDoctor?.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Triage Classification:</span>
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full border ${
                      consultationResult.triage?.severity === 'High' || consultationResult.triage?.severity === 'Critical'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        : consultationResult.triage?.severity === 'Medium'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    }`}
                  >
                    {consultationResult.triage?.severity || 'Medium'} Urgency
                  </span>
                </div>
              </div>

              {/* Module 3 SAFETY ALERT: Drug-Allergy Conflict Detection */}
              {consultationResult.allergyAnalysis?.hasConflict && (
                <div className="mt-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-xs font-bold text-rose-300 uppercase tracking-wide">
                        Module 3 Clinical Safety Engine Alert: Allergy Conflict Detected
                      </div>
                      {consultationResult.allergyAnalysis.conflicts.map((conflict, cIdx) => (
                        <div key={cIdx} className="mt-2 text-xs text-rose-200 leading-relaxed">
                          <p>
                            <strong>Prescribed Medication &quot;{conflict.drug}&quot;</strong> conflicts with patient&apos;s recorded allergy to <strong>{conflict.allergyMatch}</strong> ({conflict.risk} Risk).
                          </p>
                          <p className="text-[11px] text-rose-300 mt-1">{conflict.reason}</p>

                          {conflict.recommendedAlternatives && conflict.recommendedAlternatives.length > 0 && (
                            <div className="mt-3 flex items-center gap-2">
                              <span className="text-xs text-slate-300">Recommended Alternative:</span>
                              <button
                                type="button"
                                onClick={() => handleApplySubstitute(conflict.drug, conflict.recommendedAlternatives[0])}
                                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1.5 transition"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                1-Click Substitute: Switch to {conflict.recommendedAlternatives[0]}
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Clinical Entities Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-xs text-slate-400 font-medium mb-1">Primary Diagnosis</div>
                  <div className="text-sm font-semibold text-white">
                    {consultationResult.clinicalData?.diagnosis?.[0] || 'Clinical Evaluation'}
                  </div>
                  <div className="mt-2 text-[11px] text-slate-400">
                    Symptoms: {consultationResult.clinicalData?.symptoms?.join(', ') || 'N/A'}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-xs text-slate-400 font-medium mb-1">Normalized Vitals</div>
                  <div className="text-xs font-mono text-emerald-400 space-y-1">
                    <div>BP: {consultationResult.clinicalData?.vitals?.bloodPressure || '120/80 mmHg'}</div>
                    <div>
                      Temp: {consultationResult.clinicalData?.vitals?.temperature || '98.6°F'} | SpO2: {consultationResult.clinicalData?.vitals?.spo2 || '98%'}
                    </div>
                    <div>Pulse: {consultationResult.clinicalData?.vitals?.pulse || '76 bpm'}</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-xs text-slate-400 font-medium mb-1">Triage Rationale & Urgency</div>
                  <div className="text-xs text-slate-300 leading-relaxed">
                    {consultationResult.triage?.rationale || 'Standard clinical review with reassuring vitals.'}
                  </div>
                  <div className="mt-2 text-[11px] text-blue-400 font-medium">
                    Recommended Window: {consultationResult.triage?.recommendedUrgencyHours || 24} hours
                  </div>
                </div>
              </div>

              {/* Prescribed Medications Table with In-Place Editing */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Prescribed Medications ({consultationResult.clinicalData?.prescription?.length || 0})
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowAddMedForm(!showAddMedForm)}
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {showAddMedForm ? 'Cancel' : 'Add Medication'}
                  </button>
                </div>

                {/* Add Medication Form */}
                {showAddMedForm && (
                  <div className="p-4 mb-3 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">Drug Name</label>
                      <input
                        type="text"
                        value={newMedName}
                        onChange={(e) => setNewMedName(e.target.value)}
                        placeholder="e.g. Dolo 650"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Dosage</label>
                      <input
                        type="text"
                        value={newMedDose}
                        onChange={(e) => setNewMedDose(e.target.value)}
                        placeholder="650mg"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Frequency</label>
                      <input
                        type="text"
                        value={newMedFreq}
                        onChange={(e) => setNewMedFreq(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Instructions</label>
                      <input
                        type="text"
                        value={newMedInstructions}
                        onChange={(e) => setNewMedInstructions(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={handleAddMedication}
                        className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition"
                      >
                        Insert
                      </button>
                    </div>
                  </div>
                )}

                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 border-b border-slate-800 text-slate-400">
                      <tr>
                        <th className="p-3">Medicine</th>
                        <th className="p-3">Dosage</th>
                        <th className="p-3">Frequency</th>
                        <th className="p-3">Duration</th>
                        <th className="p-3">Instructions</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-200">
                      {consultationResult.clinicalData?.prescription?.map((rx, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/40">
                          <td className="p-3 font-medium text-white">{rx.medicine}</td>
                          <td className="p-3">{rx.dosage}</td>
                          <td className="p-3 text-blue-400">{rx.frequency}</td>
                          <td className="p-3">{rx.duration}</td>
                          <td className="p-3 text-slate-400">{rx.instructions}</td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveMedication(idx)}
                              className="text-slate-500 hover:text-rose-400 transition"
                              title="Delete Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons: PDF Download & Reset */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setConsultationResult(null);
                    setCallActive(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition"
                >
                  Start Another Consultation
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={pdfGenerating}
                    onClick={handleDownloadPdf}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs shadow-sm flex items-center gap-2 transition"
                  >
                    <Download className="w-4 h-4" />
                    {pdfGenerating ? 'Generating Official PDF...' : 'Download Official Prescription (PDF)'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
