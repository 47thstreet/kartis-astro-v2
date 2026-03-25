'use client';

import { useState } from 'react';

type Venue = { id: string; name: string };

export default function CreateEventForm({ venues, locale }: { venues: Venue[]; locale: string }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const fd = new FormData(e.currentTarget);

    const startsAt = fd.get('startsAt') as string;
    const endsAt = fd.get('endsAt') as string;
    const ticketName = (fd.get('ticketName') as string)?.trim();

    const body: any = {
      name: fd.get('name'),
      description: fd.get('description') || '',
      venueId: fd.get('venueId'),
      startsAt,
      endsAt,
      capacity: Number(fd.get('capacity')),
      currency: (fd.get('currency') as string) || 'USD',
      flyerImage: (fd.get('flyerImage') as string)?.trim() || undefined,
      tickets: [],
    };

    // Add a ticket type if filled
    if (ticketName) {
      body.tickets.push({
        name: ticketName,
        description: '',
        priceCents: Math.round(Number(fd.get('ticketPrice') || 0) * 100),
        capacity: Number(fd.get('ticketCapacity') || body.capacity),
        saleStart: startsAt,
        saleEnd: endsAt,
      });
    }

    try {
      const res = await fetch('/api/organizer/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create event');
      }

      const { data } = await res.json();
      window.location.href = `/${locale}/app/organizer/events`;
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full h-10 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white placeholder-white/30 outline-none focus:border-violet-500/50 transition-colors';
  const labelClass = 'block text-[12px] font-semibold text-white/40 mb-1.5';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Event basics */}
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Event Name *</label>
          <input name="name" required placeholder="e.g. Friday Night Live" className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <textarea
            name="description"
            rows={3}
            placeholder="Tell people what to expect…"
            className={`${inputClass} h-auto py-2.5`}
          />
        </div>

        <div>
          <label className={labelClass}>Flyer Image URL</label>
          <input name="flyerImage" type="url" placeholder="https://example.com/flyer.jpg" className={inputClass} />
          <p className="text-[11px] text-white/20 mt-1">Paste a direct link to your event flyer image</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Venue *</label>
            <select name="venueId" required className={inputClass}>
              <option value="">Select venue</option>
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Capacity *</label>
            <input name="capacity" type="number" required min={1} placeholder="500" className={inputClass} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Starts At *</label>
            <input name="startsAt" type="datetime-local" required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Ends At *</label>
            <input name="endsAt" type="datetime-local" required className={inputClass} />
          </div>
        </div>

        <div>
          <label className={labelClass}>Currency</label>
          <select name="currency" className={inputClass}>
            <option value="USD">USD</option>
            <option value="ILS">ILS</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
        </div>
      </div>

      {/* Quick ticket type */}
      <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-5 space-y-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/20">First Ticket Type (optional)</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={labelClass}>Name</label>
            <input name="ticketName" placeholder="General Admission" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Price</label>
            <input name="ticketPrice" type="number" step="0.01" min={0} placeholder="25.00" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Qty Available</label>
            <input name="ticketCapacity" type="number" min={1} placeholder="200" className={inputClass} />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="h-11 w-full rounded-xl bg-violet-600 font-semibold text-white hover:bg-violet-500 disabled:opacity-60 transition-colors"
      >
        {submitting ? 'Creating…' : 'Create Event'}
      </button>
    </form>
  );
}
