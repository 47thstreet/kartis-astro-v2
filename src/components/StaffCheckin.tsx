"use client";

import { useState } from 'react';
import { ScanLine, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

type ValidationResult = { valid?: boolean; message?: string; [key: string]: unknown };

export default function StaffCheckin() {
  const [token, setToken] = useState('');
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const verify = async () => {
    if (!token.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/qr/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrToken: token.trim() }),
      });
      const payload: ValidationResult = await res.json();
      setResult(payload);
    } catch {
      setResult({ valid: false, message: 'Network error.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-6 py-12 space-y-6">
      <div className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/20">Staff</p>
        <h1 className="text-3xl font-black text-white">QR Check-in</h1>
      </div>

      <div className="rounded-2xl p-6 space-y-4"
        style={{ background: "rgba(255,255,255,0.02)", boxShadow: "0 0 0 1px rgba(255,255,255,0.05)" }}>
        <div className="space-y-1.5">
          <label htmlFor="qrToken" className="text-[11px] font-semibold uppercase tracking-widest text-white/30">QR Token</label>
          <div className="relative rounded-xl ring-1 ring-white/[0.06] focus-within:ring-violet-500/40 transition-all duration-200">
            <ScanLine className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input
              id="qrToken" inputMode="text" autoCapitalize="none" autoCorrect="off" autoFocus
              value={token} onChange={e => setToken(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void verify(); }}}
              placeholder="Paste or scan QR token"
              className="w-full bg-transparent py-3 pl-10 pr-4 text-sm text-white/80 placeholder:text-white/20 outline-none rounded-xl"
            />
          </div>
          <p className="text-[11px] text-white/20">Hardware scanners submit with Enter automatically.</p>
        </div>

        <button onClick={() => void verify()} disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, hsl(262 83% 58%), hsl(252 83% 53%))" }}>
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Validating…</> : <><ScanLine className="w-4 h-4" /> Validate</>}
        </button>
      </div>

      {result && (
        <div className={`rounded-2xl p-5 flex items-start gap-4 ${result.valid ? 'bg-emerald-500/8 ring-1 ring-emerald-500/20' : 'bg-red-500/8 ring-1 ring-red-500/20'}`}>
          {result.valid
            ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            : <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />}
          <div>
            <p className={`text-sm font-bold ${result.valid ? 'text-emerald-400' : 'text-red-400'}`}>
              {result.valid ? 'Valid — Allow entry' : 'Rejected — Deny entry'}
            </p>
            {result.message && <p className="text-[12px] text-white/40 mt-0.5">{result.message}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
