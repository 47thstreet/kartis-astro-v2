"use client";

import { useState } from "react";
import { Loader2, Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";
import { validateLogin, type FieldError } from "../lib/validate";

interface LoginFormProps {
  callbackUrl?: string;
}

export default function LoginForm({ callbackUrl = "/" }: LoginFormProps) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  const [focused, setFocused]   = useState<string | null>(null);

  const fieldError = (field: string) => fieldErrors.find(e => e.field === field)?.message;
  const hasFieldError = (field: string) => fieldErrors.some(e => e.field === field);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateLogin(email, password);
    setFieldErrors(errors);
    if (errors.length > 0) return;

    setLoading(true);
    setError(null);

    try {
      const csrfRes = await fetch("/api/auth/csrf");
      const { csrfToken } = await csrfRes.json();

      const res = await fetch("/api/auth/callback/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ email, password, callbackUrl, redirect: "false", csrfToken }),
        redirect: "manual",
      });

      if (res.status === 200 || res.status === 302 || res.type === "opaqueredirect") {
        window.location.href = callbackUrl;
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? "Invalid email or password.");
        setLoading(false);
      }
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && (
        <div className="flex items-start gap-2.5 rounded-xl px-4 py-3 text-[12px] text-red-400 ring-1 ring-red-500/20"
          style={{ background: "rgba(239,68,68,0.07)" }}>
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Email */}
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-[11px] font-bold uppercase tracking-widest text-white/30">Email</label>
        <div className={`relative rounded-xl ring-1 transition-all duration-200 ${hasFieldError("email") ? "ring-red-500/40" : focused === "email" ? "ring-violet-500/50 shadow-[0_0_20px_rgba(124,58,237,0.1)]" : "ring-white/[0.06]"}`}>
          <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200 ${hasFieldError("email") ? "text-red-400/70" : focused === "email" ? "text-violet-400/70" : "text-white/20"}`} />
          <input
            id="email" type="email" autoComplete="email" placeholder="you@example.com"
            value={email} onChange={e => { setEmail(e.target.value); setFieldErrors(f => f.filter(x => x.field !== "email")); }}
            onFocus={() => setFocused("email")} onBlur={() => setFocused(null)}
            className="w-full bg-transparent py-3 pl-10 pr-4 text-sm text-white/80 placeholder:text-white/20 outline-none rounded-xl"
          />
        </div>
        {fieldError("email") && <p className="text-[11px] text-red-400/80">{fieldError("email")}</p>}
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <label htmlFor="password" className="text-[11px] font-bold uppercase tracking-widest text-white/30">Password</label>
        <div className={`relative rounded-xl ring-1 transition-all duration-200 ${hasFieldError("password") ? "ring-red-500/40" : focused === "password" ? "ring-violet-500/50 shadow-[0_0_20px_rgba(124,58,237,0.1)]" : "ring-white/[0.06]"}`}>
          <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200 ${hasFieldError("password") ? "text-red-400/70" : focused === "password" ? "text-violet-400/70" : "text-white/20"}`} />
          <input
            id="password" type="password" autoComplete="current-password" placeholder="Enter your password"
            value={password} onChange={e => { setPassword(e.target.value); setFieldErrors(f => f.filter(x => x.field !== "password")); }}
            onFocus={() => setFocused("password")} onBlur={() => setFocused(null)}
            className="w-full bg-transparent py-3 pl-10 pr-4 text-sm text-white/80 placeholder:text-white/20 outline-none rounded-xl"
          />
        </div>
        {fieldError("password") && <p className="text-[11px] text-red-400/80">{fieldError("password")}</p>}
      </div>

      <button
        type="submit" disabled={loading}
        className="group relative w-full overflow-hidden flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-50 mt-2"
        style={{ background: "linear-gradient(135deg, hsl(262 83% 58%), hsl(252 83% 53%))" }}
      >
        <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</>
          : <><span>Sign in</span><ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" /></>
        }
      </button>
    </form>
  );
}
