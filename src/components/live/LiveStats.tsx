'use client';

import { useEffect, useState } from 'react';
import Pusher from 'pusher-js';

type Props = {
  eventId: string;
  initialPaid: number;
  initialPending: number;
  initialTotal: number;
  initialCheckedIn: number;
  pusherKey: string | null;
  pusherCluster: string | null;
};

export default function LiveStats({ eventId, initialPaid, initialPending, initialTotal, initialCheckedIn, pusherKey, pusherCluster }: Props) {
  const [paid, setPaid] = useState(initialPaid);
  const [pending, setPending] = useState(initialPending);
  const [total, setTotal] = useState(initialTotal);
  const [checkedIn, setCheckedIn] = useState(initialCheckedIn);
  const [lastEvent, setLastEvent] = useState<string | null>(null);

  useEffect(() => {
    if (!pusherKey || !pusherCluster) return;

    const pusher = new Pusher(pusherKey, { cluster: pusherCluster });
    const channel = pusher.subscribe(`event-${eventId}`);

    channel.bind('order-paid', (data: any) => {
      setPaid((v) => v + 1);
      setTotal((v) => v + 1);
      setPending((v) => Math.max(0, v - 1));
      setLastEvent(`Order paid — ${data.email}`);
      setTimeout(() => setLastEvent(null), 5000);
    });

    channel.bind('guest-checkin', (data: any) => {
      setCheckedIn((v) => v + 1);
      setLastEvent(`Checked in — ${data.attendeeName}`);
      setTimeout(() => setLastEvent(null), 5000);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`event-${eventId}`);
      pusher.disconnect();
    };
  }, [eventId, pusherKey, pusherCluster]);

  const stats = [
    { label: 'Paid orders', value: paid, color: 'text-emerald-400' },
    { label: 'Pending', value: pending, color: 'text-amber-400' },
    { label: 'Total orders', value: total, color: 'text-white/70' },
    { label: 'Checked in', value: checkedIn, color: 'text-violet-400' },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.02)', boxShadow: '0 0 0 1px rgba(255,255,255,0.05)' }}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-1">{label}</p>
            <p className={`text-2xl font-black ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {lastEvent && (
        <div className="rounded-xl bg-violet-500/10 border border-violet-500/20 px-4 py-2.5 text-sm text-violet-300 animate-pulse">
          {lastEvent}
        </div>
      )}
    </div>
  );
}
