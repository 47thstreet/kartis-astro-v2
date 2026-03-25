'use client';

import { useMemo, useState } from 'react';
import { Loader2, Lock, ArrowRight, Mail, Minus, Plus, Ticket, Table2, AlertCircle } from 'lucide-react';

type Option = { id: string; name: string; priceLabel: string };
type PurchasePanelProps = { eventId: string; locale: string; tickets: Option[]; tables: Option[] };

export default function PurchasePanel({ eventId, locale, tickets, tables }: PurchasePanelProps) {
  const [email, setEmail] = useState('');
  const [mode, setMode] = useState<'ticket' | 'table'>(tickets.length > 0 ? 'ticket' : 'table');
  const [ticketTypeId, setTicketTypeId] = useState(tickets[0]?.id ?? '');
  const [tablePackageId, setTablePackageId] = useState(tables[0]?.id ?? '');
  const [ticketQty, setTicketQty] = useState(1);
  const [tableQty, setTableQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailOk = useMemo(() => /^\S+@\S+\.\S+$/.test(email), [email]);

  const selectedTicket = tickets.find(t => t.id === ticketTypeId);
  const selectedTable  = tables.find(t => t.id === tablePackageId);
  const selectedName   = mode === 'ticket' ? selectedTicket?.name  : selectedTable?.name;
  const selectedPrice  = mode === 'ticket' ? selectedTicket?.priceLabel : selectedTable?.priceLabel;
  const qty            = mode === 'ticket' ? ticketQty : tableQty;
  const setQty         = mode === 'ticket' ? setTicketQty : setTableQty;
  const maxQty         = mode === 'ticket' ? 10 : 4;

  const hasTickets = tickets.length > 0;
  const hasTables  = tables.length > 0;

  const checkout = async () => {
    setError(null);
    if (!emailOk) { setError('Enter a valid email to continue.'); return; }
    const body = {
      eventId, email, locale,
      tickets: mode === 'ticket' && ticketTypeId ? [{ ticketTypeId, quantity: ticketQty }] : [],
      tables:  mode === 'table'  && tablePackageId ? [{ tablePackageId, quantity: tableQty }] : [],
    };
    setLoading(true);
    try {
      const res = await fetch('/api/checkout/create-session', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error || 'Checkout failed');
      if (payload.checkoutUrl) { window.location.href = payload.checkoutUrl; return; }
      window.location.href = `/${locale}/app?order=${payload.orderId}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const nothing = !hasTickets && !hasTables;

  return (
    <div className="space-y-5">
      {/* Error */}
      {error && (
        <div className="flex items-center gap-2.5 rounded-xl px-4 py-3" style={{ background: 'rgba(239,68,68,0.08)', boxShadow: '0 0 0 1px rgba(239,68,68,0.2)' }}>
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Mode toggle */}
      {hasTickets && hasTables && (
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', boxShadow: '0 0 0 1px rgba(255,255,255,0.06)' }}>
          {[{ key: 'ticket' as const, label: 'Ticket', Icon: Ticket }, { key: 'table' as const, label: 'Table', Icon: Table2 }].map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-semibold transition-all duration-200 ${
                mode === key
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25'
                  : 'text-white/35 hover:text-white/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>
      )}

      {nothing ? (
        <p className="text-center text-sm text-white/25 py-4">No tickets or tables published yet.</p>
      ) : (
        <>
          {/* Selection */}
          {mode === 'ticket' && hasTickets && (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1.5">Ticket type</label>
              <select
                value={ticketTypeId}
                onChange={e => setTicketTypeId(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm text-white font-medium outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', boxShadow: '0 0 0 1px rgba(255,255,255,0.08)', WebkitAppearance: 'none' }}
              >
                {tickets.map(t => <option key={t.id} value={t.id} style={{ background: '#0d0d18' }}>{t.name} — {t.priceLabel}</option>)}
              </select>
            </div>
          )}

          {mode === 'table' && hasTables && (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1.5">Table package</label>
              <select
                value={tablePackageId}
                onChange={e => setTablePackageId(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm text-white font-medium outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', boxShadow: '0 0 0 1px rgba(255,255,255,0.08)', WebkitAppearance: 'none' }}
              >
                {tables.map(t => <option key={t.id} value={t.id} style={{ background: '#0d0d18' }}>{t.name} — {t.priceLabel}</option>)}
              </select>
            </div>
          )}

          {/* Qty stepper */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Quantity</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQty(q => Math.max(1, q - 1))}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white/70 transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)', boxShadow: '0 0 0 1px rgba(255,255,255,0.08)' }}
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="text-sm font-bold text-white w-4 text-center">{qty}</span>
              <button
                onClick={() => setQty(q => Math.min(maxQty, q + 1))}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white/70 transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)', boxShadow: '0 0 0 1px rgba(255,255,255,0.08)' }}
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Summary */}
          {selectedName && (
            <div className="rounded-xl px-4 py-3 flex items-center justify-between"
              style={{ background: 'rgba(255,255,255,0.03)', boxShadow: '0 0 0 1px rgba(255,255,255,0.06)' }}>
              <span className="text-[13px] text-white/45 truncate pr-4">{qty} × {selectedName}</span>
              <span className="text-[13px] font-bold text-white/80 shrink-0">{selectedPrice}</span>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1.5">Your email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  boxShadow: email && emailOk
                    ? '0 0 0 1px rgba(139,92,246,0.5), 0 0 0 3px rgba(139,92,246,0.12)'
                    : '0 0 0 1px rgba(255,255,255,0.08)',
                }}
              />
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={() => void checkout()}
            disabled={loading}
            className="group relative w-full overflow-hidden rounded-xl py-3.5 text-sm font-bold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, hsl(262 83% 60%), hsl(252 83% 50%))',
              boxShadow: '0 4px 24px rgba(124,58,237,0.30)',
            }}
          >
            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
            {loading ? (
              <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Redirecting…</span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Lock className="w-3.5 h-3.5" />
                {mode === 'ticket' ? 'Buy Ticket' : 'Reserve Table'}
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-200" />
              </span>
            )}
          </button>

          <p className="text-[11px] text-center text-white/20">Secured by Stripe · 256-bit encryption</p>
        </>
      )}
    </div>
  );
}
