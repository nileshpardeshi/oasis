'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import FloorPlan from '@/components/workspace/FloorCanvas';
import { StatCards, Legend, Pill } from '@/components/workspace/ui';
import { floors, getDesksByFloor, getZonesByFloor, getRoomsByFloor, getLiveStatus, deskStateColor, noShowAlerts, capacitySummary, getCapacityByFloor, capacityGrandTotal } from '@/lib/workspace/mockData';

const LEGEND = [
  { label: 'Vacant', color: deskStateColor('vacant') },
  { label: 'Booked', color: deskStateColor('booked') },
  { label: 'Checked-in', color: deskStateColor('checked_in') },
  { label: 'Occupied', color: deskStateColor('occupied') },
  { label: 'No-show', color: deskStateColor('no_show') },
];

const occTone = (p: number) => (p < 40 ? 'ws-danger' : p < 75 ? 'ws-warn' : 'ws-ok');

export default function OccupancyPage() {
  const [floorId, setFloorId] = useState(floors[0].id);
  const floor = floors.find((f) => f.id === floorId)!;
  const live = getLiveStatus(floorId);
  const count = (s: string) => Object.values(live).filter((v) => v === s).length;
  const capRows = getCapacityByFloor(floorId).filter((c) => !c.isTotalRow);
  const floorTotal = capacitySummary.find((c) => c.id === `cap-total-${floorId}`);

  return (
    <>
      <div className="ws-toolbar">
        <div className="field"><label>Floor</label>
          <select className="select" value={floorId} onChange={(e) => setFloorId(e.target.value)}>
            {floors.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
        <div className="spacer" />
        <Link className="btn btn--ghost btn--sm" href="/workspace/occupancy/no-shows"><Icon name="alert" size={15} /> No-shows ({noShowAlerts.filter((a) => !a.resolved).length})</Link>
      </div>

      <StatCards stats={[
        { icon: 'seat', tint: 'tint-blue', value: capacityGrandTotal.capTotal, label: 'Total capacity (campus)' },
        { icon: 'check', tint: 'tint-red', value: capacityGrandTotal.occTotal, label: 'Occupied' },
        { icon: 'unlock', tint: 'tint-green', value: capacityGrandTotal.vacTotal, label: 'Vacant' },
        { icon: 'heatmap', tint: 'tint-orange', value: `${capacityGrandTotal.occPct}%`, label: 'Campus occupancy' },
      ]} />

      <h3 className="section-title">Capacity vs occupancy — {floor.name} <span className="muted" style={{ fontWeight: 400, fontSize: 12.5 }}>(from the Main Data sheet)</span></h3>
      <div className="table-card" style={{ marginBottom: 18 }}>
        <table className="data-table">
          <thead><tr><th>Phase / Area</th><th className="num">WS</th><th className="num">Cub</th><th className="num">Cab</th><th className="num">Capacity</th><th className="num">Occupied</th><th className="num">Vacant</th><th className="num">Occupancy</th></tr></thead>
          <tbody>
            {capRows.map((c) => (
              <tr key={c.id}>
                <td>{c.area}</td><td className="num">{c.capWs}</td><td className="num">{c.capCub}</td><td className="num">{c.capCab}</td>
                <td className="num">{c.capTotal}</td><td className="num">{c.occTotal}</td><td className="num">{c.vacTotal}</td>
                <td className="num"><Pill tone={occTone(c.occPct)}>{c.occPct}%</Pill></td>
              </tr>
            ))}
            {floorTotal && (
              <tr style={{ fontWeight: 700, borderTop: '2px solid var(--border-strong)' }}>
                <td>{floorTotal.area}</td><td className="num">{floorTotal.capWs}</td><td className="num">{floorTotal.capCub}</td><td className="num">{floorTotal.capCab}</td>
                <td className="num">{floorTotal.capTotal}</td><td className="num">{floorTotal.occTotal}</td><td className="num">{floorTotal.vacTotal}</td>
                <td className="num"><Pill tone={occTone(floorTotal.occPct)}>{floorTotal.occPct}%</Pill></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h3 className="section-title">Live desk status — {floor.name}</h3>
      <StatCards stats={[
        { icon: 'check', tint: 'tint-green', value: count('vacant'), label: 'Vacant now' },
        { icon: 'calendar', tint: 'tint-orange', value: count('booked'), label: 'Booked' },
        { icon: 'seat', tint: 'tint-info', value: count('checked_in'), label: 'Checked-in' },
        { icon: 'crosshair', tint: 'tint-red', value: count('occupied'), label: 'Occupied' },
        { icon: 'alert', tint: 'tint-red', value: count('no_show'), label: 'No-show' },
      ]} />

      <FloorPlan floor={floor} desks={getDesksByFloor(floorId)} zones={getZonesByFloor(floorId)} rooms={getRoomsByFloor(floorId)} mode="occupancy" liveStatus={live} />
      <Legend items={LEGEND} />
      <p className="sub-hint" style={{ marginTop: 12 }}><Icon name="info" size={13} /> Top table = the planning view (capacity vs occupied vs vacant per phase) from the Main Data sheet. Below = live desk state from QR/manual check-in; no-shows auto-release after the grace window.</p>
    </>
  );
}
