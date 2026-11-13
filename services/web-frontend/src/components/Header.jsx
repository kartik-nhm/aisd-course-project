'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  Video,
  Stethoscope,
  MessageSquare,
  FileText,
  Building2,
  ShieldCheck,
  Radio,
} from 'lucide-react';

export default function Header() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Overview', href: '/', icon: Activity },
    { label: 'Patient Consultation', href: '/patient/consultation', icon: Video },
    { label: 'Doctor Hub & Scribe', href: '/doctor/queue', icon: Stethoscope },
    { label: 'Multilingual AI Chat', href: '/patient/chat', icon: MessageSquare },
    { label: 'Medical Records & Rx', href: '/patient/records', icon: FileText },
    { label: 'Pharmacy Outbreak Alerts', href: '/pharmacy/alerts', icon: Building2 },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Title */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                SmartTelehealth
                <span className="text-[10px] uppercase font-mono tracking-widest px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  AISD 50%
                </span>
              </div>
              <div className="text-xs text-slate-400">Clinical Intelligence Platform</div>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Live System Status Pill */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>STOMP Signaling Active</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
