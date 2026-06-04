'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import FloorPlan from '@/components/workspace/FloorCanvas';
import { StatCards, Legend } from '@/components/workspace/ui';
import { floors, getDesksByFloor, getZonesByFloor, getRoomsByFloor, getDesk, deskStateColor, teamSeatingSuggestions, addDays, nowISO } from '@/lib/workspace/mockData';
import type { BookingKind } from '@/lib/workspace/types';

const KINDS: { v: BookingKind; label: string }[] = [{ v: 'hourly', label: 'Hourly' }, { v: 'half_day', label: 'Half day' }, { v: 'full_day', label: 'Full day' }, { v: 'multi_day', label: 'Multi-day' }];
const WINDOWS = [15, 30, 60];
const LEGEND = [{ label: 'Available', color: deskStateColor('available') }, { label: 'Suggested (near team)', color: '#f7991f' }, { label: 'Taken', color: deskStateColor('allocated') }];

export default function BookingPage() {
  const today = nowISO().slice(0, 10);
  const [floorId, setFloorId] = useState(floors[0].id);
  const [date, setDate] = useState(today);
  const [windowDays, setWindowDays] = useState(30);
  const [kind, setKind] = useState<BookingKind>('full_day');
  const [sitNear, setSitNear] = useState(false);
  const [selId, setSelId] = useState<string | undefined>();
  const [booked, setBooked] = useState(false);

  const floor = floors.find((f) => f.id === floorId)!;
  const sel = selId ? getDesk(selId) : undefined;
  const suggestion = teamSeatingSuggestions[0];
  const highlight = sitNear ? suggestion.suggestedDeskIds : [];

  return (
    <>
      <div className="ws-toolbar">
        <div className="field"><label>Date</label><input className="input" type="date" min={today} max={addDays(today, windowDays)} value={date} onChange={(e) => setDate(e.target.value)} /></div>
        <div className="field"><label>Booking window</label>
          <div className="seg">{WINDOWS.map((w) => <button key={w} className={windowDays === w ? 'active' : ''} onClick={() => setWindowDays(w)}>{w}d</button>)}</div>
        </div>
        <div className="field"><label>Type</label>
          <div className="seg">{KINDS.map((k) => <button key={k.v} className={kind === k.v ? 'active' : ''} onClick={() => setKind(k.v)}>{k.label}</button>)}</div>
        </div>
        <div className="field"><label>Floor</label>
          <select className="select" value={floorId} onChange={(e) => { setFloorId(e.target.value); setSelId(undefined); }}>{floors.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</select>
        </div>
        <div className="field"><label>&nbsp;</label>
          <button className={'btn btn--sm ' + (sitNear ? 'btn--primary' : 'btn--ghost')} onClick={() => setSitNear((s) => !s)}><Icon name="userGroup" size={15} /> Sit near my team</button>
        </div>
      </div>

      {sitNear && <div className="reco review" style={{ marginTop: 0 }}><Icon name="robot" size={14} /> {suggestion.rationale} — {suggestion.nearbyCount} nearby. Suggested desks highlighted.</div>}

      <div className="ws-split" style={{ marginTop: 14 }}>
        <div>
          <FloorPlan floor={floor} desks={getDesksByFloor(floorId)} zones={getZonesByFloor(floorId)} rooms={getRoomsByFloor(floorId)} mode={sitNear ? 'search' : 'view'} highlightDeskIds={highlight} selectedDeskId={selId} onSelectDesk={(id) => { setSelId(id); setBooked(false); }} showMinimap />
          <Legend items={LEGEND} />
        </div>
        <div className="ws-inspector">
          <div className="section-title" style={{ margin: '0 0 10px' }}>Your booking</div>
          <div className="sub-hint">Date · {date}</div>
          <div className="sub-hint">Type · {KINDS.find((k) => k.v === kind)?.label}</div>
          <div className="sub-hint">Desk · {sel ? sel.deskNo : 'none selected'}</div>
          {booked ? (
            <div className="reco ok">✓ Booked <b>{sel?.deskNo}</b> for {date}. QR sent. <Link className="panel__link" href="/workspace/booking/my">My bookings →</Link></div>
          ) : (
            <button className="btn btn--primary btn--sm" style={{ marginTop: 14 }} disabled={!sel} onClick={() => setBooked(true)}><Icon name="check" size={15} strokeWidth={2.2} /> Confirm booking</button>
          )}
          {!sel && <p className="sub-hint" style={{ marginTop: 10 }}>Click an available desk on the plan to select it.</p>}
        </div>
      </div>
    </>
  );
}
