'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import FloorPlan from '@/components/workspace/FloorCanvas';
import { Legend, StatCards, ScopeNotice } from '@/components/workspace/ui';
import {
  floors, getDesksByFloor, getZonesByFloor, getRoomsByFloor, getDesk, getEmployee, getArea,
  serviceLineName, accountName, bookings, currentUser, employees, desks, serviceLines, getMyBookings, scopedSearch,
  addDays, nowISO, fmtDate, teamSeatingSuggestions,
} from '@/lib/workspace/mockData';
import type { Employee } from '@/lib/workspace/types';

type BState = 'available' | 'mine' | 'taken' | 'inuse' | 'noshow' | 'restricted';
type SlotKey = 'full' | 'morning' | 'afternoon' | 'custom';

const WINDOW_DAYS = 7; // from Admin config (default 7)
const SLOTS: { v: SlotKey; label: string; range: [number, number] }[] = [
  { v: 'full', label: 'Full day', range: [9, 18] },
  { v: 'morning', label: 'Morning', range: [9, 13] },
  { v: 'afternoon', label: 'Afternoon', range: [13, 18] },
  { v: 'custom', label: 'Custom', range: [10, 14] },
];
const DAY_START = 8, DAY_END = 20;
const ADMIN_ROLES = ['admin', 'super_admin', 'facility_manager'];
const LEGEND = [
  { label: 'Available', color: '#86efac' }, { label: 'Your booking', color: '#93c5fd' },
  { label: 'Booked', color: '#cbd5e1' }, { label: 'In use', color: '#5eead4' },
  { label: 'No-show', color: '#fca5a5' }, { label: 'Restricted', color: '#e8edf3' },
];
const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const hhmm = (h: number) => `${String(Math.floor(h)).padStart(2, '0')}:${h % 1 ? '30' : '00'}`;

function QrMock({ value, size = 116 }: { value: string; size?: number }) {
  const n = 21, cell = size / n;
  let s = 1; for (const c of value) s = (s * 31 + c.charCodeAt(0)) >>> 0;
  const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  const isFinder = (x: number, y: number) => (x < 7 && y < 7) || (x > n - 8 && y < 7) || (x < 7 && y > n - 8);
  const cells = [];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!isFinder(x, y) && rnd() > 0.5) cells.push(<rect key={`${x}-${y}`} x={x * cell} y={y * cell} width={cell + 0.4} height={cell + 0.4} fill="#0b2545" />);
  const finder = (ox: number, oy: number) => (<g key={`f${ox}-${oy}`}><rect x={ox * cell} y={oy * cell} width={7 * cell} height={7 * cell} fill="#0b2545" /><rect x={(ox + 1) * cell} y={(oy + 1) * cell} width={5 * cell} height={5 * cell} fill="#fff" /><rect x={(ox + 2) * cell} y={(oy + 2) * cell} width={3 * cell} height={3 * cell} fill="#0b2545" /></g>);
  return <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ background: '#fff', borderRadius: 8, display: 'block' }}>{cells}{finder(0, 0)}{finder(n - 7, 0)}{finder(0, n - 7)}</svg>;
}

