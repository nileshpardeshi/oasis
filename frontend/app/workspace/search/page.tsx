'use client';

import { useMemo, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import FloorPlan from '@/components/workspace/FloorCanvas';
import { StatCards, ScopeNotice, PriorityBadge } from '@/components/workspace/ui';
import { floors, getDesksByFloor, getZonesByFloor, getRoomsByFloor, getDesk, scopedSearch, currentUser, serviceLineName } from '@/lib/workspace/mockData';

export default function SearchPage() {
  const [q, setQ] = useState('');
  const [floorId, setFloorId] = useState(floors[0].id);
  const [highlight, setHighlight] = useState<string[]>([]);
  const results = useMemo(() => scopedSearch(q, currentUser), [q]);
  const floor = floors.find((f) => f.id === floorId)!;

  const locate = (homeDeskId?: string) => {
    if (!homeDeskId) { alert('No fixed desk — this employee hot-desks. Try the Occupancy board for live presence.'); return; }
    const d = getDesk(homeDeskId);
    if (d) { setFloorId(d.floorId); setHighlight([homeDeskId]); }
  };

  return (
    <>
      <ScopeNotice>People-location is privacy-scoped — results respect each colleague's visibility setting (team/project) and opt-outs; lookups are audited.</ScopeNotice>
      <div className="ws-toolbar">
        <div className="field" style={{ flex: '1 1 280px' }}><label>Search — name / emp-id / email</label>
          <input className="input" style={{ width: '100%' }} placeholder="e.g. Ananya or 5004" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="field"><label>Floor</label>
          <select className="select" value={floorId} onChange={(e) => setFloorId(e.target.value)}>{floors.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</select>
        </div>
      </div>

      <StatCards stats={[
        { icon: 'search', tint: 'tint-blue', value: results.length, label: 'Matches' },
        { icon: 'userGroup', tint: 'tint-info', value: results.filter((e) => e.homeDeskId).length, label: 'With a fixed desk' },
        { icon: 'lock', tint: 'tint-orange', value: q ? '✓' : '—', label: 'Privacy-scoped', small: true },
      ]} />

      <div className="ws-split">
        <div>
          <FloorPlan floor={floor} desks={getDesksByFloor(floorId)} zones={getZonesByFloor(floorId)} rooms={getRoomsByFloor(floorId)} mode="search" highlightDeskIds={highlight} />
        </div>
        <div className="ws-inspector" style={{ maxHeight: 600, overflowY: 'auto' }}>
          <div className="section-title" style={{ margin: '0 0 8px' }}>Results</div>
          {results.length === 0 && <div className="sub-hint">{q ? 'No visible matches.' : 'Type to search people.'}</div>}
          {results.slice(0, 20).map((e) => (
            <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{e.name} <PriorityBadge level={e.priority} /></div>
                <div className="muted" style={{ fontSize: 11.5 }}>{e.empNo} · {serviceLineName(e.serviceLineId)}</div>
              </div>
              <button className="btn btn--ghost btn--icon" title="Locate on plan" onClick={() => locate(e.homeDeskId)}><Icon name="crosshair" size={15} /></button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
