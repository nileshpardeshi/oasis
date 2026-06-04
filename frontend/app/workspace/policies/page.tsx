'use client';

import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { StatCards, Pill } from '@/components/workspace/ui';
import { policies } from '@/lib/workspace/mockData';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function PoliciesPage() {
  return (
    <>
      <div className="ws-toolbar">
        <Link className="btn btn--ghost btn--sm" href="/workspace/governance"><Icon name="arrowLeft" size={15} /> Admin</Link>
        <div className="spacer" />
        <button className="btn btn--primary btn--sm" onClick={() => alert('Mock: new policy (rule builder) — FE-3')}><Icon name="plus" size={15} /> New policy</button>
      </div>

      <StatCards stats={[
        { icon: 'shield', tint: 'tint-blue', value: policies.length, label: 'Policies' },
        { icon: 'check', tint: 'tint-green', value: policies.filter((p) => p.isActive).length, label: 'Active' },
        { icon: 'filter', tint: 'tint-info', value: policies.reduce((s, p) => s + p.rules.length, 0), label: 'Rules' },
      ]} />

      <div className="cards-2">
        {policies.map((p) => (
          <div className="table-card" key={p.id} style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="section-title" style={{ margin: 0 }}>{p.name}</div>
              <Pill tone={p.isActive ? 'ws-ok' : 'ws-muted'}>{p.isActive ? 'Active' : 'Inactive'}</Pill>
            </div>
            <p className="sub-hint" style={{ margin: '4px 0 10px' }}>{cap(p.kind.replace('_', ' '))} · <span className="mono">{p.code}</span>{p.description ? ` · ${p.description}` : ''}</p>
            <table className="data-table">
              <thead><tr><th className="num">#</th><th>When</th><th>Then</th></tr></thead>
              <tbody>
                {p.rules.slice().sort((a, b) => a.priority - b.priority).map((r) => (
                  <tr key={r.id}><td className="num">{r.priority}</td><td>{r.when}</td><td>{r.then}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
      <p className="sub-hint" style={{ marginTop: 14 }}><Icon name="info" size={13} /> Policy rules drive booking-contention priority, advance-booking window, no-show auto-release and privacy visibility — evaluated by priority order.</p>
    </>
  );
}
