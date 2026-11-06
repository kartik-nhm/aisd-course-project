'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
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
  ArrowRight
} from 'lucide-react';

export default function PharmacyAlertsPage() {
  const [pincode, setPincode] = useState('560001');
  const [alerts, setAlerts] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [latestSurgeToast, setLatestSurgeToast] = useState(null);
  const [loading, setLoading] = useState(true);
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

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 md:p-10 font-sans">
      {/* Toast Notification */}
      {latestSurgeToast && (
        <div className="fixed top-6 right-6 z-50 max-w-md bg-red-600 border border-red-400 text-white p-4 rounded-xl shadow-2xl flex items-start gap-3 animate-bounce">
          <Flame className="w-7 h-7 flex-shrink-0 text-yellow-300" />
          <div className="flex-1">
            <h4 className="font-bold text-base flex items-center justify-between">
              SURGE DETECTED IN PINCODE {latestSurgeToast.pincode}
              <span className="text-xs bg-red-800 px-2 py-0.5 rounded-full uppercase">Live STOMP Alert</span>
            </h4>
            <p className="text-sm mt-1 text-red-100">
              Condition: <strong className="capitalize">{latestSurgeToast.condition}</strong> &bull; {latestSurgeToast.queryCount} queries in 24h.
            </p>
            <p className="text-xs text-red-200 mt-1">Recommended: {latestSurgeToast.recommendedMedicines?.join(', ')}</p>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="max-w-6xl mx-auto mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Module 5: Early Alert Engine
            </span>
            <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${isConnected ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-amber-400'}`}></span>
              {isConnected ? 'STOMP WebSocket Live' : 'Connecting to STOMP Broker...'}
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-white mt-2 tracking-tight">Regional Pharmacy Surge Alerts</h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time proactive outbreak detection aggregated from multilingual patient consultations & chatbot queries.
          </p>
        </div>

        {/* Region Filter */}
        <div className="flex items-center gap-3 bg-slate-800/80 p-2 rounded-xl border border-slate-700">
          <MapPin className="w-5 h-5 text-indigo-400 ml-2" />
          <div className="flex flex-col">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Monitored Pincode</label>
            <input
              type="text"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              placeholder="e.g. 560001"
              className="bg-transparent border-none text-white text-sm font-semibold focus:outline-none w-28"
            />
          </div>
          <button
            onClick={() => fetchAlerts(pincode)}
            className="p-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white transition flex items-center justify-center"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Active Alerts Feed (2 Columns) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400" />
              Active Regional Surge Advisories ({alerts.length})
            </h2>
            <span className="text-xs text-slate-400">Sliding Window: 24 Hours</span>
          </div>

          {loading ? (
            <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-8 text-center text-slate-400 animate-pulse">
              Checking regional query logs...
            </div>
          ) : alerts.length === 0 ? (
            <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-10 text-center">
              <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-80" />
              <h3 className="text-lg font-semibold text-slate-200">No Disease Surges Detected</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto mt-1">
                Consultation and chatbot query rates in pincode <strong>{pincode}</strong> are within safe thresholds.
              </p>
            </div>
          ) : (
            alerts.map((alert, idx) => (
              <div
                key={alert.alertId || idx}
                className="bg-slate-800/70 border border-slate-700 hover:border-slate-600 rounded-2xl p-6 transition-all shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-white capitalize">{alert.condition} Outbreak</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${alert.severity === 'CRITICAL_SURGE' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                          {alert.severity || 'ELEVATED SURGE'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" /> Pincode: {alert.pincode}
                        <span>&bull;</span>
                        <Clock className="w-3.5 h-3.5 text-slate-500" /> {alert.queryCount} queries recorded in 24h
                      </p>
                    </div>
                  </div>

                  <span className="text-xs px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md font-semibold">
                    Status: {alert.status || 'ACTIVE'}
                  </span>
                </div>

                {/* Recommended Restock Section */}
                <div className="mt-5 pt-4 border-t border-slate-700/60">
                  <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-2 flex items-center gap-1.5">
                    <Pill className="w-4 h-4 text-indigo-400" />
                    Stock Replenishment Checklist
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {alert.recommendedMedicines?.map((med, mIdx) => (
                      <div
                        key={mIdx}
                        className="bg-slate-900/60 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between text-xs"
                      >
                        <span className="text-slate-200 font-medium">{med}</span>
                        <span className="text-[10px] text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded">
                          Priority Stock
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Column: Information & Actions */}
        <div className="space-y-6">
          {/* How It Works Card */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
              How the Early Alert Engine Works
            </h3>
            <ul className="space-y-3 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center flex-shrink-0">1</span>
                <span>Patients chat in Romanized Hindi/Kannada or have live consultations.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center flex-shrink-0">2</span>
                <span>The AI extracts symptom entities and matches them to postal pincodes.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center flex-shrink-0">3</span>
                <span>When reports exceed threshold X in 24h, an instant STOMP push & Resend email advisory triggers.</span>
              </li>
            </ul>
          </div>

          {/* Quick Simulation / Test */}
          <div className="bg-indigo-950/30 border border-indigo-800/40 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-indigo-200 mb-2">Simulate Outbreak Surge</h3>
            <p className="text-xs text-indigo-300/80 mb-4">
              Trigger a test query to verify STOMP broadcasting and the threshold calculation engine.
            </p>
            <button
              onClick={async () => {
                await fetch(`${API_BASE}/api/pharmacy/log-query`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    queryText: 'Mujhe 3 din se tez bukhar aur platelets kam ho rahe hain',
                    condition: 'dengue',
                    pincode: pincode,
                    language: 'Hindi (Romanized)',
                  }),
                });
                fetchAlerts(pincode);
              }}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
            >
              Log Test Dengue Query <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
