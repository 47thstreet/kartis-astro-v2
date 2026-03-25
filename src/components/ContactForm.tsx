"use client";

import { useState } from 'react';
import { Loader2, ArrowRight, User, Mail, Building2, MessageSquare } from 'lucide-react';

export default function ContactForm() {
  const [ok, setOk] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(form.entries())),
      });
      if (!res.ok) throw new Error();
      setOk(true);
      (e.target as HTMLFormElement).reset();
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { id: 'name',  label: 'Name',  type: 'text',  Icon: User,      autoComplete: 'name',         placeholder: 'Your name' },
    { id: 'email', label: 'Email', type: 'email', Icon: Mail,      autoComplete: 'email',        placeholder: 'you@example.com' },
    { id: 'venue', label: 'Venue', type: 'text',  Icon: Building2, autoComplete: 'organization', placeholder: 'Venue or company name' },
  ];

  return (
    <div className="relative rounded-2xl overflow-hidden"
      style={{ background: "rgba(255,255,255,0.02)", boxShadow: "0 0 0 1px rgba(255,255,255,0.05), 0 24px 48px rgba(0,0,0,0.3)" }}>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400/20 to-transparent" />
      <form onSubmit={submit} className="p-6 space-y-4">
        {fields.map(({ id, label, type, Icon, autoComplete, placeholder }) => (
          <div key={id} className="space-y-1.5">
            <label htmlFor={id} className="text-[11px] font-semibold uppercase tracking-widest text-white/30">{label}</label>
            <div className={`relative rounded-xl ring-1 transition-all duration-200 ${focused === id ? 'ring-violet-500/50 shadow-[0_0_20px_rgba(124,58,237,0.1)]' : 'ring-white/[0.06]'}`}>
              <Icon className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200 ${focused === id ? 'text-violet-400/70' : 'text-white/20'}`} />
              <input id={id} name={id} type={type} required autoComplete={autoComplete} placeholder={placeholder}
                onFocus={() => setFocused(id)} onBlur={() => setFocused(null)}
                className="w-full bg-transparent py-3 pl-10 pr-4 text-sm text-white/80 placeholder:text-white/20 outline-none rounded-xl" />
            </div>
          </div>
        ))}
        <div className="space-y-1.5">
          <label htmlFor="message" className="text-[11px] font-semibold uppercase tracking-widest text-white/30">Message</label>
          <div className={`relative rounded-xl ring-1 transition-all duration-200 ${focused === 'message' ? 'ring-violet-500/50 shadow-[0_0_20px_rgba(124,58,237,0.1)]' : 'ring-white/[0.06]'}`}>
            <MessageSquare className={`absolute left-3.5 top-3.5 w-4 h-4 transition-colors duration-200 ${focused === 'message' ? 'text-violet-400/70' : 'text-white/20'}`} />
            <textarea id="message" name="message" rows={4} placeholder="Tell us about your venue..."
              onFocus={() => setFocused('message')} onBlur={() => setFocused(null)}
              className="w-full bg-transparent py-3 pl-10 pr-4 text-sm text-white/80 placeholder:text-white/20 outline-none rounded-xl resize-none" />
          </div>
        </div>
        <button type="submit" disabled={loading}
          className="group relative w-full overflow-hidden flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white mt-2 disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, hsl(262 83% 58%), hsl(252 83% 53%))" }}>
          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <><span>Send request</span><ArrowRight className="w-4 h-4" /></>}
        </button>
        {ok && <p className="text-[12px] text-emerald-400/80 text-center">Received — we will be in touch soon.</p>}
        {error && <p className="text-[12px] text-red-400/80 text-center">Could not send request. Please try again.</p>}
      </form>
    </div>
  );
}
