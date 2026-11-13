'use client';

import React, { useState, useRef, useEffect } from 'react';
import Header from '../../../components/Header';
import {
  MessageSquare,
  Send,
  Sparkles,
  MapPin,
  Globe,
  AlertTriangle,
  Building2,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  Stethoscope
} from 'lucide-react';
import Link from 'next/link';

export default function MultilingualChatPage() {
  const [messages, setMessages] = useState([
    {
      id: 'm-init',
      sender: 'assistant',
      text: `Hello! I am your **Multilingual Medical AI Assistant**.

You can ask health questions in **English**, **Romanized Hindi (Hinglish)**, or **Romanized Kannada (Kanglish)**.

Please select your regional pincode so we can provide localized care and monitor regional health trends.`,
      detectedLang: 'English',
      isVernacular: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [pincode, setPincode] = useState('560001');
  const [loading, setLoading] = useState(false);
  const [surgeAlert, setSurgeAlert] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const samplePrompts = [
    { label: 'Hindi (Bukhar)', text: 'Mujhe 3 din se tez bukhar aur sar dard ho raha hai' },
    { label: 'Kannada (Jwara)', text: 'Nange tumba jwara mattu kemmu ide' },
    { label: 'English (Fever)', text: 'I have severe fever and body aches for 2 days' },
    { label: 'Dengue Query', text: 'Severe headache behind the eyes and high fever with chills' },
  ];

  const handleSend = async (textToSend) => {
    const query = textToSend || inputMessage;
    if (!query.trim() || loading) return;

    const userMsg = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      pincode,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:8080/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          pincode,
          userId: 'patient-web',
        }),
      });

      const data = await res.json();

      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: data.answer,
        detectedLang: data.detected_language,
        detectedCondition: data.detected_condition,
        isVernacular: data.isVernacular,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);

      if (data.surgeAlertCreated) {
        setSurgeAlert({
          condition: data.detected_condition,
          pincode: data.pincode,
          count: data.alertDetails?.queryCount || 5,
        });
      }
    } catch (_err) {
      // Offline fallback reply
      const fallbackMsg = {
        id: `bot-fallback-${Date.now()}`,
        sender: 'assistant',
        text: `**Symptom Assessment for "${query}":**\n\n• Maintain plenty of fluids (ORS, clean water).\n• Adequate bed rest.\n• For mild fever, Paracetamol 650mg may be taken after food.\n\n⚠️ **Statutory Disclaimer:** This AI assistant is for clinical decision support and does not replace medical advice. Visit a clinic if symptoms worsen.`,
        detectedLang: 'English (Fallback)',
        isVernacular: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 flex flex-col">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-6 border-b border-slate-800 gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Vernacular Clinical AI Assistant
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Medical intelligence supporting Romanized Hindi (Hinglish), Romanized Kannada (Kanglish), and English with automated disease surveillance.
            </p>
          </div>

          {/* Regional Pincode Selector */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl text-xs">
            <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="text-slate-400 font-medium">Regional Postal Code:</span>
            <select
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-white font-mono text-xs focus:outline-none"
            >
              <option value="560001">560001 (Bangalore Central)</option>
              <option value="560038">560038 (Indira Nagar)</option>
              <option value="560034">560034 (Koramangala)</option>
              <option value="560085">560085 (Banashankari)</option>
            </select>
          </div>
        </div>

        {/* Surge Alert Toast */}
        {surgeAlert && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shadow-amber-500/5">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 animate-bounce" />
              <div>
                <strong className="block text-amber-200">
                  Regional Outbreak Alert Triggered (Pincode {surgeAlert.pincode})
                </strong>
                <span>
                  Query threshold reached for <strong>{surgeAlert.condition}</strong> ({surgeAlert.count} queries in 24h). Local pharmacies notified via STOMP WebSocket!
                </span>
              </div>
            </div>

            <Link
              href="/pharmacy/alerts"
              className="px-3.5 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shrink-0 hover:bg-amber-400 transition"
            >
              <Building2 className="w-3.5 h-3.5" />
              View Pharmacy Outbreak Dashboard
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}

        {/* Chat History Container */}
        <div className="flex-1 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 flex flex-col overflow-hidden shadow-xl min-h-[440px]">
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {messages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <div key={m.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                  {/* Message Bubble */}
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-3.5 text-xs leading-relaxed ${
                      isUser
                        ? 'bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-600/20'
                        : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none'
                    }`}
                  >
                    {!isUser && (
                      <div className="flex flex-wrap items-center gap-2 mb-2 pb-2 border-b border-slate-800/80">
                        <span className="flex items-center gap-1 font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          <Globe className="w-3 h-3" />
                          Detected: {m.detectedLang}
                        </span>
                        {m.detectedCondition && (
                          <span className="font-mono text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                            Tag: {m.detectedCondition}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="whitespace-pre-wrap">{m.text}</div>

                    <div className={`mt-2 text-[10px] font-mono ${isUser ? 'text-blue-200' : 'text-slate-500'}`}>
                      {m.timestamp} {m.pincode ? `· Region: ${m.pincode}` : ''}
                    </div>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-400 p-3 bg-slate-950 border border-slate-800 rounded-2xl w-fit">
                <Sparkles className="w-4 h-4 text-blue-400 animate-spin" />
                <span>Translating & querying clinical knowledge base...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Vernacular Suggestions */}
          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <div className="text-[11px] text-slate-400 mb-2 flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Try sample vernacular prompt queries:
            </div>
            <div className="flex flex-wrap gap-2">
              {samplePrompts.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSend(p.text)}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 transition flex items-center gap-1.5"
                >
                  <span className="text-[9px] font-mono uppercase text-blue-400 font-bold">{p.label}:</span>
                  <span className="truncate max-w-[200px]">{p.text}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="mt-3 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Describe symptoms in Hindi, Kannada or English (e.g. mujhe 2 din se bukhar hai)..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              className="p-3 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white shadow-lg shadow-blue-600/30 transition flex items-center justify-center shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
