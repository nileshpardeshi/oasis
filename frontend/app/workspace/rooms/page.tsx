'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { StatCards, RoomStatusBadge } from '@/components/workspace/ui';
import { meetingRooms, floors } from '@/lib/workspace/mockData';

export default function RoomsPage() {
  const [floorId, setFloorId] = useState('all');
  const rooms = floorId === 'all' ? meetingRooms : meetingRooms.filter((r) => r.floorId === floorId);
  const floorName = (id: string) => floors.find((f) => f.id === id)?.name ?? id;

  return (
    <>
      <div className="ws-toolbar">
        <div className="field"><label>Floor</label>
          <select className="select" value={floorId} onChange={(e) => setFloorId(e.target.value)}>
            <option value="all">All floors</option>{floors.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
      </div>
      <StatCards stats={[
        { icon: 'meetingRoom', tint: 'tint-blue', value: rooms.length, label: 'Meeting rooms' },
        { icon: 'check', tint: 'tint-green', value: rooms.filter((r) => r.status === 'available').length, label: 'Available' },
        { icon: 'crosshair', tint: 'tint-info', value: rooms.filter((r) => r.status === 'in_use').length, label: 'In use' },
        { icon: 'userGroup', tint: 'tint-orange', value: rooms.reduce((s, r) => s + r.capacity, 0), label: 'Total seats' },
      ]} />
      <div className="grid-modules">
        {rooms.map((r) => (
          <div className="module" key={r.id} style={{ cursor: 'default' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="module__icon tint-info"><Icon name="meetingRoom" size={20} /></div>
              <RoomStatusBadge status={r.status} />
            </div>
            <div className="module__title">{r.name} <span className="muted" style={{ fontWeight: 400, fontSize: 12 }}>· {r.roomNo}</span></div>
            <div className="module__desc">{floorName(r.floorId)} · {r.capacity} pax · {(r.kind ?? 'meeting').replace('_', ' ')}{r.location ? ` · ${r.location}` : ''}</div>
            <div className="module__open" onClick={() => alert(`Mock: availability for ${r.name}${r.outlookResourceEmail ? ' (Outlook sync in FE-2)' : ''}`)} style={{ cursor: 'pointer' }}>View availability <Icon name="chevronRight" size={14} /></div>
          </div>
        ))}
      </div>
      <p className="sub-hint" style={{ marginTop: 14 }}><Icon name="calendar" size={13} /> Availability syncs with Outlook/Graph in FE-2; OASIS owns the floor-plan view + capacity/equipment metadata.</p>
    </>
  );
}