function BookDesk() {
  const today = nowISO().slice(0, 10);
  const isAdmin = ADMIN_ROLES.includes(currentUser.role);
  const [bookingFor, setBookingFor] = useState(currentUser.employeeId);
  const [day, setDay] = useState(today);
  const [slot, setSlot] = useState<SlotKey>('full');
  const [custom, setCustom] = useState<[number, number]>([10, 14]);
  const [arrival, setArrival] = useState('10:00');
  const [floorId, setFloorId] = useState(floors[0].id);
  const [scope, setScope] = useState<'mine' | 'all'>('mine');
  const [amen, setAmen] = useState({ monitor: false, standing: false, accessible: false });
  const [sitNear, setSitNear] = useState(false);
  const [view, setView] = useState<'map' | 'list'>('map');
  const [selId, setSelId] = useState<string | undefined>();
  const [nl, setNl] = useState('');
  const [confirmed, setConfirmed] = useState<null | { code: string; deskNo: string; area: string }>(null);

  const me = getEmployee(bookingFor);
  const mySL = me?.serviceLineId;
  const floorDesks = getDesksByFloor(floorId);
  const slotRange = slot === 'custom' ? custom : SLOTS.find((s) => s.v === slot)!.range;

  const days = useMemo(() => Array.from({ length: WINDOW_DAYS }, (_, i) => addDays(today, i)), [today]);
  const dayBusy = (d: string) => { const wd = new Date(d).getDay(); if (wd === 0 || wd === 6) return 12 + (d.charCodeAt(9) % 8); return 30 + ((new Date(d).getDate() * 17 + floorId.length * 7) % 50); };

  // desks within the configured scope (own area + hot-desk pool, or whole floor)
  const scoped = useMemo(() => scope === 'all' ? floorDesks : floorDesks.filter((d) => d.serviceLineId === mySL || d.isVacant), [scope, floorDesks, mySL]);

  // booking state per desk for the chosen day
  const dayBookings = useMemo(() => {
    const m: Record<string, { empId: string; status: string }> = {};
    bookings.forEach((b) => { if (b.deskId && b.startsAt.slice(0, 10) === day && ['held', 'booked', 'checked_in', 'no_show'].includes(b.status)) m[b.deskId] = { empId: b.employeeId, status: b.status }; });
    return m;
  }, [day]);
  const stateOf = (id: string): BState => {
    const d = getDesk(id); if (!d) return 'restricted';
    if (!d.isBookable) return 'restricted';
    const bk = dayBookings[id];
    if (bk) return bk.empId === bookingFor ? 'mine' : bk.status === 'checked_in' ? 'inuse' : bk.status === 'no_show' ? 'noshow' : 'taken';
    return 'available';
  };
  const bookingState = useMemo(() => Object.fromEntries(scoped.map((d) => [d.id, stateOf(d.id)])) as Record<string, BState>, [scoped, dayBookings, bookingFor]);

  const amenMatch = (d: ReturnType<typeof getDesk>) => !d ? false : (!amen.monitor || d.hasMonitor) && (!amen.standing || d.isStanding) && (!amen.accessible || d.isAccessible);
  const availableDesks = useMemo(() => scoped.filter((d) => bookingState[d.id] === 'available' && amenMatch(d)), [scoped, bookingState, amen]);

  const suggestedIds = teamSeatingSuggestions[0]?.suggestedDeskIds ?? [];
  const recommended = useMemo(() => availableDesks.find((d) => suggestedIds.includes(d.id)) ?? availableDesks[0], [availableDesks]); // eslint-disable-line react-hooks/exhaustive-deps
  const highlight = sitNear ? suggestedIds.filter((id) => bookingState[id] === 'available') : [];

  const sel = selId ? getDesk(selId) : undefined;
  const selState = selId ? bookingState[selId] : undefined;
  const selBk = selId ? dayBookings[selId] : undefined;

  const slotLabel = slot === 'custom' ? `${hhmm(custom[0])}–${hhmm(custom[1])}` : SLOTS.find((s) => s.v === slot)!.label;
  const pick = (id: string) => { setSelId(id); setConfirmed(null); };
  const quick = (d: string) => { setDay(d); setSlot('full'); setConfirmed(null); };
  const confirm = () => { if (!sel) return; setConfirmed({ code: `BK-${1000 + Math.floor(Math.random() * 8999)}`, deskNo: sel.deskNo, area: getArea(sel.areaId ?? '')?.name ?? serviceLineName(sel.serviceLineId) }); };

  return (
    <>
      {isAdmin && (
        <div className="bk-adminbar">
          <Icon name="shield" size={15} /> <b>Admin mode</b> — you can book, change or cancel for anyone.
          <span className="spacer" />
          <label>Booking as</label>
          <select className="select" value={bookingFor} onChange={(e) => { setBookingFor(e.target.value); setConfirmed(null); }}>
            <option value={currentUser.employeeId}>{currentUser.name} (you)</option>
            {employees.slice(0, 12).map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
          </select>
        </div>
      )}

      {/* quick book + natural-language */}
      <div className="bk-quick">
        <span className="bk-quick__lbl"><Icon name="seat" size={15} /> Quick book</span>
        <button className="btn btn--primary btn--sm" onClick={() => quick(today)}>Today · Full day</button>
        <button className="btn btn--ghost btn--sm" onClick={() => quick(addDays(today, 1))}>Tomorrow · Full day</button>
        <div className="bk-nl">
          <Icon name="robot" size={15} />
          <input className="input" placeholder="Try: “a desk near my team on Friday afternoon”" value={nl} onChange={(e) => setNl(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && nl.trim()) { setSitNear(true); setSlot('afternoon'); setDay(days[Math.min(5, WINDOW_DAYS - 1)]); } }} />
          <span className="bk-nl__hint">AI</span>
        </div>
      </div>

      {/* day strip */}
      <div className="bk-daystrip">
        {days.map((d) => {
          const busy = dayBusy(d); const active = d === day; const dt = new Date(d);
          return (
            <button key={d} className={'bk-day' + (active ? ' on' : '')} onClick={() => { setDay(d); setConfirmed(null); }}>
              <span className="bk-day__dow">{dow[dt.getDay()]}</span>
              <span className="bk-day__num">{dt.getDate()}</span>
              <span className="bk-day__bar"><span style={{ width: `${busy}%`, background: busy > 75 ? '#dc2626' : busy > 45 ? '#f7991f' : '#16a34a' }} /></span>
              <span className="bk-day__pct">{busy}%</span>
            </button>
          );
        })}
        <span className="bk-day__note">Booking window: {WINDOW_DAYS} days (admin-set)</span>
      </div>

      {/* slot + arrival + time bar */}
      <div className="bk-slotcard">
        <div className="field"><label>Time slot</label>
          <div className="seg">{SLOTS.map((s) => <button key={s.v} className={slot === s.v ? 'active' : ''} onClick={() => setSlot(s.v)}>{s.label}</button>)}</div>
        </div>
        {slot === 'custom' && (
          <div className="field"><label>Hours</label>
            <div className="bk-custom">
              <select className="select" value={custom[0]} onChange={(e) => setCustom([+e.target.value, custom[1]])}>{Array.from({ length: DAY_END - DAY_START }, (_, i) => DAY_START + i).map((h) => <option key={h} value={h}>{hhmm(h)}</option>)}</select>
              <span>–</span>
              <select className="select" value={custom[1]} onChange={(e) => setCustom([custom[0], +e.target.value])}>{Array.from({ length: DAY_END - DAY_START }, (_, i) => DAY_START + 1 + i).map((h) => <option key={h} value={h}>{hhmm(h)}</option>)}</select>
            </div>
          </div>
        )}
        <div className="field"><label>Expected arrival</label><input className="input" type="time" value={arrival} onChange={(e) => setArrival(e.target.value)} style={{ minWidth: 120 }} /></div>
        <div className="field" style={{ flex: 1, minWidth: 220 }}><label>&nbsp;</label>
          <div className="bk-timebar">
            <span className="bk-timebar__fill" style={{ left: `${((slotRange[0] - DAY_START) / (DAY_END - DAY_START)) * 100}%`, width: `${((slotRange[1] - slotRange[0]) / (DAY_END - DAY_START)) * 100}%` }} />
            <span className="bk-timebar__tick" style={{ left: '0%' }}>{hhmm(DAY_START)}</span>
            <span className="bk-timebar__tick" style={{ left: '50%' }}>{hhmm((DAY_START + DAY_END) / 2)}</span>
            <span className="bk-timebar__tick" style={{ right: 0 }}>{hhmm(DAY_END)}</span>
          </div>
        </div>
      </div>

      <div className="bk-grid">
        {/* filters rail */}
        <div className="bk-rail">
          <div className="bk-rail__t">Scope</div>
          <div className="seg seg--v">
            <button className={scope === 'mine' ? 'active' : ''} onClick={() => setScope('mine')}>My area + hot-desks</button>
            <button className={scope === 'all' ? 'active' : ''} onClick={() => setScope('all')}>Whole floor</button>
          </div>
          <p className="sub-hint" style={{ margin: '6px 2px 0' }}>Visible area is admin-configurable.</p>

          <div className="bk-rail__t">Floor</div>
          <select className="select" value={floorId} onChange={(e) => { setFloorId(e.target.value); setSelId(undefined); }} style={{ width: '100%' }}>{floors.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</select>

          <div className="bk-rail__t">Amenities</div>
          <label className="bk-check"><input type="checkbox" checked={amen.monitor} onChange={(e) => setAmen({ ...amen, monitor: e.target.checked })} /> Monitor</label>
          <label className="bk-check"><input type="checkbox" checked={amen.standing} onChange={(e) => setAmen({ ...amen, standing: e.target.checked })} /> Standing desk</label>
          <label className="bk-check"><input type="checkbox" checked={amen.accessible} onChange={(e) => setAmen({ ...amen, accessible: e.target.checked })} /> Accessible</label>

          <button className={'btn btn--sm ' + (sitNear ? 'btn--primary' : 'btn--ghost')} style={{ width: '100%', marginTop: 12, justifyContent: 'center' }} onClick={() => setSitNear((s) => !s)}><Icon name="userGroup" size={15} /> Sit near my team</button>

          {recommended && (
            <button className="bk-rec" onClick={() => pick(recommended.id)}>
              <Icon name="robot" size={15} />
              <span><b>Recommended</b><br />{recommended.deskNo} · near your team</span>
            </button>
          )}
          <Link className="btn btn--ghost btn--sm" href="/workspace/booking/my" style={{ width: '100%', marginTop: 10, justifyContent: 'center' }}><Icon name="calendar" size={15} /> My schedule</Link>
        </div>

        {/* map / list (detail floats over it — no horizontal scroll) */}
        <div className="bk-mapwrap">
          <div className="bk-viewbar">
            <div className="seg">
              <button className={view === 'map' ? 'active' : ''} onClick={() => setView('map')}><Icon name="map" size={14} /> Map</button>
              <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}><Icon name="grid" size={14} /> List</button>
            </div>
            <span className="spacer" />
            <span className="sub-hint"><b>{availableDesks.length}</b> available · {fmtDate(day)}</span>
            {availableDesks.length > 0 && <button className="btn btn--ghost btn--sm" onClick={() => pick((recommended ?? availableDesks[0]).id)}><Icon name="check" size={14} /> First available</button>}
          </div>

          {view === 'map' ? (
            <>
              <FloorPlan key={scope + floorId} floor={floors.find((f) => f.id === floorId)!} desks={scoped} zones={getZonesByFloor(floorId)} rooms={getRoomsByFloor(floorId)} mode="booking" bookingState={bookingState} highlightDeskIds={highlight} selectedDeskId={selId} onSelectDesk={pick} />
              <Legend items={LEGEND} />
              <p className="sub-hint" style={{ marginTop: 8 }}><Icon name="info" size={13} /> Hover a desk to see its seat number · click a green desk to book.</p>
            </>
          ) : (
            <div className="table-card" style={{ maxHeight: 520, overflowY: 'auto' }}>
              <table className="data-table">
                <thead><tr><th>Desk</th><th>Area</th><th>Amenities</th><th></th></tr></thead>
                <tbody>
                  {availableDesks.map((d) => (
                    <tr key={d.id} style={{ background: selId === d.id ? 'var(--brand-blue-tint)' : undefined }}>
                      <td className="mono">{d.deskNo}</td>
                      <td>{getArea(d.areaId ?? '')?.name ?? serviceLineName(d.serviceLineId)}</td>
                      <td className="muted" style={{ fontSize: 12 }}>{[d.hasMonitor && 'Monitor', d.isStanding && 'Standing', d.isAccessible && 'Accessible'].filter(Boolean).join(' · ') || '—'}</td>
                      <td className="num"><button className="btn btn--ghost btn--sm" onClick={() => pick(d.id)}>Select</button></td>
                    </tr>
                  ))}
                  {availableDesks.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 22, color: 'var(--text-soft)' }}>No available desks for this scope/day. Try “Whole floor” or another day.</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {/* desk detail + summary / confirmation — floats over the map */}
          {(sel || confirmed) && (
            <div className="bk-overlay">
              <button className="bk-overlay__close" type="button" aria-label="Close" onClick={() => { setSelId(undefined); setConfirmed(null); }}>×</button>
              {confirmed ? (
            <div className="bk-confirm">
              <div className="bk-confirm__tick"><Icon name="check" size={26} strokeWidth={2.4} /></div>
              <div className="section-title" style={{ margin: '8px 0 2px' }}>Booking confirmed</div>
              <p className="sub-hint" style={{ justifyContent: 'center' }}>{confirmed.code}</p>
              <QrMock value={confirmed.code + confirmed.deskNo} />
              <p className="sub-hint" style={{ justifyContent: 'center', marginTop: 8 }}>Scan at <b>{confirmed.deskNo}</b> to check in</p>
              <div className="bk-detail">
                <div><span>Desk</span><b>{confirmed.deskNo}</b></div>
                <div><span>When</span><b>{fmtDate(day)} · {slotLabel}</b></div>
                <div><span>Arrival</span><b>{arrival}</b></div>
                {bookingFor !== currentUser.employeeId && <div><span>For</span><b>{me?.name}</b></div>}
              </div>
              <div className="bk-chips">Sent to {['Email', 'MS Teams', 'WhatsApp'].map((c) => <span key={c} className="bk-chip"><Icon name="check" size={12} /> {c}</span>)}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <Link className="btn btn--ghost btn--sm" href="/workspace/booking/my" style={{ flex: 1, justifyContent: 'center' }}>My schedule</Link>
                <button className="btn btn--primary btn--sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { setConfirmed(null); setSelId(undefined); }}>Book another</button>
              </div>
            </div>
          ) : sel ? (
            <>
              <div className="section-title" style={{ margin: '0 0 10px' }}>Desk {sel.deskNo}</div>
              <span className={'ws-pill ' + (selState === 'available' ? 'ws-ok' : selState === 'mine' ? 'ws-info' : selState === 'inuse' ? 'ws-info' : selState === 'noshow' ? 'ws-noshow' : selState === 'restricted' ? 'ws-muted' : 'ws-muted')}>
                {selState === 'available' ? 'Available' : selState === 'mine' ? 'Your booking' : selState === 'inuse' ? 'In use' : selState === 'noshow' ? 'No-show' : selState === 'restricted' ? 'Restricted' : 'Booked'}
              </span>
              <div className="bk-detail" style={{ marginTop: 12 }}>
                <div><span>Area</span><b>{getArea(sel.areaId ?? '')?.name ?? '—'}</b></div>
                <div><span>Service line</span><b>{serviceLineName(sel.serviceLineId)}</b></div>
                <div><span>Account</span><b>{accountName(sel.accountId)}</b></div>
                <div><span>Amenities</span><b>{[sel.hasMonitor && 'Monitor', sel.isStanding && 'Standing', sel.isAccessible && 'Accessible'].filter(Boolean).join(', ') || '—'}</b></div>
              </div>

              {selState === 'available' && (
                <>
                  <div className="bk-detail bk-detail--sum">
                    <div><span>When</span><b>{fmtDate(day)} · {slotLabel}</b></div>
                    <div><span>Arrival</span><b>{arrival}</b></div>
                    {bookingFor !== currentUser.employeeId && <div><span>For</span><b>{me?.name}</b></div>}
                  </div>
                  <button className="btn btn--primary" style={{ width: '100%', marginTop: 12, justifyContent: 'center' }} onClick={confirm}><Icon name="check" size={16} strokeWidth={2.2} /> Confirm booking</button>
                </>
              )}
              {(selState === 'taken' || selState === 'inuse' || selState === 'noshow' || selState === 'mine') && selBk && (
                <div className="reco review" style={{ marginTop: 12 }}>
                  <Icon name="seat" size={14} /> Booked by <b>{selBk.empId === bookingFor ? 'you' : getEmployee(selBk.empId)?.name ?? selBk.empId}</b> · {fmtDate(day)} · {selState === 'inuse' ? 'checked-in (in use)' : selState === 'noshow' ? 'no-show' : 'booked'}.
                  {isAdmin && selBk.empId !== bookingFor && <div style={{ marginTop: 8 }}><button className="btn btn--ghost btn--sm" onClick={() => alert('Mock: admin override — reassign / cancel this booking (notifies employee).')}>Admin override</button></div>}
                </div>
              )}
              {selState === 'restricted' && (
                <div className="reco" style={{ marginTop: 12, background: '#eef1f5', color: 'var(--text-muted)' }}>
                  <Icon name="lock" size={14} /> Permanent seat — reserved for <b>{sel.occupantName ?? 'an employee'}</b>. Not bookable.
                </div>
              )}
            </>
          ) : null}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ---------------- Find people (people + desk wayfinding) ---------------- */
function FindPeople({ onGoBook }: { onGoBook: () => void }) {
  const today = nowISO().slice(0, 10);
  const [q, setQ] = useState('');
  const [sl, setSl] = useState('all');
  const [floorId, setFloorId] = useState(floors[0].id);
  const [sel, setSel] = useState<string | null>(null);

  const people = useMemo(() => scopedSearch(q, currentUser).filter((e) => sl === 'all' || e.serviceLineId === sl), [q, sl]);
  const deskHit = useMemo(() => { const t = q.trim().toLowerCase().replace(/\s+/g, ''); if (t.length < 3) return undefined; return desks.find((d) => d.deskNo.toLowerCase().replace(/\s+/g, '') === t); }, [q]);

  const seatOf = (e: Employee) => {
    const tb = getMyBookings(e.id).find((b) => b.deskId && b.startsAt.slice(0, 10) === today && ['booked', 'checked_in', 'held'].includes(b.status));
    if (tb?.deskId) return { deskId: tb.deskId, label: `Booked ${getDesk(tb.deskId)?.deskNo} today`, kind: 'booking' as const };
    if (e.homeDeskId) return { deskId: e.homeDeskId, label: `Fixed seat ${getDesk(e.homeDeskId)?.deskNo}`, kind: 'fixed' as const };
    return undefined;
  };
  const presence = (e: Employee) => (e.status === 'remote' ? { t: 'Remote', tone: 'ws-muted' } : e.status === 'on_leave' ? { t: 'On leave', tone: 'ws-warn' } : { t: 'In office', tone: 'ws-ok' });

  const selEmp = sel ? getEmployee(sel) : null;
  const selSeat = selEmp ? seatOf(selEmp) : undefined;
  const highlight = deskHit ? [deskHit.id] : selSeat?.deskId ? [selSeat.deskId] : [];
  const locate = (e: Employee) => { const s = seatOf(e); setSel(e.id); if (s?.deskId) { const d = getDesk(s.deskId); if (d) setFloorId(d.floorId); } };
  useEffect(() => { if (deskHit) { setFloorId(deskHit.floorId); setSel(null); } }, [deskHit]);

  const floor = floors.find((f) => f.id === floorId)!;

  return (
    <>
      <ScopeNotice>People-location is privacy-scoped — results respect each colleague&apos;s visibility (team / project) &amp; opt-outs; every lookup is audited.</ScopeNotice>
      <div className="ws-toolbar">
        <div className="field" style={{ flex: '1 1 300px' }}><label>Find a colleague or desk</label>
          <input className="input" style={{ width: '100%' }} placeholder="Name, emp-id, email… or a desk no (e.g. WS 214)" value={q} onChange={(e) => { setQ(e.target.value); setSel(null); }} />
        </div>
        <div className="field"><label>Service line</label><select className="select" value={sl} onChange={(e) => setSl(e.target.value)}><option value="all">All</option>{serviceLines.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
        <div className="field"><label>Floor</label><select className="select" value={floorId} onChange={(e) => setFloorId(e.target.value)}>{floors.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</select></div>
      </div>

      <StatCards stats={[
        { icon: 'search', tint: 'tint-blue', value: people.length, label: 'People matched' },
        { icon: 'seat', tint: 'tint-info', value: people.filter((e) => seatOf(e)).length, label: 'Located' },
        { icon: 'check', tint: 'tint-green', value: people.filter((e) => e.status === 'active').length, label: 'In office today' },
        { icon: 'lock', tint: 'tint-orange', value: q ? '✓' : '—', label: 'Privacy-scoped', small: true },
      ]} />

      {deskHit && <div className="reco review" style={{ marginTop: 0 }}><Icon name="crosshair" size={14} /> Desk <b>{deskHit.deskNo}</b> · {getArea(deskHit.areaId ?? '')?.name ?? serviceLineName(deskHit.serviceLineId)} — {deskHit.occupantName ?? 'Vacant'}. Highlighted on the plan.</div>}

      <div className="ws-split">
        <div>
          <FloorPlan key={floorId} floor={floor} desks={getDesksByFloor(floorId)} zones={getZonesByFloor(floorId)} rooms={getRoomsByFloor(floorId)} mode="search" highlightDeskIds={highlight} selectedDeskId={selSeat?.deskId} />
        </div>
        <div className="ws-inspector" style={{ maxHeight: 620, overflowY: 'auto' }}>
          <div className="section-title" style={{ margin: '0 0 8px' }}>Results</div>
          {people.length === 0 && <div className="sub-hint">{q ? 'No visible matches for your access scope.' : 'Type a name, emp-id, email or desk number.'}</div>}
          <div className="al-people">
            {people.slice(0, 25).map((e) => {
              const s = seatOf(e); const pr = presence(e);
              return (
                <button key={e.id} className={'al-person' + (sel === e.id ? ' on' : '')} onClick={() => locate(e)}>
                  <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}><span className="al-person__nm">{e.name}</span><span className={'ws-pill ' + pr.tone}>{pr.t}</span></span>
                  <span className="al-person__sub">{e.title} · {serviceLineName(e.serviceLineId)}{e.accountId ? ` · ${accountName(e.accountId)}` : ''}</span>
                  <span className="al-person__sub">{s ? s.label : 'Hot-desks — no fixed seat'}</span>
                </button>
              );
            })}
          </div>
          {selEmp && (
            <div className="reco ok" style={{ marginTop: 10 }}>
              <b>{selEmp.name}</b> — {selSeat ? selSeat.label : 'no fixed seat (hot-desks)'}.
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}><button className="btn btn--primary btn--sm" onClick={onGoBook}><Icon name="seat" size={14} /> Book near {selEmp.name.split(' ')[0]}</button></div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function BookingPage() {
  const [tab, setTab] = useState<'book' | 'find'>('book');
  useEffect(() => { try { if (new URLSearchParams(window.location.search).get('tab') === 'find') setTab('find'); } catch { /* ignore */ } }, []);
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div className="seg">
          <button className={tab === 'book' ? 'active' : ''} onClick={() => setTab('book')}><Icon name="seat" size={14} /> Book a desk</button>
          <button className={tab === 'find' ? 'active' : ''} onClick={() => setTab('find')}><Icon name="search" size={14} /> Find people</button>
        </div>
        <span style={{ flex: 1 }} />
        <Link className="btn btn--ghost btn--sm" href="/workspace/booking/my"><Icon name="calendar" size={15} /> My schedule</Link>
      </div>
      {tab === 'book' ? <BookDesk /> : <FindPeople onGoBook={() => setTab('book')} />}
    </>
  );
}
