'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { StatCards, Money } from '@/components/workspace/ui';
import { movePlans, moveItems, floors, getEmployee, getDesk } from '@/lib/workspace/mockData';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const floorName = (id: string) => floors.find((f) => f.id === id)?.name ?? id;

export default function RelocationPage() {
  const [selId, setSelId] = useState(movePlans[0]?.id);
  const plan = movePlans.find((p) => p.id === selId);
  const items = moveItems.filter((m) => m.movePlanId === selId);

  return (
    <>
      <div className="ws-toolbar">
        <Link className="btn btn--ghost btn--sm" href="/workspace/governance"><Icon name="arrowLeft" size={15} /> Admin</Link>
        <div className="spacer" />
        <button className="btn btn--primary btn--sm" onClick={() => alert('Mock: new relocation plan wizard (FE-3)')}><Icon name="plus" size={15} /> New move plan</button>
      </div>

      <StatCards stats={[
        { icon: 'relocation', tint: 'tint-blue', value: movePlans.length, label: 'Move plans' },
        { icon: 'userGroup', tint: 'tint-info', value: movePlans.reduce((s, p) => s + p.employeeCount, 0), label: 'Employees in scope' },
        { icon: 'clock', tint: 'tint-orange', value: movePlans.filter((p) => p.status === 'planned').length, label: 'Planned' },
        { icon: 'analytics', tint: 'tint-green', value: <Money value={movePlans.reduce((s, p) => s + (p.estCost ?? 0), 0)} />, label: 'Est. move cost' },
      ]} />

      <div className="ws-split" style={{ marginTop: 14 }}>
        <div className="table-card">
          <table className="data-table">
            <thead><tr><th>Code</th><th>Plan</th><th>From → To</th><th className="num">People</th><th>Status</th></tr></thead>
            <tbody>
              {movePlans.map((p) => (
                <tr key={p.id} onClick={() => setSelId(p.id)} style={{ cursor: 'pointer', background: p.id === selId ? 'var(--brand-blue-tint)' : undefined }}>
                  <td className="mono">{p.code}</td><td>{p.name}</td><td>{floorName(p.fromFloorId)} → {floorName(p.toFloorId)}</td><td className="num">{p.employeeCount}</td><td>{cap(p.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="ws-inspector">
          <div className="section-title" style={{ marginTop: 0 }}>{plan?.name ?? 'Select a plan'}</div>
          {plan && <>
            <p className="sub-hint">{plan.reason}</p>
            <p className="sub-hint">Scheduled · {plan.scheduledFor ?? 'not set'}</p>
            <p className="sub-hint">Est. cost · {plan.estCost ? <Money value={plan.estCost} /> : '—'}</p>
            <div className="section-title" style={{ fontSize: 13, margin: '14px 0 8px' }}>Move sequence</div>
            {items.length === 0 ? <p className="sub-hint">No item-level moves drafted yet.</p> : items.map((m) => (
              <div key={m.id} className="ws-moverow">
                <span className="mono">#{m.sequenceNo}</span> {getEmployee(m.employeeId)?.name ?? m.employeeId}
                <span className="muted"> · {getDesk(m.fromDeskId ?? '')?.deskNo ?? '—'} → {getDesk(m.toDeskId ?? '')?.deskNo ?? '—'}</span>
              </div>
            ))}
          </>}
        </div>
      </div>
      <p className="sub-hint" style={{ marginTop: 14 }}><Icon name="info" size={13} /> Relocation plans are usually generated from a cost-optimization suggestion, then sequenced and approved before execution.</p>
    </>
  );
}
