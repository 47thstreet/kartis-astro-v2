'use client';

import { useEffect, useState } from 'react';

type ReportData = {
  event: { id: string; name: string; venue: string; startsAt: string; endsAt: string; capacity: number };
  revenue: { grossCents: number; refundedCents: number; netCents: number };
  orders: { total: number; paid: number; pending: number; refunded: number; failed: number };
  ticketSales: Array<{ id: string; name: string; priceCents: number; capacity: number; sold: number; revenueCents: number; utilization: number }>;
  tableSales: Array<{ id: string; name: string; priceCents: number; sold: number; revenueCents: number }>;
  checkIn: { totalPasses: number; checkedIn: number; rate: number };
  promoterStats: Array<{ code: string; promoterName: string; clicks: number; conversions: number; revenueCents: number; conversionRate: number }>;
  ordersByDay: Array<{ date: string; count: number; revenueCents: number }>;
};

function money(cents: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(cents / 100);
}

function downloadCSV(data: ReportData) {
  const rows: string[][] = [];

  rows.push(['Event Report', data.event.name]);
  rows.push(['Venue', data.event.venue]);
  rows.push(['Date', data.event.startsAt]);
  rows.push([]);

  rows.push(['Revenue Summary']);
  rows.push(['Gross', (data.revenue.grossCents / 100).toFixed(2)]);
  rows.push(['Refunded', (data.revenue.refundedCents / 100).toFixed(2)]);
  rows.push(['Net', (data.revenue.netCents / 100).toFixed(2)]);
  rows.push([]);

  rows.push(['Orders Summary']);
  rows.push(['Total', String(data.orders.total)]);
  rows.push(['Paid', String(data.orders.paid)]);
  rows.push(['Pending', String(data.orders.pending)]);
  rows.push(['Refunded', String(data.orders.refunded)]);
  rows.push([]);

  if (data.ticketSales.length > 0) {
    rows.push(['Ticket Type', 'Price', 'Sold', 'Capacity', 'Revenue', 'Utilization']);
    for (const t of data.ticketSales) {
      rows.push([t.name, (t.priceCents / 100).toFixed(2), String(t.sold), String(t.capacity), (t.revenueCents / 100).toFixed(2), `${t.utilization}%`]);
    }
    rows.push([]);
  }

  if (data.tableSales.length > 0) {
    rows.push(['Table Package', 'Price', 'Sold', 'Revenue']);
    for (const t of data.tableSales) {
      rows.push([t.name, (t.priceCents / 100).toFixed(2), String(t.sold), (t.revenueCents / 100).toFixed(2)]);
    }
    rows.push([]);
  }

  if (data.promoterStats.length > 0) {
    rows.push(['Promoter', 'Code', 'Clicks', 'Conversions', 'Revenue', 'CVR']);
    for (const p of data.promoterStats) {
      rows.push([p.promoterName, p.code, String(p.clicks), String(p.conversions), (p.revenueCents / 100).toFixed(2), `${p.conversionRate}%`]);
    }
    rows.push([]);
  }

  if (data.ordersByDay.length > 0) {
    rows.push(['Date', 'Orders', 'Revenue']);
    for (const d of data.ordersByDay) {
      rows.push([d.date, String(d.count), (d.revenueCents / 100).toFixed(2)]);
    }
  }

  const csv = rows.map((r) => r.map((c) => `"${(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `event-report-${data.event.id}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function EventReport({ eventId }: { eventId: string }) {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/reports/event?eventId=${eventId}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.error) throw new Error(res.error);
        setData(res.data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) return <div className="text-white/30 text-sm py-10 text-center">Loading report...</div>;
  if (error) return <div className="text-red-400 text-sm py-10 text-center">{error}</div>;
  if (!data) return null;

  const statCards = [
    { label: 'Net Revenue', value: money(data.revenue.netCents), color: 'text-emerald-400' },
    { label: 'Paid Orders', value: data.orders.paid, color: 'text-white/80' },
    { label: 'Check-in Rate', value: `${data.checkIn.rate}%`, color: 'text-violet-400' },
    { label: 'Pending', value: data.orders.pending, color: 'text-amber-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Export button */}
      <div className="flex justify-end">
        <button
          onClick={() => downloadCSV(data)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white/60 hover:text-white/90 transition-colors"
          style={{ background: 'rgba(255,255,255,0.04)', boxShadow: '0 0 0 1px rgba(255,255,255,0.08)' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3" /></svg>
          Export CSV
        </button>
      </div>

      {/* Top-line stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCards.map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.02)', boxShadow: '0 0 0 1px rgba(255,255,255,0.05)' }}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-1">{label}</p>
            <p className={`text-2xl font-black ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Revenue breakdown */}
      {data.revenue.refundedCents > 0 && (
        <div className="rounded-2xl p-5 space-y-2" style={{ background: 'rgba(255,255,255,0.02)', boxShadow: '0 0 0 1px rgba(255,255,255,0.05)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/25">Revenue Breakdown</p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/40">Gross</span>
            <span className="text-white/70 font-semibold">{money(data.revenue.grossCents)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/40">Refunded</span>
            <span className="text-red-400/70 font-semibold">-{money(data.revenue.refundedCents)}</span>
          </div>
          <div className="border-t border-white/5 pt-2 flex items-center justify-between text-sm">
            <span className="text-white/50 font-bold">Net</span>
            <span className="text-emerald-400 font-black">{money(data.revenue.netCents)}</span>
          </div>
        </div>
      )}

      {/* Ticket Sales */}
      {data.ticketSales.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', boxShadow: '0 0 0 1px rgba(255,255,255,0.05)' }}>
          <div className="px-5 py-4 border-b border-white/[0.05]">
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/30">Ticket Sales</p>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {data.ticketSales.map((t) => (
              <div key={t.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white/70">{t.name}</p>
                  <p className="text-[11px] text-white/25">{t.sold} / {t.capacity} sold ({t.utilization}%)</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white/60">{money(t.revenueCents)}</p>
                  <p className="text-[11px] text-white/20">{money(t.priceCents)} each</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table Sales */}
      {data.tableSales.length > 0 && data.tableSales.some((t) => t.sold > 0) && (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', boxShadow: '0 0 0 1px rgba(255,255,255,0.05)' }}>
          <div className="px-5 py-4 border-b border-white/[0.05]">
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/30">Table Packages</p>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {data.tableSales.filter((t) => t.sold > 0).map((t) => (
              <div key={t.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white/70">{t.name}</p>
                  <p className="text-[11px] text-white/25">{t.sold} sold</p>
                </div>
                <p className="text-sm font-bold text-white/60">{money(t.revenueCents)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Promoter Performance */}
      {data.promoterStats.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', boxShadow: '0 0 0 1px rgba(255,255,255,0.05)' }}>
          <div className="px-5 py-4 border-b border-white/[0.05]">
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/30">Promoter Performance</p>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {data.promoterStats.map((p) => (
              <div key={p.code} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white/70">{p.promoterName}</p>
                  <p className="text-[11px] text-white/25">Code: {p.code} | {p.clicks} clicks | {p.conversionRate}% CVR</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white/60">{money(p.revenueCents)}</p>
                  <p className="text-[11px] text-white/20">{p.conversions} orders</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Orders */}
      {data.ordersByDay.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', boxShadow: '0 0 0 1px rgba(255,255,255,0.05)' }}>
          <div className="px-5 py-4 border-b border-white/[0.05]">
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/30">Orders by Day</p>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {data.ordersByDay.map((d) => (
              <div key={d.date} className="px-5 py-3 flex items-center justify-between">
                <p className="text-sm text-white/50">{d.date}</p>
                <div className="flex items-center gap-4">
                  <span className="text-[12px] text-white/30">{d.count} orders</span>
                  <span className="text-sm font-bold text-white/60">{money(d.revenueCents)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Check-in */}
      <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.02)', boxShadow: '0 0 0 1px rgba(255,255,255,0.05)' }}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/25 mb-3">Check-in</p>
        <div className="flex items-center gap-6">
          <div>
            <p className="text-2xl font-black text-violet-400">{data.checkIn.checkedIn}</p>
            <p className="text-[11px] text-white/25">checked in</p>
          </div>
          <div>
            <p className="text-2xl font-black text-white/40">{data.checkIn.totalPasses}</p>
            <p className="text-[11px] text-white/25">total passes</p>
          </div>
          <div className="flex-1">
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <div className="h-full rounded-full bg-violet-500/60" style={{ width: `${data.checkIn.rate}%` }} />
            </div>
            <p className="text-[10px] text-white/20 mt-1 text-right">{data.checkIn.rate}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
