'use client';

import React from 'react';
import Link from 'next/link';
import {
  Video,
  FileText,
  MessageSquare,
  Building2,
  Stethoscope,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity
} from 'lucide-react';

export default function UnifiedPlatformHome() {
  const modules = [
    {
      id: 'module-1',
      title: 'Module 1: Telehealth & Signaling',
      tag: 'Live WebRTC',
      description: 'End-to-end encrypted doctor-to-patient video calls via Jitsi Meet with low-latency STOMP WebSocket signaling and audio mixing.',
      icon: Video,
      color: 'from-blue-500 to-indigo-600',
      action: 'Start Video Call',
      href: '/patient/consultation',
    },
    {
      id: 'module-2',
      title: 'Module 2: Clinical AI Scribe',
      tag: 'AssemblyAI + Gemini',
      description: 'Converts consultation dialogue into structured EHR notes (symptoms, diagnosis, vitals, Rx) with 4-level triage classification.',
      icon: Stethoscope,
      color: 'from-emerald-500 to-teal-600',
      action: 'Doctor Consultation Hub',
      href: '/doctor/queue',
    },
    {
      id: 'module-3',
      title: 'Module 3: Prescription Generator',
      tag: 'jsPDF + Dosage Parsing',
      description: 'Client and server-side PDF generation of signed medical prescriptions with standardized dosage schedules and clinical headers.',
      icon: FileText,
      color: 'from-purple-500 to-violet-600',
      action: 'View Prescription Records',
      href: '/patient/records',
    },
    {
      id: 'module-4',
      title: 'Module 4: Multilingual Chatbot',
      tag: 'FastAPI + Pinecone + Groq',
      description: 'RAG-powered conversational medical assistant supporting Romanized Hindi, Urdu, Kannada, and English with regional query logging.',
      icon: MessageSquare,
      color: 'from-amber-500 to-orange-600',
      action: 'Ask Medical Assistant',
      href: '/patient/chat',
    },
    {
      id: 'module-5',
      title: 'Module 5: Pharmacy Early Alert System',
      tag: 'Surge Detection + STOMP',
      description: 'Proactively identifies disease outbreaks (e.g. Dengue, Flu) in regional postal pincodes and alerts pharmacies to stock essential drugs.',
      icon: Building2,
      color: 'from-rose-500 to-red-600',
      action: 'Open Pharmacist Dashboard',
      href: '/pharmacy/alerts',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-lg text-white tracking-tight">Smart Telehealth Platform</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/pharmacy/alerts"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
            >
              Pharmacy Portal
            </Link>
            <Link
              href="/doctor/queue"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm"
            >
              Doctor Portal
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-6">
          <Sparkles className="w-4 h-4" />
          <span>Synthesized Architecture from TECHNOLOGY_SURVEY.md</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight">
          Smart Telehealth, Clinical AI Scribe & Regional Pharmacy Network
        </h1>
        <p className="mt-6 text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed">
          An integrated clinical intelligence platform uniting live WebRTC video consultations, automated Gemini scribing, multilingual vernacular RAG, and proactive regional disease surge early warning alerts.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/pharmacy/alerts"
            className="px-6 py-3.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-sm shadow-xl shadow-rose-600/20 transition flex items-center gap-2"
          >
            Explore Module 5: Pharmacy Early Alerts <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#modules"
            className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-sm transition"
          >
            View Architecture Modules
          </a>
        </div>
      </section>

      {/* Modules Grid */}
      <section id="modules" className="py-12 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white">The 5 Core Technical Modules</h2>
          <p className="text-sm text-slate-400 mt-2">
            Each module is cleanly decoupled into domain packages under <code className="text-indigo-400">/modules</code> and integrated into unified services.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.id}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition group hover:shadow-xl hover:shadow-indigo-950/20"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${m.color} flex items-center justify-center text-white shadow-md`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-800 px-2.5 py-1 rounded-md">
                      {m.tag}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition">
                    {m.title}
                  </h3>
                  <p className="text-sm text-slate-400 mt-2.5 leading-relaxed">
                    {m.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80">
                  <Link
                    href={m.href}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition"
                  >
                    {m.action} <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-10 px-6 mt-20 text-center text-xs text-slate-500">
        Smart Telehealth Platform &bull; Built in alignment with TECHNOLOGY_SURVEY.md
      </footer>
    </div>
  );
}
