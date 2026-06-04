'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { StatCards, VisitorStatusBadge } from '@/components/workspace/ui';
import { visitors, getEmployee, getDesk, fmtDate } from '@/lib/workspace/mockData';
import type { Visitor } from '@/lib/workspace/types';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function VisitorsPage() {
  const [filter, setFilter] = useState('all');
  const rows = filter === 'all' ? visitors : visitors.filter((v) => v.status === filter);
  const act = (v: Visitor, action: string) => alert(`Mock: ${action} — ${v.fullName}`);

  return (
    <>
      <div className="ws-toolbar">
        <Link className="btn btn--ghost btn--sm" href="/workspace/governance"><Icon name="arrowLeft" size={15} /> Admin</Link>
        <div className="field"><label>Status</label>
          <select className="select" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All</option>{['expected', 'pending_approval', 'checked_in', 'checked_out'].map((s) => <option key={s} value={s}>{cap(s.replace('_', ' '))}</option>)}
          </select>
        </div>
        <div className="spacer" />
        <button className="btn btn--primary btn--sm" onClick={() => alert('Mock: pre-register a visitor (host, dates, desk)')}><Icon name="plus" size={15} /> Pre-register visitor</button>
      </div>

      <StatCards stats={[
        { icon: 'visitor', tint: 'tint-blue', value: visitors.length, label: 'Visitors & contractors' },
        { icon: 'clock', tint: 'tint-orange', value: visitors.filter((v) => v.status === 'pending_approval').length, label: 'Pending approval' },
        { icon: 'check', tint: 'tint-green', value: visitors.filter((v) => v.status === 'checked_in').length, label: 'On-site now' },
        { icon: 'desk', tint: 'tint-info', value: visitors.filter((v) => v.deskId).length, label: 'With assigned desk' },
      ]} />

      <div className="table-card">
        <table className="data-table">
          <thead><tr><th>Visitor</th><th>Type</th><th>Host</th><th>Desk</th><th>Expected</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {rows.map((v) => (
              <tr key={v.id}>
                <td>{v.fullName}{v.org && <span className="muted" style={{ fontSize: 12 }}> · {v.org}</span>}</td>
                <td>{cap(v.kind)}</td>
                <td>{getEmployee(v.hostEmployeeId)?.name ?? '—'}</td>
                <td className="mono">{v.deskId ? getDesk(v.deskId)?.deskNo ?? v.deskId : '—'}</td>
                <td>{fmtDate(v.expectedFrom)}</td>
                <td><VisitorStatusBadge status={v.status} /></td>
                <td><div className="row-actions">
                  {v.status === 'pending_approval' && <button className="btn btn--ghost btn--sm" onClick={() => act(v, 'Approved')}>Approve</button>}
                  {v.status === 'expected' && <button className="btn btn--ghost btn--sm" onClick={() => act(v, 'Checked in')}>Check in</button>}
                  {v.status === 'checked_in' && <button className="btn btn--ghost btn--sm" onClick={() => act(v, 'Checked out')}>Check out</button>}
                </div></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--text-soft)' }}>No visitors for this status.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="sub-hint" style={{ marginTop: 14 }}><Icon name="shield" size={13} /> Contractors &amp; visitors get time-boxed desk access with host approval and badge tracking — separate from employee allocations.</p>
    </>
  );
}
