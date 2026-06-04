'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { StatCards } from '@/components/workspace/ui';
import { noShowAlerts, getEmployee, getDesk } from '@/lib/workspace/mockData';

export default function NoShowsPage() {
  const [resolved, setResolved] = useState<Set<string>>(new Set());
  const open = noShowAlerts.filter((a) => !a.resolved && !resolved.has(a.id));

  return (
    <>
      <div className="page-back"><Link className="btn btn--back btn--sm" href="/workspace/occupancy"><Icon name="arrowLeft" size={15} strokeWidth={2.2} /> Back to Occupancy</Link></div>
      <StatCards stats={[
        { icon: 'alert', tint: 'tint-red', value: open.length, label: 'Open no-shows' },
        { icon: 'check', tint: 'tint-green', value: resolved.size, label: 'Resolved' },
        { icon: 'shield', tint: 'tint-orange', value: open.filter((a) => a.escalationLevel >= 2).length, label: 'Escalated (L2+)' },
      ]} />
      <div className="table-card">
        <table className="data-table">
          <thead><tr><th>Employee</th><th>Desk</th><th>Detected</th><th>Grace</th><th>Escalation</th><th>Actions</th></tr></thead>
          <tbody>
            {open.map((a) => (
              <tr key={a.id}>
                <td>{getEmployee(a.employeeId)?.name ?? a.employeeId}</td>
                <td className="mono">{getDesk(a.deskId)?.deskNo ?? a.deskId}</td>
                <td>{a.detectedAt.slice(11, 16)}</td>
                <td>{a.graceMinutes}m</td>
                <td><span className={'ws-pill ' + (a.escalationLevel >= 2 ? 'ws-danger' : a.escalationLevel === 1 ? 'ws-warn' : 'ws-muted')}>Level {a.escalationLevel}</span></td>
                <td><div className="row-actions">
                  <button className="btn btn--ghost btn--sm" onClick={() => setResolved((p) => new Set(p).add(a.id))}>Resolve</button>
                  <button className="btn btn--ghost btn--sm" onClick={() => alert('Mock: notify ' + (getEmployee(a.employeeId)?.name ?? ''))}>Notify</button>
                </div></td>
              </tr>
            ))}
            {open.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--text-soft)' }}>No open no-shows. 🎉</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
