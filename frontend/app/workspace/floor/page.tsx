'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import FloorPlan from '@/components/workspace/FloorCanvas';
import FloorEditor from '@/components/workspace/FloorEditorCanvas';
import { StatCards, Legend, DeskStateBadge, DeskTypeBadge, DeskKindBadge, VacancyBadge } from '@/components/workspace/ui';
import { floors, getDesksByFloor, getZonesByFloor, getRoomsByFloor, getElementsByFloor, getDesk, getArea, deskStateColor, serviceLineName, accountName } from '@/lib/workspace/mockData';

const LEGEND = [
  { label: 'Available', color: deskStateColor('available') },
  { label: 'Allocated', color: deskStateColor('allocated') },
  { label: 'Maintenance', color: deskStateColor('maintenance') },
  { label: 'Blocked', color: deskStateColor('blocked') },
];

export default function FloorPlanPage() {
  const [floorId, setFloorId] = useState(floors[0].id);
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [selId, setSelId] = useState<string | undefined>();

  const floor = floors.find((f) => f.id === floorId)!;
  const desks = getDesksByFloor(floorId);
  const sel = selId ? getDesk(selId) : undefined;
  const avail = desks.filter((d) => d.deskState === 'available').length;
  const alloc = desks.filter((d) => d.deskState === 'allocated').length;
  const maint = desks.filter((d) => d.deskState === 'maintenance' || d.deskState === 'blocked').length;

  return (
    <>
      {/* header: floor + view/edit toggle + contextual actions */}
      <div className="ws-toolbar" style={{ alignItems: 'flex-end' }}>
        {mode === 'view' && (
          <div className="field"><label>Floor</label>
            <select className="select" value={floorId} onChange={(e) => { setFloorId(e.target.value); setSelId(undefined); }}>
              {floors.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
        )}
        <div className="field"><label>Mode</label>
          <div className="seg">
            <button className={mode === 'view' ? 'active' : ''} onClick={() => { setMode('view'); setSelId(undefined); }}><Icon name="map" size={14} /> View</button>
            <button className={mode === 'edit' ? 'active' : ''} onClick={() => { setMode('edit'); setSelId(undefined); }}><Icon name="grid" size={14} /> Edit layout</button>
          </div>
        </div>
        <div className="spacer" />
        {mode === 'view' ? (
          <Link className="btn btn--primary btn--sm" href="/workspace/booking"><Icon name="seat" size={15} /> Book a desk</Link>
        ) : (
          <Link className="btn btn--ghost btn--sm" href="/workspace/studio/import"><Icon name="robot" size={15} /> AI import plan</Link>
        )}
      </div>

      {mode === 'edit' ? (
        <FloorEditor />
      ) : (
        <>
          <StatCards stats={[
            { icon: 'seat', tint: 'tint-blue', value: desks.length, label: 'Seats on floor' },
            { icon: 'check', tint: 'tint-green', value: avail, label: 'Available' },
            { icon: 'desk', tint: 'tint-info', value: alloc, label: 'Allocated' },
            { icon: 'alert', tint: 'tint-orange', value: maint, label: 'Blocked / maintenance' },
          ]} />

          <div className="ws-split">
            <div>
              <FloorPlan
                floor={floor} desks={desks} zones={getZonesByFloor(floorId)} rooms={getRoomsByFloor(floorId)} elements={getElementsByFloor(floorId)}
                mode="view" selectedDeskId={selId} onSelectDesk={setSelId}
                backgroundImageUrl={floor.bgImageUrl} backgroundOpacity={floor.bgOpacity}
              />
              <Legend items={LEGEND} />
            </div>

            <div className="ws-inspector">
              {sel ? (
                <>
                  <div className="section-title" style={{ margin: '0 0 10px' }}>Seat {sel.deskNo}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}><DeskKindBadge kind={sel.deskKind} /><DeskStateBadge state={sel.deskState} /><VacancyBadge vacant={!!sel.isVacant} /></div>
                  <div className="sub-hint">Occupant · {sel.occupantName ?? <span className="muted">Vacant</span>}{sel.empId ? ` (#${sel.empId})` : ''}</div>
                  <div className="sub-hint">Area · {getArea(sel.areaId ?? '')?.name ?? '—'}</div>
                  <div className="sub-hint">Service line · {serviceLineName(sel.serviceLineId)}</div>
                  <div className="sub-hint">Account · {accountName(sel.accountId)}</div>
                  <div className="sub-hint">Drawer / locker key · {sel.drawerKey ?? '—'}</div>
                  <div className="sub-hint">Extension · {sel.extNumber ?? '—'}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}><DeskTypeBadge type={sel.deskType} /></div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                    <Link className="btn btn--primary btn--sm" href="/workspace/booking">Book</Link>
                    <Link className="btn btn--ghost btn--sm" href="/workspace/allocation">Allocate</Link>
                  </div>
                </>
              ) : (
                <div className="sub-hint"><Icon name="crosshair" size={14} /> Click a seat on the plan to see who sits there, its drawer key &amp; extension, and book or allocate it. Switch to <b>Edit layout</b> to design the floor.</div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
