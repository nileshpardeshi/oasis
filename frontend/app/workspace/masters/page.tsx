'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { StatCards, SpaceStatusBadge, Pill } from '@/components/workspace/ui';
import { offices, floors, areas, serviceLines, accounts, employees, desks, registerStats, getDesksByFloor, getRoomsByFloor, serviceLineName } from '@/lib/workspace/mockData';

type Tab = 'floors' | 'areas' | 'sl' | 'accounts' | 'employees';

export default function MastersPage() {
  const [tab, setTab] = useState<Tab>('areas');
  const clients = accounts.filter((a) => a.kind === 'client');
  const internal = accounts.filter((a) => a.kind === 'internal');

  return (
    <>
      <StatCards stats={[
        { icon: 'office', tint: 'tint-blue', value: offices.length, label: 'Offices' },
        { icon: 'floor', tint: 'tint-info', value: floors.length, label: 'Floors' },
        { icon: 'zone', tint: 'tint-orange', value: areas.length, label: 'Phase / Areas' },
        { icon: 'seat', tint: 'tint-green', value: registerStats.total, label: 'Seats' },
        { icon: 'userGroup', tint: 'tint-blue', value: serviceLines.length, label: 'Service lines' },
        { icon: 'building', tint: 'tint-info', value: accounts.length, label: 'Accounts' },
      ]} />

      <p className="sub-hint" style={{ marginBottom: 12 }}><Icon name="building" size={13} /> Hierarchy: Company → Office → Campus → Floor → Phase/Area → Seat. “Group” = Service Line, “Account” = Client/Internal cost-centre (as tracked in the manual sheet).</p>

      <div className="seg" style={{ marginBottom: 14 }}>
        {(['areas', 'floors', 'sl', 'accounts', 'employees'] as Tab[]).map((t) => (
          <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t === 'sl' ? 'Service Lines' : t === 'areas' ? 'Phase / Areas' : t[0].toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      <div className="table-card">
        {tab === 'areas' && (
          <table className="data-table">
            <thead><tr><th>Floor</th><th>Phase / Area</th><th className="num">WS</th><th className="num">Cub</th><th className="num">Cab</th><th className="num">Capacity</th><th className="num">Occupied</th><th className="num">Vacant</th><th className="num">Occ %</th></tr></thead>
            <tbody>{areas.map((a) => (
              <tr key={a.id}>
                <td>{floors.find((f) => f.id === a.floorId)?.name}</td>
                <td>{a.name}</td>
                <td className="num">{a.capWs}</td><td className="num">{a.capCub}</td><td className="num">{a.capCab}</td>
                <td className="num">{a.capTotal}</td><td className="num">{a.occTotal}</td><td className="num">{a.vacTotal}</td>
                <td className="num"><Pill tone={a.occPct < 40 ? 'ws-danger' : a.occPct < 75 ? 'ws-warn' : 'ws-ok'}>{a.occPct}%</Pill></td>
              </tr>
            ))}</tbody>
          </table>
        )}
        {tab === 'floors' && (
          <table className="data-table">
            <thead><tr><th>Code</th><th>Name</th><th className="num">Level</th><th className="num">Seats</th><th className="num">Rooms</th><th>Status</th><th></th></tr></thead>
            <tbody>{floors.map((f) => (
              <tr key={f.id}><td className="mono">{f.code}</td><td>{f.name}</td><td className="num">{f.levelNo}</td><td className="num">{getDesksByFloor(f.id).length}</td><td className="num">{getRoomsByFloor(f.id).length}</td><td><SpaceStatusBadge status={f.status} /></td><td className="num"><Link className="panel__link" href="/workspace/floor">View →</Link></td></tr>
            ))}</tbody>
          </table>
        )}
        {tab === 'sl' && (
          <div style={{ maxHeight: 520, overflowY: 'auto' }}>
            <table className="data-table">
              <thead><tr><th>Service line</th><th>Code</th><th>Kind</th><th className="num">Headcount</th><th className="num">Seats</th><th>Colour</th></tr></thead>
              <tbody>{[...serviceLines].sort((a, b) => (b.headcount ?? 0) - (a.headcount ?? 0)).map((s) => (
                <tr key={s.id}><td>{s.name}</td><td className="mono">{s.code}</td><td className="muted">{s.kind.replace('_', ' ')}</td><td className="num">{s.headcount ?? '—'}</td><td className="num">{desks.filter((d) => d.serviceLineId === s.id).length}</td><td><span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: 4, background: s.colorHex, verticalAlign: 'middle' }} /></td></tr>
              ))}</tbody>
            </table>
          </div>
        )}
        {tab === 'accounts' && (
          <div style={{ maxHeight: 520, overflowY: 'auto' }}>
            <table className="data-table">
              <thead><tr><th>Account</th><th>Code</th><th>Kind</th><th className="num">Headcount</th></tr></thead>
              <tbody>
                <tr><td colSpan={4} style={{ background: 'var(--surface-2,#f6f9fc)', fontWeight: 700, fontSize: 12 }}>Clients ({clients.length})</td></tr>
                {clients.map((a) => (<tr key={a.id}><td>{a.name}</td><td className="mono">{a.code}</td><td><Pill tone="ws-info">Client</Pill></td><td className="num">{a.headcount ?? '—'}</td></tr>))}
                <tr><td colSpan={4} style={{ background: 'var(--surface-2,#f6f9fc)', fontWeight: 700, fontSize: 12 }}>Internal ({internal.length})</td></tr>
                {internal.map((a) => (<tr key={a.id}><td>{a.name}</td><td className="mono">{a.code}</td><td><Pill tone="ws-muted">Internal</Pill></td><td className="num">{a.headcount ?? '—'}</td></tr>))}
              </tbody>
            </table>
          </div>
        )}
        {tab === 'employees' && (
          <div style={{ maxHeight: 520, overflowY: 'auto' }}>
            <table className="data-table">
              <thead><tr><th>Name</th><th>Emp no</th><th>Service line</th><th>Grade</th><th>Title</th></tr></thead>
              <tbody>{employees.map((e) => (
                <tr key={e.id}><td>{e.name}</td><td className="mono">{e.empNo}</td><td>{serviceLineName(e.serviceLineId)}</td><td>{e.grade}</td><td>{e.title}</td></tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
