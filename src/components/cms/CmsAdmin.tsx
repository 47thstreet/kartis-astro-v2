'use client';

import { useEffect, useState } from 'react';

const DEFAULT_SECRET = 'tbp-admin-2024';
const TOKEN_KEY = 'kartis-cms-token';

type EntryMode = 'manual' | 'wrap' | 'import';

interface CmsEvent {
  id: string;
  name: string;
  date: string;
  time: string;
  venue: string;
  location: string;
  description: string;
  image: string;
  imageUrl?: string;
  source: 'posh' | 'vibe' | 'both';
  ticketUrl?: string;
  priceCents?: number;
  featured: boolean;
  partners: string[];
  price?: string;
  ageRestriction?: string;
  dressCode?: string;
}

const EMPTY: Partial<CmsEvent> = {
  name: '', date: '', time: '', venue: '', location: '', description: '',
  image: '', imageUrl: '', source: 'vibe', ticketUrl: '', priceCents: 0, featured: false,
  partners: [], price: '', ageRestriction: '21+', dressCode: '',
};

export default function CmsAdmin({ locale }: { locale: string }) {
  const [token, setToken] = useState<string>(() => typeof window !== 'undefined' ? (localStorage.getItem(TOKEN_KEY) ?? '') : '');
  const [authed, setAuthed] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [authError, setAuthError] = useState('');

  const [events, setEvents] = useState<CmsEvent[]>([]);
  const [editing, setEditing] = useState<Partial<CmsEvent> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const [entryMode, setEntryMode] = useState<EntryMode>('manual');
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);

  function headers() {
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
  }

  async function load(t = token) {
    try {
      const res = await fetch('/api/cms/events', { headers: { 'Authorization': `Bearer ${t}` } });
      if (res.status === 401) { setAuthed(false); setAuthError('Wrong password.'); return; }
      if (!res.ok) throw new Error('Failed to load events');
      setEvents(await res.json());
      setAuthed(true);
      setAuthError('');
    } catch {
      setError('Could not load events.');
    }
  }

  function login() {
    const t = tokenInput.trim() || DEFAULT_SECRET;
    localStorage.setItem(TOKEN_KEY, t);
    setToken(t);
    load(t);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken('');
    setAuthed(false);
  }

  useEffect(() => { if (token) load(); }, []);

  async function save() {
    if (!editing) return;
    setSaving(true);
    setError('');
    try {
      const res = isNew
        ? await fetch('/api/cms/events', { method: 'POST', headers: headers(), body: JSON.stringify(editing) })
        : await fetch(`/api/cms/events/${editing.id}`, { method: 'PUT', headers: headers(), body: JSON.stringify(editing) });
      if (!res.ok) throw new Error(await res.text());
      setEditing(null);
      setEntryMode('manual');
      setImportUrl('');
      await load();
    } catch {
      setError('Failed to save event.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this event?')) return;
    setError('');
    try {
      const res = await fetch(`/api/cms/events/${id}`, { method: 'DELETE', headers: headers() });
      if (!res.ok) throw new Error();
      await load();
    } catch {
      setError('Failed to delete event.');
    }
  }

  async function handleImport() {
    if (!importUrl.trim()) return;
    setImporting(true);
    setError('');
    try {
      const res = await fetch('/api/cms/import-event', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ url: importUrl.trim() }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setEditing(p => ({ ...p, ...data, ticketUrl: importUrl.trim() }));
    } catch {
      setError('Failed to import from URL.');
    } finally {
      setImporting(false);
    }
  }

  // Build checkout preview URL
  function previewUrl(event: CmsEvent) {
    const params = new URLSearchParams({
      name: event.name,
      price: String(event.priceCents ?? 0),
      currency: 'USD',
      ref: event.ticketUrl ?? '',
      date: `${event.date} ${event.time}`,
      location: `${event.venue}${event.location ? ', ' + event.location : ''}`,
      desc: event.description,
    });
    return `/${locale}/checkout/external?${params}`;
  }

  // ── Auth screen ──
  if (!authed) {
    return (
      <div className="min-h-screen bg-[#05050a] flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-violet-500/15 ring-1 ring-violet-500/25 flex items-center justify-center">
              <svg className="w-5 h-5 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </div>
            <div>
              <h1 className="font-black text-xl text-white">Kartis CMS</h1>
              <p className="text-sm text-white/30 mt-1">Event management console</p>
            </div>
          </div>
          {authError && <p className="text-red-400 text-sm text-center">{authError}</p>}
          <div className="rounded-2xl p-6 space-y-4" style={{ background: 'rgba(255,255,255,0.02)', boxShadow: '0 0 0 1px rgba(255,255,255,0.06)' }}>
            <input
              type="password"
              placeholder="Admin password"
              value={tokenInput}
              onChange={e => setTokenInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && login()}
              className="w-full bg-white/[0.04] ring-1 ring-white/[0.08] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-violet-500/50 placeholder-white/20"
              autoFocus
            />
            <button onClick={login}
              className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, hsl(262 83% 58%), hsl(252 83% 48%))', boxShadow: '0 4px 24px rgba(124,58,237,0.25)' }}>
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filtered = events.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.location?.toLowerCase().includes(search.toLowerCase()) ||
    e.venue?.toLowerCase().includes(search.toLowerCase())
  );
  const todayStr = new Date().toISOString().slice(0, 10);
  const upcoming = filtered.filter(e => e.date >= todayStr);
  const past = filtered.filter(e => e.date < todayStr);

  return (
    <div className="min-h-screen bg-[#05050a] text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-white/[0.06] backdrop-blur-xl" style={{ background: 'rgba(5,5,10,0.8)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 ring-1 ring-violet-500/30 flex items-center justify-center">
              <svg className="w-4 h-4 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </div>
            <div>
              <span className="text-sm font-black tracking-wide text-white/80">KARTIS</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-violet-400/60 ml-2">CMS</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" placeholder="Search events..." value={search} onChange={e => setSearch(e.target.value)}
                className="bg-white/[0.04] ring-1 ring-white/[0.08] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-violet-500/40 w-40 sm:w-52" />
            </div>
            <button onClick={() => { setEditing({ ...EMPTY }); setIsNew(true); setEntryMode('manual'); setImportUrl(''); }}
              className="px-4 py-2 rounded-lg font-semibold text-sm text-white whitespace-nowrap transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, hsl(262 83% 58%), hsl(252 83% 48%))' }}>
              + New Event
            </button>
            <a href={`/${locale}`} className="px-3 py-2 bg-white/[0.04] ring-1 ring-white/[0.06] rounded-lg text-sm text-white/40 hover:text-white/70 transition-colors">Home</a>
            <button onClick={logout} className="px-3 py-2 bg-white/[0.04] ring-1 ring-white/[0.06] rounded-lg text-sm text-white/25 hover:text-white/50 transition-colors">Sign out</button>
          </div>
        </div>
      </nav>

      {error && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-4">
          <div className="rounded-xl px-4 py-3 flex items-center justify-between text-sm" style={{ background: 'rgba(239,68,68,0.08)', boxShadow: '0 0 0 1px rgba(239,68,68,0.2)' }}>
            <span className="text-red-300">{error}</span>
            <button onClick={() => setError('')} className="text-red-400/60 hover:text-red-300 ml-3">✕</button>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          {[
            { label: 'Total', value: events.length, color: 'rgba(139,92,246,0.8)' },
            { label: 'Upcoming', value: events.filter(e => e.date >= todayStr).length, color: 'rgba(52,211,153,0.8)' },
            { label: 'Past', value: events.filter(e => e.date < todayStr).length, color: 'rgba(255,255,255,0.3)' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.02)', boxShadow: '0 0 0 1px rgba(255,255,255,0.05)' }}>
              <div className="text-3xl font-black mb-1" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-white/20">{s.label}</div>
            </div>
          ))}
        </div>

        <EventTable title="Upcoming" events={upcoming} onEdit={e => { setEditing(e); setIsNew(false); setEntryMode('manual'); }} onDelete={remove} onPreview={previewUrl} accent="rgba(52,211,153,0.8)" emptyText="No upcoming events." />
        <EventTable title="Past" events={past} onEdit={e => { setEditing(e); setIsNew(false); setEntryMode('manual'); }} onDelete={remove} onPreview={previewUrl} accent="rgba(255,255,255,0.2)" emptyText="Past events appear here automatically." />
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
            style={{ background: '#0c0c18', boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 32px 80px rgba(0,0,0,0.6)' }}>
            <div className="px-6 py-5 border-b border-white/[0.06] flex items-center justify-between flex-shrink-0">
              <h2 className="font-bold text-lg text-white">{isNew ? 'New Event' : 'Edit Event'}</h2>
              <button onClick={() => { setEditing(null); setEntryMode('manual'); setImportUrl(''); }} className="text-white/25 hover:text-white/60 text-xl transition-colors">✕</button>
            </div>
            <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">

              {/* Entry mode tabs */}
              {isNew && (
                <div className="flex gap-1 rounded-xl p-1" style={{ background: 'rgba(255,255,255,0.03)', boxShadow: '0 0 0 1px rgba(255,255,255,0.05)' }}>
                  {([
                    { key: 'manual', label: 'Manual' },
                    { key: 'wrap', label: 'Wrap Link' },
                    { key: 'import', label: 'Import from Link' },
                  ] as const).map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setEntryMode(tab.key)}
                      className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                        entryMode === tab.key
                          ? 'bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/25'
                          : 'text-white/30 hover:text-white/60'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Wrap / Import URL */}
              {(entryMode === 'wrap' || entryMode === 'import') && (
                <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(139,92,246,0.05)', boxShadow: '0 0 0 1px rgba(139,92,246,0.15)' }}>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-violet-400/50">
                    {entryMode === 'wrap' ? 'External ticket URL' : 'Import from URL'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={entryMode === 'wrap' ? (editing.ticketUrl ?? '') : importUrl}
                      onChange={e => {
                        if (entryMode === 'wrap') setEditing(p => ({ ...p, ticketUrl: e.target.value }));
                        else setImportUrl(e.target.value);
                      }}
                      placeholder="https://posh.vip/e/... or any event URL"
                      className="flex-1 bg-white/[0.04] ring-1 ring-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-white/15 focus:outline-none focus:ring-violet-500/40"
                    />
                    {entryMode === 'import' && (
                      <button
                        onClick={handleImport}
                        disabled={importing || !importUrl.trim()}
                        className="px-4 py-2 bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/25 rounded-lg text-sm font-semibold hover:bg-violet-500/25 transition disabled:opacity-40"
                      >
                        {importing ? 'Importing...' : 'Import'}
                      </button>
                    )}
                  </div>
                  {entryMode === 'wrap' && (
                    <p className="text-[11px] text-white/20">Kartis wraps this link. Buyers checkout through Kartis, original provider gets first+last name only.</p>
                  )}
                </div>
              )}

              {editing.imageUrl && <img src={editing.imageUrl} alt="Preview" className="w-full h-40 object-cover rounded-xl" />}
              <Field label="Event Name *" value={editing.name ?? ''} onChange={v => setEditing(p => ({ ...p, name: v }))} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Date *" type="date" value={editing.date ?? ''} onChange={v => setEditing(p => ({ ...p, date: v }))} />
                <Field label="Time" value={editing.time ?? ''} onChange={v => setEditing(p => ({ ...p, time: v }))} placeholder="10 PM - 4 AM" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Venue" value={editing.venue ?? ''} onChange={v => setEditing(p => ({ ...p, venue: v }))} />
                <Field label="City / Area" value={editing.location ?? ''} onChange={v => setEditing(p => ({ ...p, location: v }))} />
              </div>
              <Field label="Flyer Image URL" value={editing.imageUrl ?? ''} onChange={v => setEditing(p => ({ ...p, imageUrl: v }))} placeholder="https://..." />
              {entryMode === 'manual' && (
                <Field label="Ticket URL (optional)" value={editing.ticketUrl ?? ''} onChange={v => setEditing(p => ({ ...p, ticketUrl: v }))} placeholder="https://..." />
              )}
              <Field label="Description" value={editing.description ?? ''} onChange={v => setEditing(p => ({ ...p, description: v }))} multiline />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Price Label" value={editing.price ?? ''} onChange={v => setEditing(p => ({ ...p, price: v }))} placeholder="$35 GA, Free RSVP" />
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/25 mb-1.5">Price (cents)</label>
                  <input
                    type="number"
                    min={0}
                    value={editing.priceCents ?? 0}
                    onChange={e => setEditing(p => ({ ...p, priceCents: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-white/[0.04] ring-1 ring-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-violet-500/40"
                  />
                  <p className="text-[10px] text-white/15 mt-1">0 = free RSVP, 3500 = $35.00</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Age" value={editing.ageRestriction ?? ''} onChange={v => setEditing(p => ({ ...p, ageRestriction: v }))} />
                <Field label="Dress Code" value={editing.dressCode ?? ''} onChange={v => setEditing(p => ({ ...p, dressCode: v }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/25 mb-1.5">Source</label>
                  <select value={editing.source ?? 'vibe'} onChange={e => setEditing(p => ({ ...p, source: e.target.value as any }))}
                    className="w-full bg-white/[0.04] ring-1 ring-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-violet-500/40"
                    style={{ WebkitAppearance: 'none' }}>
                    <option value="vibe" style={{ background: '#0d0d18' }}>Vibe</option>
                    <option value="posh" style={{ background: '#0d0d18' }}>Posh</option>
                    <option value="both" style={{ background: '#0d0d18' }}>Both</option>
                  </select>
                </div>
                <Field label="Partners (comma separated)"
                  value={Array.isArray(editing.partners) ? editing.partners.join(', ') : ''}
                  onChange={v => setEditing(p => ({ ...p, partners: v.split(',').map(s => s.trim()).filter(Boolean) }))} />
              </div>
              <label className="flex items-center gap-3 cursor-pointer py-1">
                <input type="checkbox" checked={editing.featured ?? false}
                  onChange={e => setEditing(p => ({ ...p, featured: e.target.checked }))}
                  className="w-4 h-4 accent-violet-500 rounded" />
                <span className="text-sm text-white/50">Featured event</span>
              </label>
            </div>
            <div className="px-6 py-4 border-t border-white/[0.06] flex gap-3 flex-shrink-0">
              <button onClick={save} disabled={saving}
                className="flex-1 py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, hsl(262 83% 58%), hsl(252 83% 48%))' }}>
                {saving ? 'Saving...' : 'Save Event'}
              </button>
              <button onClick={() => { setEditing(null); setEntryMode('manual'); setImportUrl(''); }}
                className="px-6 py-3 bg-white/[0.04] ring-1 ring-white/[0.06] rounded-xl text-sm text-white/40 hover:text-white/70 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EventTable({ title, events, onEdit, onDelete, onPreview, accent, emptyText }: {
  title: string; events: CmsEvent[]; onEdit: (e: CmsEvent) => void; onDelete: (id: string) => void; onPreview: (e: CmsEvent) => string; accent: string; emptyText: string;
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
        <h2 className="text-sm font-bold uppercase tracking-widest text-white/30">{title}</h2>
        <span className="text-[11px] text-white/15">{events.length}</span>
      </div>
      {events.length === 0 ? (
        <div className="rounded-2xl px-6 py-8 text-center text-sm text-white/20" style={{ background: 'rgba(255,255,255,0.015)', boxShadow: '0 0 0 1px rgba(255,255,255,0.04)' }}>{emptyText}</div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.015)', boxShadow: '0 0 0 1px rgba(255,255,255,0.05)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-white/[0.05] text-[10px] font-bold uppercase tracking-widest text-white/20">
                  <th className="text-left px-4 py-3 w-14"></th>
                  <th className="text-left px-4 py-3">Event</th>
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-left px-4 py-3">Venue</th>
                  <th className="text-left px-4 py-3">Price</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      {event.imageUrl
                        ? <img src={event.imageUrl} alt="" width={40} height={40} className="w-10 h-10 object-cover rounded-lg ring-1 ring-white/[0.06]" />
                        : <div className="w-10 h-10 rounded-lg bg-white/[0.04] ring-1 ring-white/[0.06] flex items-center justify-center text-lg">{event.image || '🎫'}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white/75 truncate max-w-[200px]">{event.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {event.featured && <span className="text-[9px] font-bold uppercase tracking-wider text-violet-400/70">Featured</span>}
                        {event.ticketUrl && <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400/50">Wrapped</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-white/40 whitespace-nowrap text-[13px]">
                      {new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-white/40 truncate max-w-[120px] text-[13px]">{event.venue}</div>
                      <div className="text-white/15 text-[11px] truncate">{event.location}</div>
                    </td>
                    <td className="px-4 py-3 text-white/30 text-[13px]">{event.price || (event.priceCents ? `$${(event.priceCents/100).toFixed(0)}` : 'Free')}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a href={onPreview(event)} target="_blank" rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-white/[0.04] ring-1 ring-white/[0.06] rounded text-[11px] text-white/30 hover:text-white/60 transition-colors">Preview</a>
                        <button onClick={() => onEdit(event)}
                          className="px-2.5 py-1 bg-violet-500/10 ring-1 ring-violet-500/20 rounded text-[11px] text-violet-400/80 hover:bg-violet-500/20 transition-all">Edit</button>
                        <button onClick={() => onDelete(event.id)}
                          className="px-2.5 py-1 bg-red-500/8 ring-1 ring-red-500/15 rounded text-[11px] text-red-400/60 hover:bg-red-500/15 transition-all">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder = '', multiline = false }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; multiline?: boolean;
}) {
  const cls = "w-full bg-white/[0.04] ring-1 ring-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/15 focus:outline-none focus:ring-violet-500/40";
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-widest text-white/25 mb-1.5">{label}</label>
      {multiline
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} className={cls} />
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={cls} />}
    </div>
  );
}
