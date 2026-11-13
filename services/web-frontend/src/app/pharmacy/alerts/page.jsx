'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import Header from '../../../components/Header';
import {
  Bell,
  AlertTriangle,
  Pill,
  ShieldCheck,
  RefreshCw,
  MapPin,
  Flame,
  CheckCircle2,
  Clock,
  ArrowRight,
  Zap,
  Building2
} from 'lucide-react';
import Link from 'next/link';

export default function PharmacyAlertsPage() {
  const [pincode, setPincode] = useState('560001');
  const [alerts, setAlerts] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [latestSurgeToast, setLatestSurgeToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const stompClientRef = useRef(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/telehealth-ws';

  // Fetch past alerts
  const fetchAlerts = async (pin) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/pharmacy/alerts?pincode=${pin}`);
      const data = await res.json();
      if (data?.alerts) {
        setAlerts(data.alerts);
      }
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts(pincode);
  }, [pincode]);

  // Connect STOMP WebSocket for real-time alerts
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || 'demo-pharmacist-token' : '';

    const client = new Client({
      brokerURL: WS_URL,
      connectHeaders: {
        token: token,
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        setIsConnected(true);
        console.log('[Pharmacy STOMP] Connected');

        // 1. Subscribe to specific regional pincode alerts
        client.subscribe(`/topic/pharmacy/alerts/${pincode}`, (message) => {
          try {
            const alertPayload = JSON.parse(message.body);
            handleIncomingSurge(alertPayload);
          } catch (e) {
            console.error('Error parsing STOMP alert payload:', e);
          }
        });

        // 2. Subscribe to global pharmacy alerts
        client.subscribe('/topic/pharmacy/alerts', (message) => {
          try {
            const alertPayload = JSON.parse(message.body);
            if (alertPayload.pincode === pincode) {
              handleIncomingSurge(alertPayload);
            }
          } catch (e) {
            console.error('Error parsing global alert payload:', e);
          }
        });
      },
      onDisconnect: () => {
        setIsConnected(false);
      },
      onStompError: (frame) => {
        console.error('[Pharmacy STOMP Error]:', frame.headers['message']);
      },
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      if (client) client.deactivate();
    };
  }, [pincode, WS_URL]);

  const handleIncomingSurge = (newAlert) => {
    setLatestSurgeToast(newAlert);
    setAlerts((prev) => [newAlert, ...prev]);

    // Auto dismiss toast after 8 seconds
    setTimeout(() => {
      setLatestSurgeToast(null);
    }, 8000);
  };

  const simulateSurge = async () => {
    setSimulating(true);
    try {
      const res = await fetch(`${API_BASE}/api/pharmacy/simulate-surge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pincode,
          condition: 'dengue',
          count: 5,
        }),
      });
      const data = await res.json();
      if (data.alert) {
        handleIncomingSurge(data.alert);
      }
      fetchAlerts(pincode);
    } catch (e) {
      console.error('Simulate surge failed:', e);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header />

      {/* Toast Notification */}
      {latestSurgeToast && (
        <div className="fixed top-20 right-6 z-50 max-w-md bg-rose-600 border border-rose-400 text-white p-4 rounded-2xl shadow-2xl flex items-start gap-3 animate-bounce">
          <Flame className="w-7 h-7 flex-shrink-0 text-amber-300" />
          <div className="flex-1">
            <h4 className="font-bold text-sm flex items-center justify-between">
              SURGE DETECTED IN PINCODE {latestSurgeToast.pincode}
              <span className="text-[10px] bg-rose-800 px-2 py-0.5 rounded-full uppercase font-mono">Live STOMP Alert</span>
            </h4>
            <p className="text-xs mt-1 text-rose-100">
              Condition: <strong className="capitalize">{latestSurgeToast.condition}</strong> &bull; {latestSurgeToast.queryCount} queries in 24h.
            </p>
            <p className="text-[11px] text-rose-200 mt-1">Recommended: {latestSurgeToast.recommendedMedicines?.join(', ')}</p>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        {/* Top Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${isConnected ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span>{isConnected ? 'STOMP WebSocket Connected' : 'Connecting STOMP...'}</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Regional Pharmacy Surge Surveillance</h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Proactive disease outbreak detection aggregated from multilingual patient consultations and regional query surveillance.
            </p>
          </div>

          {/* Region Filter & Simulation Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-xl border border-slate-800">
              <MapPin className="w-4 h-4 text-rose-400 ml-1" />
              <div className="flex flex-col">
                <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Monitored Pincode</label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="e.g. 560001"
                  className="bg-transparent border-none text-white text-xs font-semibold focus:outline-none w-24"
                />
              </div>
              <button
                type="button"
                onClick={() => fetchAlerts(pincode)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-white transition flex items-center justify-center"
                title="Refresh"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Outbreak Simulation Trigger */}
            <button
              type="button"
              onClick={simulateSurge}
              disabled={simulating}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20 flex items-center gap-2 transition disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5" />
              {simulating ? 'Simulating...' : '⚡ Trigger Dengue Outbreak Surge'}
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Active Alerts Feed */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                Active Regional Surge Advisories ({alerts.length})
              </h2>
              <span className="text-xs text-slate-400 font-mono">Threshold X = 5 Queries</span>
            </div>

            {alerts.length === 0 && !loading && (
              <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3 opacity-60" />
                <h3 className="text-sm font-semibold text-slate-300">No Outbreak Surges in Pincode {pincode}</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Query logs for this region are below the emergency threshold. Click <strong>&quot;⚡ Trigger Dengue Outbreak Surge&quot;</strong> above to simulate!
                </p>
              </div>
            )}

            {alerts.map((alert, idx) => (
              <div
                key={alert.alertId || idx}
                className="bg-slate-900 border border-rose-500/30 rounded-2xl p-5 shadow-lg relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-red-600" />
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white capitalize">{alert.condition} Outbreak Surge</span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          {alert.severity || 'ELEVATED_SURGE'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        <span>Detected in last 24h &bull; Region: {alert.pincode}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-2xl font-black text-rose-400 font-mono">{alert.queryCount}</span>
                    <span className="text-[10px] text-slate-400 block font-mono">queries in 24h</span>
                  </div>
                </div>

                {/* Recommended Restock Inventory Checklist */}
                <div className="mt-4 pt-3 border-t border-slate-800">
                  <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                    <Pill className="w-3.5 h-3.5 text-blue-400" />
                    Recommended Pharmacy Shelf Stock Checklist:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {alert.recommendedMedicines?.map((med, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                        {med}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right Column: Pharmacy Inventory & Dispatch Stats */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-400" />
                Regional Supply Network Status
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                When a condition exceeds threshold X, the system queries registered pharmacies in pincode {pincode} and dispatches restock advisories via Resend API and live STOMP topic push.
              </p>

              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span>Registered Regional Pharmacies:</span>
                  <span className="font-mono font-bold text-emerald-400">3 Stores</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span>STOMP Push Topic:</span>
                  <span className="font-mono text-blue-400 text-[11px]">/topic/pharmacy/alerts/{pincode}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span>Email Advisory Protocol:</span>
                  <span className="font-mono text-purple-400 text-[11px]">Resend Transactional</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
