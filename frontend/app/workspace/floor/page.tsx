'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import FloorPlan from '@/components/workspace/FloorCanvas';
import { StatCards, Legend, DeskStateBadge, DeskTypeBadge, DeskKindBadge } from '@/components/workspace/ui';
import { floors, getDesksByFloor, getZonesByFloor, getRoomsByFloor, getElementsByFloor, getDesk, getArea, deskStateColor, serviceLineName, accountName } from '@/lib/workspace/mockData';

const LEGEND = [
  { label: 'Available', color: deskStateColor('available') },
  { label: 'Allocated', color: deskStateColor('allocated') },
  { label: 'Maintenance', color: deskStateColor('maintenance') },
  { label: 'Blocked', color: deskStateColor('blocked') },
];

export default function FloorViewPage() {
  const [floorId, setFloorId] = useState(floors[0].id);
  const [selId, setSelId] = useState<string | undefined>();
  const floor = floors.find((f) => f.id === floorId)!;
  const desks = getDesksByFloor(floorId);
  const sel = selId ? getDesk(selId) : undefined;
  const avail = desks.filter((d) => d.deskState === 'available').length;
  const alloc = desks.filter((d) => d.deskState === 'allocated').length;
  const maint = desks.filter((d) => d.deskState === 'maintenance').length;

  return (
    <>
      <div className="ws-toolbar">
        <div className="field"><label>Floor</label>
          <select className="select" value={floorId} onChange={(e) => { setFloorId(e.target.value); setSelId(undefined); }}>
            {floors.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
        <div className="spacer" />
        <Link className="btn btn--ghost btn--sm" href={`/workspace/studio/${floorId}`}><Icon name="grid" size={15} /> Edit in Studio</Link>
        <Link className="btn btn--primary btn--sm" href="/workspace/booking"><Icon name="seat" size={15} /> Book a desk</Link>
      </div>

      <StatCards stats={[
        { icon: 'desk', tint: 'tint-blue', value: desks.length, label: 'Desks on floor' },
        { icon: 'check', tint: 'tint-green', value: avail, label: 'Available' },
        { icon: 'seat', tint: 'tint-info', value: alloc, label: 'Allocated' },
        { icon: 'alert', tint: 'tint-orange', value: maint, label: 'Maintenance' },
      ]} />

      <div className="ws-split">
        <div>
          <FloorPlan
            floor={floor} desks={desks} zones={getZonesByFloor(floorId)} rooms={getRoomsByFloor(floorId)} elements={getElementsByFloor(floorId)}
            mode="view" selectedDeskId={selId} onSelectDesk={setSelId} showMinimap backgroundImageUrl={floor.bgImageUrl} backgroundOpacity={floor.bgOpacity}
          />
          <Legend items={LEGEND} />
        </div>
        <div className="ws-inspector">
          {sel ? (
            <>
              <div className="section-title" style={{ margin: '0 0 10px' }}>Seat {sel.deskNo}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}><DeskKindBadge kind={sel.deskKind} /><DeskStateBadge state={sel.deskState} /><DeskTypeBadge type={sel.deskType} /></div>
              <div className="sub-hint">Occupant · {sel.occupantName ?? <span className="muted">Vacant</span>}{sel.empId ? ` (#${sel.empId})` : ''}</div>
              <div className="sub-hint">Area · {getArea(sel.areaId ?? '')?.name ?? '—'}</div>
              <div className="sub-hint">Service line · {serviceLineName(sel.serviceLineId)}</div>
              <div className="sub-hint">Account · {accountName(sel.accountId)}</div>
              <div className="sub-hint">Drawer / locker key · {sel.drawerKey ?? '—'}</div>
              <div className="sub-hint">Extension · {sel.extNumber ?? '—'}</div>
              <div className="sub-hint">Bookable · {sel.isBookable ? 'Yes' : 'No (assigned seat)'}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <Link className="btn btn--primary btn--sm" href="/workspace/booking">Book</Link>
                <Link className="btn btn--ghost btn--sm" href="/workspace/allocation">Allocate</Link>
              </div>
            </>
          ) : (
            <div className="sub-hint"><Icon name="crosshair" size={14} /> Click a desk on the plan to see details, book or allocate.</div>
          )}
        </div>
      </div>
    </>
  );
}
