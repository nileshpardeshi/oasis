'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import FloorPlan from '@/components/workspace/FloorCanvas';
import { StatCards, Legend, HeatBadge } from '@/components/workspace/ui';
import { floors, getDesksByFloor, getZonesByFloor, getRoomsByFloor, heatCells, heatColor, getDesk } from '@/lib/workspace/mockData';
import type { HeatPeriod, HeatLevel } from '@/lib/workspace/types';

const PERIODS: HeatPeriod[] = ['daily', 'weekly', 'monthly', 'quarterly'];
const LEGEND = [{ label: 'Vacant (<40%)', color: heatColor('green') }, { label: 'Moderate (40–75%)', color: heatColor('yellow') }, { label: 'High (>75%)', color: heatColor('red') }];

export default function HeatmapPage() {
  const [floorId, setFloorId] = useState(floors[0].id);
  const [period, setPeriod] = useState<HeatPeriod>('weekly');
  const floor = floors.find((f) => f.id === floorId)!;
  const desks = getDesksByFloor(floorId);
  const deskIds = new Set(desks.map((d) => d.id));
  const cells = heatCells.filter((c) => c.deskId && deskIds.has(c.deskId));
  const heat: Record<string, HeatLevel> = Object.fromEntries(cells.map((c) => [c.deskId!, c.level]));
  const band = (l: HeatLevel) => cells.filter((c) => c.level === l).length;
  const avg = cells.length ? Math.round(cells.reduce((s, c) => s + c.utilizationPct, 0) / cells.length) : 0;

  return (
    <>
      <div className="ws-toolbar">
        <div className="field"><label>Floor</label>
          <select className="select" value={floorId} onChange={(e) => setFloorId(e.target.value)}>{floors.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</select>
        </div>
        <div className="field"><label>Period</label>
          <div className="seg">{PERIODS.map((p) => <button key={p} className={period === p ? 'active' : ''} onClick={() => setPeriod(p)}>{p[0].toUpperCase() + p.slice(1)}</button>)}</div>
        </div>
        <div className="spacer" />
        <Link className="btn btn--ghost btn--sm" href="/workspace/forecast"><Icon name="forecast" size={15} /> Forecast</Link>
        <Link className="btn btn--ghost btn--sm" href="/workspace/cost"><Icon name="analytics" size={15} /> Cost</Link>
      </div>

      <StatCards stats={[
        { icon: 'heatmap', tint: 'tint-blue', value: `${avg}%`, label: `Avg utilisation (${period})` },
        { icon: 'check', tint: 'tint-green', value: band('green'), label: 'Vacant desks' },
        { icon: 'alert', tint: 'tint-orange', value: band('yellow'), label: 'Moderate' },
        { icon: 'crosshair', tint: 'tint-red', value: band('red'), label: 'Highly utilised' },
      ]} />

      <FloorPlan floor={floor} desks={desks} zones={getZonesByFloor(floorId)} rooms={getRoomsByFloor(floorId)} mode="heatmap" heat={heat} showMinimap />
      <Legend items={LEGEND} />
      <p className="sub-hint" style={{ marginTop: 12 }}><Icon name="info" size={13} /> Heatmap aggregates occupancy over the selected period (query-time rollup). AI flags under-utilised areas for consolidation (see Cost).</p>
    </>
  );
}
