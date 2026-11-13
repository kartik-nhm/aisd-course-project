'use client';

import React, { useState, useRef, useEffect } from 'react';
import Header from '../../../components/Header';
import {
  Send,
  Sparkles,
  MapPin,
  Globe,
  AlertTriangle,
  Building2,
  ArrowRight,
  Home,
  Pill,
  ShieldAlert,
  Bot,
  User,
  Zap,
  MessageCircle,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';

/* ─── Tiny markdown-to-JSX renderer for inline text ─── */
function InlineText({ text }) {
  // Splits on **bold** and renders spans
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

/* ─── Section icon resolver ─── */
function SectionIcon({ type, className }) {
  if (type === 'home') return <Home className={className} />;
  if (type === 'pill') return <Pill className={className} />;
  if (type === 'alert') return <ShieldAlert className={className} />;
  return <Sparkles className={className} />;
}

/* ─── Rendered AI message card ─── */
function AssistantMessage({ message, isLatest }) {
  const hasSections = message.sections && message.sections.length > 0;

  return (
    <div
      className={`flex items-start gap-3 ${isLatest ? 'animate-slideIn' : ''}`}
    >
      {/* Avatar */}
      <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/25 flex items-center justify-center shrink-0 mt-0.5">
        <Bot className="w-4 h-4 text-blue-400" />
      </div>

      <div className="flex-1 min-w-0 max-w-[88%]">
        {/* Language / condition chips */}
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          {message.detectedLang && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Globe className="w-3 h-3" />
              {message.detectedLang}
            </span>
          )}
          {message.detectedCondition && message.detectedCondition !== 'general' && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 capitalize">
              <Zap className="w-3 h-3" />
              {message.detectedCondition}
            </span>
          )}
        </div>

        {/* Summary / intro line */}
        {message.answer && (
          <p className="text-sm text-slate-200 leading-relaxed mb-3">
            <InlineText text={message.answer} />
          </p>
        )}

        {/* Structured Sections */}
        {hasSections && (
          <div className="space-y-3">
            {message.sections.map((section, si) => {
              const isAlert = section.icon === 'alert';
              return (
                <div
                  key={si}
                  className={`rounded-xl p-3.5 ${
                    isAlert
                      ? 'bg-rose-500/8 border border-rose-500/20'
                      : 'bg-slate-900/80 border border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <SectionIcon
                      type={section.icon}
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isAlert ? 'text-rose-400' : 'text-blue-400'
                      }`}
                    />
                    <span
                      className={`text-xs font-semibold ${
                        isAlert ? 'text-rose-300' : 'text-slate-200'
                      }`}
                    >
                      {section.heading}
                    </span>
                  </div>
                  {section.subtext && (
                    <p className="text-[11px] text-slate-400 mb-2 italic">{section.subtext}</p>
                  )}
                  <ul className="space-y-1.5">
                    {section.items.map((item, ii) => (
                      <li key={ii} className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed">
                        <span
                          className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                            isAlert ? 'bg-rose-400' : 'bg-blue-500'
                          }`}
                        />
                        <InlineText text={item} />
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}

        {/* Fallback plain text (no sections — offline mode) */}
        {!hasSections && !message.sections && message.text && message.text !== message.answer && (
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
            {message.text}
          </p>
        )}

        {/* Disclaimer */}
        {message.disclaimer && (
          <div className="mt-3 flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/8 border border-amber-500/15">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-200/80 leading-relaxed">{message.disclaimer}</p>
          </div>
        )}

        <div className="mt-2 text-[10px] text-slate-500 font-mono">{message.timestamp}</div>
      </div>
    </div>
  );
}

/* ─── User message bubble ─── */
function UserMessage({ message }) {
  return (
    <div className="flex items-start gap-3 justify-end animate-slideInRight">
      <div className="max-w-[75%]">
        <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed shadow-sm shadow-blue-600/20">
          {message.text}
        </div>
        <div className="mt-1 text-[10px] text-slate-500 font-mono text-right">
          {message.timestamp}
          {message.pincode && <span className="ml-1.5 text-slate-600">· {message.pincode}</span>}
        </div>
      </div>
      <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
        <User className="w-4 h-4 text-slate-300" />
      </div>
    </div>
  );
}

/* ─── Animated typing indicator ─── */
function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 animate-slideIn">
      <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/25 flex items-center justify-center shrink-0">
        <Bot className="w-4 h-4 text-blue-400" />
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }} />
        <span className="ml-1.5 text-xs text-slate-400">Analyzing query...</span>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function MultilingualChatPage() {
  const [messages, setMessages] = useState([
    {
      id: 'm-init',
      sender: 'assistant',
      answer: 'Hello! I\'m your Multilingual Medical AI Assistant. Ask health questions in English, Romanized Hindi (Hinglish), or Romanized Kannada (Kanglish) and I\'ll provide personalized clinical guidance.',
      sections: null,
      disclaimer: null,
      detectedLang: null,
      detectedCondition: null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [pincode, setPincode] = useState('560001');
  const [loading, setLoading] = useState(false);
  const [surgeAlert, setSurgeAlert] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const samplePrompts = [
    { label: 'Hinglish', text: 'Mujhe 3 din se tez bukhar aur sar dard ho raha hai', lang: 'hi' },
    { label: 'Kanglish', text: 'Nange tumba jwara mattu kemmu ide', lang: 'kn' },
    { label: 'Dengue', text: 'Severe headache behind the eyes, high fever and skin rash with chills', lang: 'en' },
    { label: 'Allergy', text: 'I have skin rash and itching after taking a new medicine', lang: 'en' },
    { label: 'Cough', text: 'Mujhe khansi aur gale mein dard 4 din se hai', lang: 'hi' },
    { label: 'Stomach', text: 'Pet mein dard aur ulti ka mann ho raha hai', lang: 'hi' },
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
        body: JSON.stringify({ message: query, pincode, userId: 'patient-web' }),
      });

      const data = await res.json();

      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        answer: data.answer,
        sections: data.sections || null,
        disclaimer: data.disclaimer || null,
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
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-fallback-${Date.now()}`,
          sender: 'assistant',
          answer: `Symptom assessment for "${query}":`,
          sections: [
            {
              heading: 'General Care Guidance',
              icon: 'home',
              items: [
                'Maintain plenty of fluids (ORS, clean water, warm soups).',
                'Adequate bed rest in a well-ventilated room.',
                'For mild fever, Paracetamol 650mg may be taken after food.',
              ],
            },
            {
              heading: 'Red Flag Warning Signs',
              icon: 'alert',
              subtext: 'Seek immediate medical care if you notice:',
              items: [
                'Persistent high fever (>102°F) for more than 3 days.',
                'Difficulty breathing or chest pain.',
                'Sudden confusion, stiff neck, or loss of consciousness.',
              ],
            },
          ],
          disclaimer: '⚠️ This AI assistant is for clinical decision support and does not replace medical advice. Visit a clinic if symptoms worsen.',
          detectedLang: 'English',
          detectedCondition: null,
          isVernacular: false,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(12px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .animate-slideIn      { animation: slideIn 0.28s cubic-bezier(0.22,1,0.36,1) both; }
        .animate-slideInRight { animation: slideInRight 0.24s cubic-bezier(0.22,1,0.36,1) both; }
      `}</style>

      <Header />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-5 border-b border-slate-800 gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-blue-600/15 border border-blue-500/25 flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-blue-400" />
              </div>
              <h1 className="text-lg font-bold tracking-tight text-white">
                Vernacular Clinical AI
              </h1>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              English · Hinglish · Kanglish · Regional disease surveillance
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
            <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="text-slate-400">Region:</span>
            <select
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              className="bg-transparent text-white font-mono text-xs focus:outline-none cursor-pointer"
            >
              <option value="560001">560001 · Bangalore Central</option>
              <option value="560038">560038 · Indira Nagar</option>
              <option value="560034">560034 · Koramangala</option>
              <option value="560085">560085 · Banashankari</option>
            </select>
          </div>
        </div>

        {/* Surge Alert Banner */}
        {surgeAlert && (
          <div className="mb-5 p-3.5 rounded-xl bg-amber-500/8 border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-slideIn">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-200">
                  Regional Outbreak Alert — Pincode {surgeAlert.pincode}
                </p>
                <p className="text-xs text-amber-300/70 mt-0.5">
                  {surgeAlert.count} queries for <strong className="capitalize">{surgeAlert.condition}</strong> in 24h. Pharmacies notified via STOMP.
                </p>
              </div>
            </div>
            <Link
              href="/pharmacy/alerts"
              className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-semibold text-xs flex items-center gap-1.5 hover:bg-amber-400 transition"
            >
              <Building2 className="w-3 h-3" />
              Pharmacy Dashboard
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}

        {/* Chat Window */}
        <div className="flex-1 flex flex-col bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 min-h-[460px] max-h-[560px] scroll-smooth">
            {messages.map((m, idx) => {
              const isUser = m.sender === 'user';
              const isLatest = idx === messages.length - 1;
              if (isUser) return <UserMessage key={m.id} message={m} />;
              return <AssistantMessage key={m.id} message={m} isLatest={isLatest} />;
            })}

            {loading && <TypingIndicator />}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="px-4 pt-3 pb-2 border-t border-slate-800/60 bg-slate-950/60">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Sample queries</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {samplePrompts.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSend(p.text)}
                  disabled={loading}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-[11px] text-slate-300 transition disabled:opacity-40 flex items-center gap-1.5"
                >
                  <span className={`text-[9px] font-bold uppercase tracking-wide ${
                    p.lang === 'hi' ? 'text-amber-400' :
                    p.lang === 'kn' ? 'text-emerald-400' :
                    'text-blue-400'
                  }`}>{p.label}</span>
                  <span className="truncate max-w-[180px]">{p.text}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Input Bar */}
          <div className="p-3 border-t border-slate-800 bg-slate-950/80">
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Describe symptoms in Hindi, Kannada or English…"
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 transition"
              />
              <button
                type="submit"
                disabled={loading || !inputMessage.trim()}
                className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white transition flex items-center justify-center shrink-0"
              >
                {loading
                  ? <RefreshCw className="w-4 h-4 animate-spin" />
                  : <Send className="w-4 h-4" />
                }
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
