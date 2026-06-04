'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icon, type IconName } from '@/components/ui/Icon';
import { StatCards, GovernanceSeverityBadge, AuditBanner } from '@/components/workspace/ui';
import { governanceFindings } from '@/lib/workspace/mockData';

const ADMIN_LINKS: { href: string; label: string; icon: IconName; desc: string }[] = [
  { href: '/workspace/cost', label: 'Cost optimization', icon: 'analytics', desc: 'Cost per desk/floor/SL + consolidation savings' },
  { href: '/workspace/policies', label: 'Policy & rules', icon: 'shield', desc: 'Priority, booking-window, no-show, privacy rules' },
  { href: '/workspace/relocation', label: 'Relocation planner', icon: 'relocation', desc: 'Move plans, employee↔desk mapping' },
  { href: '/workspace/visitors', label: 'Visitors', icon: 'visitor', desc: 'Contractor & visitor desk management' },
];

export default function GovernancePage() {
  const [resolved, setResolved] = useState<Set<string>>(new Set());
  const findings = governanceFindings.filter((f) => !resolved.has(f.id));
  const open = findings.filter((f) => !f.resolved);

  return (
    <>
      <AuditBanner>Governance findings are AI-generated from occupancy, no-show and capacity signals — for space planning, never individual performance monitoring.</AuditBanner>
      <StatCards stats={[
        { icon: 'shield', tint: 'tint-blue', value: open.length, label: 'Open findings' },
        { icon: 'alert', tint: 'tint-red', value: open.filter((f) => f.severity === 'critical').length, label: 'Critical' },
        { icon: 'info', tint: 'tint-orange', value: open.filter((f) => f.severity === 'warn').length, label: 'Warnings' },
        { icon: 'check', tint: 'tint-green', value: resolved.size, label: 'Resolved' },
      ]} />

      <div className="table-card" style={{ marginBottom: 18 }}>
        <table className="data-table">
          <thead><tr><th>Severity</th><th>Finding</th><th>Entity</th><th>Raised</th><th>Actions</th></tr></thead>
          <tbody>
            {open.map((f) => (
              <tr key={f.id}>
                <td><GovernanceSeverityBadge severity={f.severity} /></td>
                <td>{f.message}</td>
                <td className="muted">{f.entityType} · {f.entityId}</td>
                <td>{f.raisedAt.slice(0, 10)}</td>
                <td><div className="row-actions"><button className="btn btn--ghost btn--sm" onClick={() => setResolved((p) => new Set(p).add(f.id))}>Resolve</button></div></td>
              </tr>
            ))}
            {open.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--text-soft)' }}>No open findings.</td></tr>}
          </tbody>
        </table>
      </div>

      <h3 className="section-title">Admin areas</h3>
      <div className="grid-modules">
        {ADMIN_LINKS.map((l) => (
          <Link key={l.href} className="module" href={l.href}>
            <div className="module__icon tint-blue"><Icon name={l.icon} size={20} /></div>
            <div className="module__title">{l.label}</div>
            <div className="module__desc">{l.desc}</div>
            <div className="module__open">Open <Icon name="chevronRight" size={14} /></div>
          </Link>
        ))}
      </div>
    </>
  );
}
