'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { StatCards, DeskKindBadge, VacancyBadge } from '@/components/workspace/ui';
import { seatRegister, registerStats, floors, areas, serviceLineName, accountName } from '@/lib/workspace/mockData';
import type { DeskKind } from '@/lib/workspace/types';

export default function AllocationPage() {
  const [kind, setKind] = useState<'all' | DeskKind>('all');
  const [occ, setOcc] = useState<'all' | 'occupied' | 'vacant'>('all');
  const [floorId, setFloorId] = useState('all');
  const [areaId, setAreaId] = useState('all');
  const [q, setQ] = useState('');

  const floorAreas = floorId === 'all' ? areas : areas.filter((a) => a.floorId === floorId);
  const rows = seatRegister.filter((r) => {
    if (kind !== 'all' && r.deskKind !== kind) return false;
    if (occ === 'occupied' && r.isVacant) return false;
    if (occ === 'vacant' && !r.isVacant) return false;
    if (floorId !== 'all' && r.floorId !== floorId) return false;
    if (areaId !== 'all' && r.areaId !== areaId) return false;
    if (q.trim()) { const s = q.toLowerCase(); if (!`${r.occupantName ?? ''} ${r.empId ?? ''} ${r.seatNo} ${r.rawGroup ?? ''} ${r.rawAccount ?? ''}`.toLowerCase().includes(s)) return false; }
    return true;
  });
  const dash = (v?: string) => (v ? v : <span className="muted">—</span>);

  return (
    <>
      <p className="sub-hint" style={{ marginBottom: 12 }}><Icon name="grid" size={13} /> Live desk-allocation register — the digital twin of the manual <b>Open Office</b> sheet. {registerStats.total} seats across 2 floors / {areas.length} phase-areas.</p>

      <StatCards stats={[
        { icon: 'seat', tint: 'tint-blue', value: registerStats.total, label: 'Total seats' },
        { icon: 'desk', tint: 'tint-info', value: registerStats.byKind.workstation, label: 'Workstations' },
        { icon: 'grid', tint: 'tint-blue', value: registerStats.byKind.cubicle, label: 'Cubicles' },
        { icon: 'office', tint: 'tint-orange', value: registerStats.byKind.cabin, label: 'Cabins' },
        { icon: 'check', tint: 'tint-red', value: registerStats.occupied, label: 'Occupied' },
        { icon: 'unlock', tint: 'tint-green', value: registerStats.vacant, label: 'Vacant' },
      ]} />

      <div className="ws-toolbar">
        <div className="field"><label>Search</label><input className="input" placeholder="Name, Emp ID, seat, group, account…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <div className="field"><label>Type</label>
          <div className="seg">
            {(['all', 'workstation', 'cubicle', 'cabin'] as const).map((k) => <button key={k} className={kind === k ? 'active' : ''} onClick={() => setKind(k)}>{k === 'all' ? 'All' : k === 'workstation' ? 'WS' : k[0].toUpperCase() + k.slice(1)}</button>)}
          </div>
        </div>
        <div className="field"><label>Status</label>
          <div className="seg">{(['all', 'occupied', 'vacant'] as const).map((o) => <button key={o} className={occ === o ? 'active' : ''} onClick={() => setOcc(o)}>{o[0].toUpperCase() + o.slice(1)}</button>)}</div>
        </div>
        <div className="field"><label>Floor</label>
          <select className="select" value={floorId} onChange={(e) => { setFloorId(e.target.value); setAreaId('all'); }}>
            <option value="all">All floors</option>{floors.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
        <div className="field"><label>Phase / Area</label>
          <select className="select" value={areaId} onChange={(e) => setAreaId(e.target.value)}>
            <option value="all">All areas</option>{floorAreas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div className="spacer" />
        <button className="btn btn--primary btn--sm" onClick={() => alert('Mock: assign / move seat (FE-3 wizard)')}><Icon name="plus" size={15} /> New allocation</button>
      </div>

      <div className="sub-hint" style={{ margin: '0 0 8px' }}>Showing <b>{rows.length}</b> of {registerStats.total} seats</div>
      <div className="table-card">
        <div style={{ maxHeight: 560, overflowY: 'auto' }}>
          <table className="data-table">
            <thead><tr><th>Emp ID</th><th>Type</th><th>Seat #</th><th>Drawer Key</th><th>Name</th><th className="num">Ext</th><th>Group (Service line)</th><th>Account</th><th>Status</th></tr></thead>
            <tbody>
              {rows.slice(0, 400).map((r) => (
                <tr key={r.id} style={r.isVacant ? { color: 'var(--text-muted)' } : undefined}>
                  <td className="mono">{dash(r.empId)}</td>
                  <td><DeskKindBadge kind={r.deskKind} /></td>
                  <td className="mono">{r.seatNo}</td>
                  <td className="mono">{dash(r.drawerKey)}</td>
                  <td>{r.isVacant ? <span className="muted">Vacant</span> : r.occupantName}</td>
                  <td className="num mono">{dash(r.extNumber)}</td>
                  <td>{r.rawGroup ? r.rawGroup : (r.serviceLineId ? serviceLineName(r.serviceLineId) : <span className="muted">—</span>)}</td>
                  <td>{r.rawAccount ? r.rawAccount : (r.accountId ? accountName(r.accountId) : <span className="muted">—</span>)}</td>
                  <td><VacancyBadge vacant={r.isVacant} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length > 400 && <p className="sub-hint" style={{ padding: '10px 14px', margin: 0 }}>Showing first 400 — narrow the filters to see more.</p>}
      </div>
      <div className="ws-toolbar" style={{ marginTop: 12 }}>
        <Link className="btn btn--ghost btn--sm" href="/workspace/floor"><Icon name="floor" size={15} /> Floor view</Link>
        <Link className="btn btn--ghost btn--sm" href="/workspace/occupancy"><Icon name="heatmap" size={15} /> Capacity & occupancy</Link>
      </div>
      <p className="sub-hint" style={{ marginTop: 12 }}><Icon name="info" size={13} /> Columns mirror the Excel register: Emp ID · Type (WS/Cubicle/Cabin) · Seat # · Drawer/Locker Key · Name · Extension · Group (service line) · Account (client/internal). “—” = blank in the source.</p>
    </>
  );
}
