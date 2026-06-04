'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { travelRequests } from '@/lib/travel/mockData';
import { StatusBadge, StatCards } from '@/components/travel/ui';
import type { RequestStatus } from '@/lib/travel/types';

const STATUSES: RequestStatus[] = ['Draft', 'Submitted', 'Sourcing', 'Compared', 'Pending Approval', 'Approved', 'Booked', 'Closed', 'Rejected'];

export default function RequestsPage() {
  const [text, setText] = useState('');
  const [status, setStatus] = useState('All');
  const [scope, setScope] = useState('All');

  const rows = useMemo(() => travelRequests.filter((r) => {
    if (status !== 'All' && r.status !== status) return false;
    if (scope === 'Domestic' && r.international) return false;
    if (scope === 'International' && !r.international) return false;
    const q = text.trim().toLowerCase();
    if (q && !(`${r.code} ${r.traveller.name} ${r.originCode} ${r.destCode} ${r.originCity} ${r.destCity}`.toLowerCase().includes(q))) return false;
    return true;
  }), [text, status, scope]);

  const quotesReceived = (r: typeof travelRequests[number]) => r.vendorQuotes.filter((v) => v.status === 'Received').length;

  return (
    <>
      <div className="tv-toolbar">
        <div className="field" style={{ flex: '1 1 240px' }}>
          <label>Search — code / traveller / route</label>
          <input className="input" style={{ width: '100%' }} placeholder="e.g. TRV-64393 or HYD" value={text} onChange={(e) => setText(e.target.value)} />
        </div>
        <div className="field"><label>Status</label>
          <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}><option>All</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
        </div>
        <div className="field"><label>Scope</label>
          <select className="select" value={scope} onChange={(e) => setScope(e.target.value)}><option>All</option><option>Domestic</option><option>International</option></select>
        </div>
        <div className="spacer" />
        <Link className="btn btn--primary btn--sm" href="/travel/requests/new"><Icon name="plus" size={15} strokeWidth={2.2} /> New request</Link>
      </div>

      <StatCards
        stats={[
          { icon: 'helpdesk', tint: 'tint-blue', value: rows.length, label: 'Requests' },
          { icon: 'bell', tint: 'tint-orange', value: rows.filter((r) => r.status === 'Sourcing').length, label: 'Sourcing (awaiting quotes)' },
          { icon: 'analytics', tint: 'tint-info', value: rows.filter((r) => r.status === 'Compared').length, label: 'Compared (ready)' },
          { icon: 'check', tint: 'tint-green', value: rows.filter((r) => r.status === 'Pending Approval').length, label: 'Pending approval' },
        ]}
      />

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr><th>Request</th><th>Route</th><th>Traveller</th><th>Type</th><th>Cabin</th><th>Depart</th><th className="num">Quotes</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="row-link">
                <td className="mono">{r.code}</td>
                <td>{r.originCode} → {r.destCode}</td>
                <td>{r.traveller.name}</td>
                <td>{r.international ? <span className="tv-pill tv-info">Intl</span> : <span className="tv-pill tv-vendor">Domestic</span>}</td>
                <td>{r.cabin}</td>
                <td>{r.departDate}</td>
                <td className="num">{quotesReceived(r)}/{r.vendorQuotes.length || '—'}</td>
                <td><StatusBadge status={r.status} /></td>
                <td>
                  <div className="row-actions">
                    <Link className="btn btn--ghost btn--icon" href={`/travel/requests/${r.id}`} title="Open / compare" aria-label="Open"><Icon name="eye" size={16} /></Link>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={9} style={{ textAlign: 'center', padding: 26, color: 'var(--text-soft)' }}>No requests match your filters.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
