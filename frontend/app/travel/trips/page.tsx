'use client';

import { useMemo, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { trips, inr } from '@/lib/travel/mockData';
import { StatCards, Money } from '@/components/travel/ui';
import type { TripStatus } from '@/lib/travel/types';

const STATUSES: TripStatus[] = ['Booked', 'Ticketed', 'Travelling', 'Completed', 'Cancelled'];
const ST_CLASS: Record<TripStatus, string> = { Booked: 'tv-warn', Ticketed: 'tv-info', Travelling: 'tv-process', Completed: 'tv-paid', Cancelled: 'tv-hold' };
const PAY_CLASS: Record<string, string> = { 'Advance Due': 'tv-warn', Paid: 'tv-paid', Scheduled: 'tv-info' };

export default function TripsPage() {
  const [text, setText] = useState('');
  const [status, setStatus] = useState('All');

  const rows = useMemo(() => trips.filter((t) => {
    if (status !== 'All' && t.status !== status) return false;
    const q = text.trim().toLowerCase();
    if (q && !(`${t.code} ${t.traveller} ${t.routeLabel} ${t.airline} ${t.pnr}`.toLowerCase().includes(q))) return false;
    return true;
  }), [text, status]);

  return (
    <>
      <div className="tv-toolbar">
        <div className="field" style={{ flex: '1 1 240px' }}>
          <label>Search — trip / traveller / route / PNR</label>
          <input className="input" style={{ width: '100%' }} placeholder="e.g. TRP-64377 or SIN" value={text} onChange={(e) => setText(e.target.value)} />
        </div>
        <div className="field"><label>Status</label>
          <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}><option>All</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
        </div>
      </div>

      <StatCards stats={[
        { icon: 'travel', tint: 'tint-blue', value: rows.length, label: 'Trips' },
        { icon: 'bell', tint: 'tint-orange', value: rows.filter((t) => t.fareWatch).length, label: 'On fare-watch' },
        { icon: 'check', tint: 'tint-info', value: rows.filter((t) => t.status === 'Travelling').length, label: 'In transit' },
        { icon: 'analytics', tint: 'tint-green', value: inr(rows.reduce((s, t) => s + t.fare, 0)), label: 'Total fare', small: true },
      ]} />

      <div className="table-card" style={{ overflowX: 'auto' }}>
        <table className="data-table" style={{ minWidth: 980 }}>
          <thead><tr><th>Trip</th><th>Traveller</th><th>Route</th><th>Airline</th><th>PNR</th><th>Depart</th><th className="num">Fare</th><th>Vendor</th><th>Status</th><th>Payment</th><th>Fare-watch</th></tr></thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id}>
                <td className="mono">{t.code}</td>
                <td>{t.traveller}</td>
                <td>{t.routeLabel}</td>
                <td>{t.airline}</td>
                <td className="mono">{t.pnr}</td>
                <td>{t.departDate}</td>
                <td className="num"><Money value={t.fare} /></td>
                <td>{t.vendorName}</td>
                <td><span className={'tv-pill ' + ST_CLASS[t.status]}>{t.status}</span></td>
                <td><span className={'tv-pill ' + (PAY_CLASS[t.paymentStatus] ?? 'tv-unpaid')}>{t.paymentStatus}</span></td>
                <td>{t.fareWatch ? <span className="tv-pill tv-paid"><Icon name="bell" size={12} /> On</span> : <span className="tv-pill tv-unpaid">Off</span>}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={11} style={{ textAlign: 'center', padding: 26, color: 'var(--text-soft)' }}>No trips match your filters.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="sub-hint" style={{ marginTop: 12 }}><Icon name="info" size={13} /> Vendor books &amp; supports; OASIS records the PNR and runs fare-watch + schedule tracking (Monitoring). Full trip record &amp; AI Trip Pack land in Phase 4b.</p>
    </>
  );
}
