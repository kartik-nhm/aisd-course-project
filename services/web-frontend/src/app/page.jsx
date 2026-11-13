'use client';

import React from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import {
  Video,
  FileText,
  MessageSquare,
  Building2,
  Stethoscope,
  ArrowRight,
  ShieldCheck,
  Activity,
  Zap,
  CheckCircle2
} from 'lucide-react';

export default function UnifiedPlatformHome() {
  const modules = [
    {
      id: 'module-1',
      title: 'Telehealth & Dual-Track Audio',
      domain: 'Module 1 · Teleconsultation',
      tag: 'WebRTC & STOMP',
      description: 'End-to-end encrypted doctor-to-patient video consultation with low-latency STOMP signaling and dual-track 44.1 kHz audio capture.',
      icon: Video,
      color: 'bg-blue-600',
      action: 'Start Consultation Studio',
      href: '/patient/consultation',
    },
    {
      id: 'module-2',
      title: 'Ambient Clinical AI Scribe',
      domain: 'Module 2 · Clinical NLP',
      tag: 'AssemblyAI + Gemini',
      description: 'Converts consultation dialogue into normalized EHR notes (symptoms, diagnosis, vitals, Rx) with 4-level triage classification.',
      icon: Stethoscope,
      color: 'bg-emerald-600',
      action: 'Open Doctor Hub & Queue',
      href: '/doctor/queue',
    },
    {
      id: 'module-3',
      title: 'Allergy Engine & Prescription PDF',
      domain: 'Module 3 · Safety & Rx',
      tag: 'jsPDF + Cross-Check',
      description: 'Cross-checks patient allergies against prescribed beta-lactams and NSAIDs, offering 1-click substitutions and signed PDF generation.',
      icon: FileText,
      color: 'bg-purple-600',
      action: 'View Patient Health Records',
      href: '/patient/records',
    },
    {
      id: 'module-4',
      title: 'Multilingual Vernacular RAG',
      domain: 'Module 4 · Vernacular RAG',
      tag: 'Hinglish & Kanglish',
      description: 'Conversational clinical assistant answering queries in Romanized Hindi, Kannada, and English with regional symptom logging.',
      icon: MessageSquare,
      color: 'bg-amber-600',
      action: 'Chat with Vernacular AI',
      href: '/patient/chat',
    },
    {
      id: 'module-5',
      title: 'Pharmacy Disease Radar',
      domain: 'Module 5 · Outbreak Alerts',
      tag: 'STOMP Surge Radar',
      description: 'Monitors regional postal codes for infection surges and notifies community pharmacies via STOMP WebSockets to prevent stockouts.',
      icon: Building2,
      color: 'bg-rose-600',
      action: 'Open Pharmacy Outbreak Radar',
      href: '/pharmacy/alerts',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 max-w-5xl mx-auto text-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight">
          Smart Telehealth, Clinical AI Scribe & Regional Pharmacy Network
        </h1>
        <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
          An integrated clinical intelligence platform uniting live WebRTC video consultations, automated ambient Gemini scribing, vernacular medical RAG, and proactive regional disease surge early warning alerts.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            href="/patient/consultation"
            className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm shadow-sm transition flex items-center gap-2"
          >
            Launch Consultation Studio <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/pharmacy/alerts"
            className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-xl font-semibold text-sm transition flex items-center gap-2"
          >
            Pharmacy Surge Radar
          </Link>
          <Link
            href="/patient/chat"
            className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-xl font-semibold text-sm transition"
          >
            Multilingual AI Chat
          </Link>
        </div>
      </section>

      {/* Modules Grid */}
      <section id="modules" className="py-8 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <div className="border-b border-slate-800 pb-4 mb-8">
          <h2 className="text-xl font-bold text-white tracking-tight">Core Architecture Modules</h2>
          <p className="text-xs text-slate-400 mt-1">
            Engineered as decoupled domain modules under <code className="text-blue-400 font-mono">/modules</code> and exposed through unified services.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.id}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-11 h-11 rounded-xl ${m.color} flex items-center justify-center text-white shadow-sm`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-300 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-md">
                      {m.tag}
                    </span>
                  </div>

                  <div className="text-[11px] font-medium text-slate-400 mb-1">{m.domain}</div>
                  <h3 className="text-base font-semibold text-white">
                    {m.title}
                  </h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    {m.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80">
                  <Link
                    href={m.href}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition"
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
      <footer className="border-t border-slate-800 py-8 px-6 mt-auto text-center text-xs text-slate-400">
        Smart Telehealth Platform · Clinical AI Scribe & Regional Pharmacy Surveillance Network
      </footer>
    </div>
  );
}
