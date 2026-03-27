'use client';

import { useEffect, useState } from 'react';

type LogEntry = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actor: { name: string; email: string } | null;
  createdAt: string;
};

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  ORDER_PAID: { label: 'Order paid', color: 'text-emerald-400' },
  ORDER_EXPIRED: { label: 'Order expired', color: 'text-amber-400' },
  ORDER_REFUNDED: { label: 'Order refunded', color: 'text-red-400' },
  EVENT_CREATED: { label: 'Event created', color: 'text-violet-400' },
  PAYOUT_REQUESTED: { label: 'Payout requested', color: 'text-sky-400' },
  PAYOUT_APPROVED: { label: 'Payout approved', color: 'text-emerald-400' },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function ActivityFeed() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const load = async (c?: string) => {
    setLoading(true);
    try {
      const url = `/api/reports/activity?limit=30${c ? `&cursor=${c}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (c) {
        setLogs((prev) => [...prev, ...data.data]);
      } else {
        setLogs(data.data);
      }
      setCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading && logs.length === 0) {
    return <div className="text-white/30 text-sm py-10 text-center">Loading activity...</div>;
  }

  if (logs.length === 0) {
    return (
      <div className="rounded-2xl p-12 text-center" style={{ background: 'rgba(255,255,255,0.02)', boxShadow: '0 0 0 1px rgba(255,255,255,0.05)' }}>
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ background: 'rgba(139,92,246,0.08)', boxShadow: '0 0 0 1px rgba(139,92,246,0.15)' }}>
          <svg className="w-6 h-6" style={{ color: 'rgba(139,92,246,0.7)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 8v4l3 3" /><circle cx="12" cy="12" r="10" />
          </svg>
        </div>
        <p className="text-sm font-bold text-white/50">No activity yet</p>
        <p className="mt-1.5 text-[12px] leading-relaxed text-white/25 max-w-xs mx-auto">
          Actions like ticket purchases, event creation, and payouts will appear here as they happen.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {logs.map((log) => {
        const meta = ACTION_LABELS[log.action] || { label: log.action, color: 'text-white/50' };
        return (
          <div key={log.id} className="flex items-center gap-4 rounded-xl px-4 py-3 hover:bg-white/[0.02] transition-colors">
            <div className={`w-2 h-2 rounded-full shrink-0 ${meta.color.replace('text-', 'bg-')}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white/70">
                <span className={`font-semibold ${meta.color}`}>{meta.label}</span>
                {' '}<span className="text-white/30">{log.entityType}</span>
                {log.actor && <span className="text-white/20"> by {log.actor.name || log.actor.email}</span>}
              </p>
            </div>
            <span className="text-[11px] text-white/20 shrink-0">{timeAgo(log.createdAt)}</span>
          </div>
        );
      })}

      {hasMore && (
        <button
          onClick={() => load(cursor!)}
          disabled={loading}
          className="w-full py-3 text-sm text-white/30 hover:text-white/50 transition-colors"
        >
          {loading ? 'Loading...' : 'Load more'}
        </button>
      )}
    </div>
  );
}
