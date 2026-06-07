'use client';

import { useMemo, useState } from 'react';
import { Icon, type IconName } from '@/components/ui/Icon';
import FloorPlan from '@/components/workspace/FloorCanvas';
import { StatCards, Pill, DeskKindBadge, VacancyBadge, Legend } from '@/components/workspace/ui';
import {
  floors, areas, desks, employees, seatRegister, registerStats, serviceLines, accounts, projects,
  getDesksByFloor, getZonesByFloor, getRoomsByFloor, getDesk, getArea, serviceLineName, accountName,
} from '@/lib/workspace/mockData';
import type { Employee, Desk } from '@/lib/workspace/types';

type Tab = 'overview' | 'assign' | 'areas' | 'bulk' | 'register';
const TABS: { v: Tab; label: string; icon: IconName }[] = [
  { v: 'overview', label: 'Overview', icon: 'dashboard' },
  { v: 'assign', label: 'Assign desk', icon: 'seat' },
  { v: 'areas', label: 'Areas & neighbourhoods', icon: 'zone' },
  { v: 'bulk', label: 'Bulk move', icon: 'relocation' },
  { v: 'register', label: 'Register', icon: 'grid' },
];
const occTone = (p: number) => (p < 40 ? 'ws-danger' : p < 75 ? 'ws-warn' : 'ws-ok');

function areaOwnerSL(areaId: string): string | undefined {
  const counts: Record<string, number> = {};
  desks.forEach((d) => { if (d.areaId === areaId && d.serviceLineId) counts[d.serviceLineId] = (counts[d.serviceLineId] || 0) + 1; });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
}

export default function AllocationPage() {
  const [tab, setTab] = useState<Tab>('overview');
  return (
    <>
      <div className="bk-adminbar"><Icon name="shield" size={15} /> <b>Allocation Register</b> — admin space &amp; seat management. Every change notifies the affected employee and is audit-logged.</div>
      <div className="seg al-tabs">
        {TABS.map((t) => <button key={t.v} className={tab === t.v ? 'active' : ''} onClick={() => setTab(t.v)}><Icon name={t.icon} size={14} /> {t.label}</button>)}
      </div>
      {tab === 'overview' && <Overview onTab={setTab} />}
      {tab === 'assign' && <Assign />}
      {tab === 'areas' && <Areas />}
      {tab === 'bulk' && <BulkMove />}
      {tab === 'register' && <Register />}
    </>
  );
}

/* ---------------- 1 · Overview ---------------- */
function Overview({ onTab }: { onTab: (t: Tab) => void }) {
  const unseated = employees.filter((e) => !e.homeDeskId);
  const util = Math.round((registerStats.occupied / registerStats.total) * 100);
  return (
    <>
      <StatCards stats={[
        { icon: 'seat', tint: 'tint-blue', value: registerStats.total, label: 'Total seats' },
        { icon: 'desk', tint: 'tint-info', value: registerStats.occupied, label: 'Assigned' },
        { icon: 'unlock', tint: 'tint-green', value: registerStats.vacant, label: 'Vacant' },
        { icon: 'userGroup', tint: 'tint-orange', value: unseated.length, label: 'Unseated employees' },
        { icon: 'heatmap', tint: 'tint-blue', value: `${util}%`, label: 'Utilisation' },
        { icon: 'zone', tint: 'tint-info', value: areas.length, label: 'Areas' },
      ]} />
      <div className="cards-2">
        <div className="table-card">
          <div className="al-cardhead">Allocation by area</div>
          <table className="data-table">
            <thead><tr><th>Area</th><th>Owner</th><th className="num">Cap</th><th className="num">Assigned</th><th className="num">Vacant</th><th className="num">Util</th></tr></thead>
            <tbody>
              {areas.map((a) => (
                <tr key={a.id}>
                  <td>{a.name}<div className="muted" style={{ fontSize: 11 }}>{floors.find((f) => f.id === a.floorId)?.name}</div></td>
                  <td>{serviceLineName(areaOwnerSL(a.id))}</td>
                  <td className="num">{a.capTotal}</td><td className="num">{a.occTotal}</td><td className="num">{a.vacTotal}</td>
                  <td className="num"><Pill tone={occTone(a.occPct)}>{a.occPct}%</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <div className="table-card" style={{ marginBottom: 16 }}>
            <div className="al-cardhead">Seats by service line</div>
            <div style={{ maxHeight: 220, overflowY: 'auto' }}>
              <table className="data-table">
                <thead><tr><th>Service line</th><th className="num">Headcount</th><th className="num">Seats held</th></tr></thead>
                <tbody>
                  {[...serviceLines].sort((a, b) => (b.headcount ?? 0) - (a.headcount ?? 0)).slice(0, 10).map((s) => (
                    <tr key={s.id}><td><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: s.colorHex, marginRight: 8 }} />{s.name}</td><td className="num">{s.headcount ?? '—'}</td><td className="num">{desks.filter((d) => d.serviceLineId === s.id).length}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="table-card">
            <div className="al-cardhead">Unseated employees ({unseated.length})</div>
            <div>
              {unseated.slice(0, 8).map((e) => (
                <div key={e.id} className="al-unseated__row"><span>{e.name}<span className="muted" style={{ fontSize: 11 }}> · {serviceLineName(e.serviceLineId)}</span></span><button className="btn btn--ghost btn--sm" onClick={() => onTab('assign')}>Assign →</button></div>
              ))}
              {unseated.length > 8 && <p className="sub-hint" style={{ padding: '8px 12px', margin: 0 }}>+{unseated.length - 8} more · open <b>Assign desk</b></p>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ---------------- 2 · Assign desk ---------------- */
type Occ = { name: string; empId?: string };
type LogEntry = { id: number; text: string; cross?: boolean; prev: Record<string, Occ | null> };
const ASSIGN_LEGEND = [{ label: 'Free', color: '#86efac' }, { label: 'Assigned', color: '#cbd5e1' }, { label: 'Changed', color: '#93c5fd' }, { label: 'Permanent', color: '#e8edf3' }, { label: 'Suggested', color: '#f7991f' }];

function Assign() {
  const [floorId, setFloorId] = useState(floors[0].id);
  const [sl, setSl] = useState('all');
  const [acc, setAcc] = useState('all');
  const [proj, setProj] = useState('all');
  const [unseatedOnly, setUnseatedOnly] = useState(true);
  const [q, setQ] = useState('');
  const [selEmp, setSelEmp] = useState<Employee | null>(null);
  const [selDeskId, setSelDeskId] = useState<string | null>(null);
  const [moving, setMoving] = useState<{ occ: Occ; fromDeskId: string | null } | null>(null);
  const [findBay, setFindBay] = useState(false);
  const [override, setOverride] = useState<Record<string, Occ | null>>({});
  const [log, setLog] = useState<LogEntry[]>([]);
  const logId = useMemo(() => ({ n: 0 }), []);

  const baseOcc = (d: Desk): Occ | null => (d.isVacant ? null : { name: d.occupantName ?? 'Occupant', empId: d.empId });
  const getOcc = (d: Desk): Occ | null => (d.id in override ? override[d.id] : baseOcc(d));
  const stateOf = (d: Desk): 'free' | 'occupied' | 'restricted' => (d.deskKind !== 'workstation' ? 'restricted' : getOcc(d) ? 'occupied' : 'free');

  const empSeat = useMemo(() => {
    const m: Record<string, string> = {};
    desks.forEach((d) => { const o = getOcc(d); if (o?.empId) m[o.empId] = d.id; });
    return m;
  }, [override]); // eslint-disable-line react-hooks/exhaustive-deps

  const people = useMemo(() => employees.filter((e) => {
    if (unseatedOnly && empSeat[e.id]) return false;
    if (sl !== 'all' && e.serviceLineId !== sl) return false;
    if (acc !== 'all' && e.accountId !== acc) return false;
    if (proj !== 'all' && e.projectId !== proj) return false;
    if (q.trim() && !`${e.name} ${e.empNo}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [unseatedOnly, sl, acc, proj, q, empSeat]);

  const onFloor = getDesksByFloor(floorId);
  const bstate = useMemo(() => {
    const m: Record<string, 'available' | 'taken' | 'restricted' | 'mine'> = {};
    onFloor.forEach((d) => { const st = stateOf(d); m[d.id] = st === 'restricted' ? 'restricted' : st === 'free' ? 'available' : (d.id in override ? 'mine' : 'taken'); });
    return m;
  }, [onFloor, override]); // eslint-disable-line react-hooks/exhaustive-deps

  const suggested = useMemo(() => {
    if (!selEmp) return undefined;
    const free = onFloor.filter((d) => bstate[d.id] === 'available');
    return free.find((d) => d.serviceLineId === selEmp.serviceLineId) ?? free[0];
  }, [selEmp, onFloor, bstate]);

  const bayHighlights = findBay && (sl !== 'all' || acc !== 'all')
    ? onFloor.filter((d) => bstate[d.id] === 'available' && (sl === 'all' || d.serviceLineId === sl) && (acc === 'all' || d.accountId === acc)).map((d) => d.id)
    : selEmp && suggested ? [suggested.id] : [];

  const freeInScope = onFloor.filter((d) => bstate[d.id] === 'available').length;
  const pushLog = (text: string, prev: Record<string, Occ | null>, cross?: boolean) => setLog((l) => [{ id: logId.n++, text, cross, prev }, ...l].slice(0, 12));
  const apply = (changes: Record<string, Occ | null>, text: string, cross?: boolean) => { const prev = { ...override }; setOverride((o) => ({ ...o, ...changes })); pushLog(text, prev, cross); };
  const undo = () => setLog((l) => { if (!l.length) return l; setOverride(l[0].prev); return l.slice(1); });

  const assign = (d: Desk, e: Employee) => {
    const old = empSeat[e.id]; const ch: Record<string, Occ | null> = {}; if (old) ch[old] = null; ch[d.id] = { name: e.name, empId: e.id };
    apply(ch, `Assigned ${e.name} → ${d.deskNo}${old ? ` (freed ${getDesk(old)?.deskNo})` : ''}`, !!(d.serviceLineId && e.serviceLineId && d.serviceLineId !== e.serviceLineId));
    setSelEmp(null); setSelDeskId(null); setMoving(null);
  };
  const swap = (d: Desk, e: Employee) => {
    const eSeat = empSeat[e.id]; const occ = getOcc(d); if (!eSeat || !occ) return;
    apply({ [eSeat]: occ, [d.id]: { name: e.name, empId: e.id } }, `Swapped ${e.name} ↔ ${occ.name} (${getDesk(eSeat)?.deskNo} ↔ ${d.deskNo})`);
    setSelEmp(null); setSelDeskId(null);
  };
  const displace = (d: Desk, e: Employee) => {
    const occ = getOcc(d)!; const old = empSeat[e.id]; const ch: Record<string, Occ | null> = {}; if (old) ch[old] = null; ch[d.id] = { name: e.name, empId: e.id };
    apply(ch, `Seated ${e.name} at ${d.deskNo}; ${occ.name} now unseated`);
    setSelEmp(null); setMoving({ occ, fromDeskId: null }); setSelDeskId(null);
  };
  const startReallocate = (d: Desk) => { const occ = getOcc(d); if (!occ) return; setMoving({ occ, fromDeskId: d.id }); setSelDeskId(null); setSelEmp(null); };
  const unseat = (d: Desk) => { const occ = getOcc(d); if (!occ) return; apply({ [d.id]: null }, `Unseated ${occ.name} from ${d.deskNo}`); setSelDeskId(null); };
  const moveTo = (d: Desk) => { if (!moving) return; const ch: Record<string, Occ | null> = { [d.id]: moving.occ }; if (moving.fromDeskId) ch[moving.fromDeskId] = null; apply(ch, `Moved ${moving.occ.name} → ${d.deskNo}`); setMoving(null); };

  // confirmation layer — nothing commits until the admin confirms
  const [pending, setPending] = useState<{ title: string; lines: string[]; warn?: string; confirmLabel: string; danger?: boolean; run: () => void } | null>(null);
  const reqAssign = (d: Desk, e: Employee) => { const old = empSeat[e.id]; const cross = !!(d.serviceLineId && e.serviceLineId && d.serviceLineId !== e.serviceLineId); setPending({ title: 'Assign desk', confirmLabel: 'Assign & notify', warn: cross ? `Outside ${e.name}'s service line (${serviceLineName(e.serviceLineId)} → ${serviceLineName(d.serviceLineId)}).` : undefined, lines: [`Assign ${e.name} → desk ${d.deskNo} · ${getArea(d.areaId ?? '')?.name ?? serviceLineName(d.serviceLineId)}.`, ...(old ? [`This frees their current seat ${getDesk(old)?.deskNo}.`] : []), 'The employee will be notified (Email · Teams · WhatsApp).'], run: () => assign(d, e) }); };
  const reqSwap = (d: Desk, e: Employee) => { const occ = getOcc(d); setPending({ title: 'Swap seats', confirmLabel: 'Swap & notify', lines: [`Swap ${e.name} (${getDesk(empSeat[e.id])?.deskNo}) ↔ ${occ?.name} (${d.deskNo}).`, 'Both employees will be notified.'], run: () => swap(d, e) }); };
  const reqDisplace = (d: Desk, e: Employee) => { const occ = getOcc(d); setPending({ title: 'Seat here', confirmLabel: 'Seat & notify', lines: [`Seat ${e.name} at ${d.deskNo}.`, `${occ?.name} becomes unseated — relocate them next.`, 'Both employees will be notified.'], run: () => displace(d, e) }); };
  const reqUnseat = (d: Desk) => { const occ = getOcc(d); setPending({ title: 'Unseat employee', confirmLabel: 'Unseat & notify', danger: true, lines: [`Unseat ${occ?.name} from ${d.deskNo}?`, 'The seat becomes free; the employee will be notified.'], run: () => unseat(d) }); };
  const reqMove = (d: Desk) => { if (!moving) return; setPending({ title: 'Relocate employee', confirmLabel: 'Move & notify', lines: [`Move ${moving.occ.name} → ${d.deskNo}.`, 'The employee will be notified.'], run: () => moveTo(d) }); };

  const onDesk = (id: string) => {
    const d = getDesk(id); if (!d) return;
    const st = stateOf(d);
    if (moving && st === 'free') { reqMove(d); return; }
    if (selEmp && st === 'free') { reqAssign(d, selEmp); return; }
    setSelDeskId(id); // open detail card for contextual actions
  };

  const selDesk = selDeskId ? getDesk(selDeskId) : null;
  const selOcc = selDesk ? getOcc(selDesk) : null;
  const selSt = selDesk ? stateOf(selDesk) : null;

  return (
    <>
    <div className="bk-grid">
      <div className="bk-rail">
        <div className="bk-rail__t">Find people</div>
        <input className="input" style={{ width: '100%' }} placeholder="Name or Emp ID…" value={q} onChange={(e) => setQ(e.target.value)} />
        <label className="bk-check" style={{ marginTop: 8 }}><input type="checkbox" checked={unseatedOnly} onChange={(e) => setUnseatedOnly(e.target.checked)} /> Unseated only</label>
        <div className="bk-rail__t">Service line</div>
        <select className="select" style={{ width: '100%' }} value={sl} onChange={(e) => setSl(e.target.value)}><option value="all">All</option>{serviceLines.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        <div className="bk-rail__t">Account</div>
        <select className="select" style={{ width: '100%' }} value={acc} onChange={(e) => setAcc(e.target.value)}><option value="all">All</option>{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
        <div className="bk-rail__t">Project</div>
        <select className="select" style={{ width: '100%' }} value={proj} onChange={(e) => setProj(e.target.value)}><option value="all">All</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <button className={'btn btn--sm ' + (findBay ? 'btn--primary' : 'btn--ghost')} style={{ width: '100%', marginTop: 12, justifyContent: 'center' }} onClick={() => setFindBay((f) => !f)}><Icon name="crosshair" size={15} /> Find bay (highlight)</button>

        <div className="bk-rail__t">People ({people.length})</div>
        <div className="al-people">
          {people.slice(0, 60).map((e) => {
            const seat = empSeat[e.id] ? getDesk(empSeat[e.id])?.deskNo : null;
            return (
              <button key={e.id} className={'al-person' + (selEmp?.id === e.id ? ' on' : '')} onClick={() => { setSelEmp(e); setMoving(null); }}>
                <span className="al-person__nm">{e.name}</span>
                <span className="al-person__sub">{serviceLineName(e.serviceLineId)} · {seat ? `seat ${seat}` : 'unseated'}</span>
              </button>
            );
          })}
          {people.length === 0 && <p className="sub-hint" style={{ padding: 10 }}>No matching people.</p>}
        </div>

        {log.length > 0 && (
          <>
            <div className="bk-rail__t" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>Recent changes <button className="btn btn--ghost btn--sm" onClick={undo}><Icon name="arrowLeft" size={13} /> Undo</button></div>
            <div className="al-log">
              {log.map((e) => <div key={e.id} className="al-log__row"><Icon name="check" size={12} /> <span>{e.text}{e.cross && <b className="al-cross"> ⚠ cross-area</b>}<br /><span className="muted" style={{ fontSize: 10.5 }}>notified · Email · Teams · WhatsApp</span></span></div>)}
            </div>
          </>
        )}
      </div>

      <div className="bk-mapwrap">
        <div className="bk-viewbar">
          <div className="field"><label>Floor</label><select className="select" value={floorId} onChange={(e) => { setFloorId(e.target.value); setSelDeskId(null); }}>{floors.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</select></div>
          <span className="spacer" />
          {moving ? <span className="fed-active">Relocating <b>{moving.occ.name}</b> — click a free desk</span>
            : selEmp ? <span className="fed-active">Seating <b>{selEmp.name}</b> — click a free desk</span>
              : <span className="sub-hint">Pick a person, or click any desk for actions</span>}
          <span className="bk-chip" style={{ background: 'var(--success-tint)', color: '#14803a' }}>{freeInScope} free</span>
        </div>

        {selEmp && suggested && !findBay && !moving && (
          <div className="reco review" style={{ margin: '0 0 10px' }}><Icon name="robot" size={14} /> AI suggests <b>{suggested.deskNo}</b> for {selEmp.name} — nearest free seat in {serviceLineName(selEmp.serviceLineId)}. <button className="btn btn--primary btn--sm" style={{ marginLeft: 8 }} onClick={() => reqAssign(suggested, selEmp)}>Assign here</button></div>
        )}

        <FloorPlan key={floorId} floor={floors.find((f) => f.id === floorId)!} desks={onFloor} zones={getZonesByFloor(floorId)} rooms={getRoomsByFloor(floorId)} mode="booking" bookingState={bstate} highlightDeskIds={bayHighlights} selectedDeskId={selDeskId ?? undefined} onSelectDesk={onDesk} />
        <Legend items={ASSIGN_LEGEND} />
        <p className="sub-hint" style={{ marginTop: 8 }}><Icon name="info" size={13} /> Hover a desk to see its seat number · click a free desk to assign the selected person · click an occupied desk for swap / reallocate / unseat.</p>

        {/* desk detail + contextual actions (floats over the map) */}
        {selDesk && (
          <div className="bk-overlay">
            <button className="bk-overlay__close" type="button" aria-label="Close" onClick={() => setSelDeskId(null)}>×</button>
            <div className="section-title" style={{ margin: '0 0 8px' }}>Desk {selDesk.deskNo}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              <DeskKindBadge kind={selDesk.deskKind} />
              <Pill tone={selSt === 'free' ? 'ws-ok' : selSt === 'restricted' ? 'ws-muted' : 'ws-info'}>{selSt === 'free' ? 'Free' : selSt === 'restricted' ? 'Permanent' : 'Assigned'}</Pill>
            </div>
            <div className="bk-detail">
              <div><span>Occupant</span><b>{selOcc ? selOcc.name : 'Vacant'}</b></div>
              <div><span>Area</span><b>{getArea(selDesk.areaId ?? '')?.name ?? '—'}</b></div>
              <div><span>Service line</span><b>{serviceLineName(selDesk.serviceLineId)}</b></div>
              <div><span>Account</span><b>{accountName(selDesk.accountId)}</b></div>
              <div><span>Amenities</span><b>{[selDesk.hasMonitor && 'Monitor', selDesk.isStanding && 'Standing', selDesk.isAccessible && 'Accessible'].filter(Boolean).join(', ') || '—'}</b></div>
            </div>

            {selSt === 'restricted' && <div className="reco" style={{ marginTop: 10, background: '#eef1f5', color: 'var(--text-muted)' }}><Icon name="lock" size={14} /> Permanent {selDesk.deskKind} — reserved for {selOcc?.name ?? 'an employee'}. Not allocatable here.</div>}

            {selSt === 'free' && (
              <div className="al-actions">
                {moving ? <button className="btn btn--primary btn--sm" onClick={() => reqMove(selDesk)}>Move {moving.occ.name} here</button>
                  : selEmp ? <button className="btn btn--primary btn--sm" onClick={() => reqAssign(selDesk, selEmp)}>Assign {selEmp.name} here</button>
                    : <p className="sub-hint">Pick an employee on the left, then assign them to this free seat.</p>}
              </div>
            )}

            {selSt === 'occupied' && (
              <div className="al-actions">
                {selEmp && selEmp.id !== selOcc?.empId && (empSeat[selEmp.id]
                  ? <button className="btn btn--primary btn--sm" onClick={() => reqSwap(selDesk, selEmp)}><Icon name="relocation" size={14} /> Swap with {selEmp.name}</button>
                  : <button className="btn btn--primary btn--sm" onClick={() => reqDisplace(selDesk, selEmp)}><Icon name="seat" size={14} /> Seat {selEmp.name} here</button>)}
                <button className="btn btn--ghost btn--sm" onClick={() => startReallocate(selDesk)}><Icon name="map" size={14} /> Reallocate {selOcc?.name}</button>
                <button className="btn btn--ghost btn--sm is-danger" onClick={() => reqUnseat(selDesk)}><Icon name="trash" size={14} /> Unseat</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>

    {pending && (
      <div className="al-modal-backdrop" onClick={() => setPending(null)}>
        <div className="al-modal" onClick={(e) => e.stopPropagation()}>
          <div className="al-modal__t">{pending.title}</div>
          {pending.lines.map((l, i) => <p key={i} className="al-modal__l">{l}</p>)}
          {pending.warn && <div className="al-impact" style={{ maxWidth: 'none' }}><Icon name="alert" size={12} /> {pending.warn}</div>}
          <div className="al-modal__actions">
            <button className="btn btn--ghost btn--sm" onClick={() => setPending(null)}>Cancel</button>
            <button className="btn btn--primary btn--sm" style={pending.danger ? { background: 'var(--danger)' } : undefined} onClick={() => { pending.run(); setPending(null); }}><Icon name="check" size={14} /> {pending.confirmLabel}</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

/* ---------------- 3 · Areas & neighbourhoods — service-line desk allocation ---------------- */
type DMode = 'fixed' | 'flexible';

const FLEX_COLOR = '#f7991f';
function Areas() {
  const [floorId, setFloorId] = useState(floors[0].id);
  const [selSL, setSelSL] = useState(serviceLines[0].id);
  const [mode, setMode] = useState<DMode>('fixed');
  const [fixedTarget, setFixedTarget] = useState(70);
  const [flexTarget, setFlexTarget] = useState(30);
  const [areaSel, setAreaSel] = useState(areas.find((a) => a.floorId === floors[0].id)?.id ?? areas[0].id);
  const [alloc, setAlloc] = useState<Record<string, { sl: string; mode: DMode }>>({});
  const [saved, setSaved] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const baseMode = (d: Desk): DMode => (d.deskType === 'fixed' ? 'fixed' : 'flexible');
  const ownerOf = (d: Desk) => (alloc[d.id] ? alloc[d.id].sl : (d.serviceLineId ?? ''));
  const modeOf = (d: Desk): DMode => (alloc[d.id] ? alloc[d.id].mode : baseMode(d));
  const slHex = (id: string) => serviceLines.find((s) => s.id === id)?.colorHex ?? '#64748b';
  // allocatable = a workstation that is the selected line's own, unassigned, OR a vacant desk (free to reassign).
  // A desk OCCUPIED by another service line is locked (you can't take someone else's seat).
  const eligible = (d: Desk) => d.deskKind === 'workstation' && (ownerOf(d) === selSL || ownerOf(d) === '' || d.isVacant);

  const onFloor = getDesksByFloor(floorId);
  const setMany = (ids: string[], val: { sl: string; mode: DMode }) => { setAlloc((p) => { const n = { ...p }; ids.forEach((id) => { n[id] = val; }); return n; }); setSaved(false); };
  const paint = (ids: string[]) => { setMany(ids.filter((id) => { const d = getDesk(id); return !!d && eligible(d); }), { sl: selSL, mode }); setNote(null); };

  const onDesk = (id: string) => {
    const d = getDesk(id); if (!d || d.deskKind !== 'workstation') return;
    if (!eligible(d)) { setNote(`${d.deskNo} is occupied by ${serviceLineName(d.serviceLineId)} — locked. You can only allocate vacant desks.`); return; }
    const owned = ownerOf(d) === selSL && modeOf(d) === mode;
    setMany([id], owned ? { sl: '', mode } : { sl: selSL, mode }); setNote(null);
  };

  const owned = desks.filter((d) => ownerOf(d) === selSL);
  const fixedN = owned.filter((d) => modeOf(d) === 'fixed').length;
  const flexN = owned.length - fixedN;

  const hex = slHex(selSL);
  const deskColors: Record<string, string> = {};
  onFloor.forEach((d) => {
    const o = ownerOf(d);
    if (o === selSL) deskColors[d.id] = modeOf(d) === 'fixed' ? hex : FLEX_COLOR;
    else if (o && !d.isVacant) deskColors[d.id] = '#d3d9e2';       // locked — occupied by another line
    else if (d.isVacant) deskColors[d.id] = '#dff0e6';            // vacant → available to allocate
    else deskColors[d.id] = '#eef1f5';                            // unassigned
  });

  const slName = serviceLineName(selSL);
  const LEGEND = [{ label: `${slName} · Fixed`, color: hex }, { label: 'Flexible (bookable)', color: FLEX_COLOR }, { label: 'Available to allocate', color: '#dff0e6' }, { label: 'Locked · in use by other line', color: '#d3d9e2' }];
  const areaDesks = (aid: string, freeOnly: boolean) => onFloor.filter((d) => eligible(d) && d.areaId === aid && (!freeOnly || d.isVacant)).map((d) => d.id);
  const slDeskCount = (id: string) => desks.filter((d) => ownerOf(d) === id).length;
  const total = owned.length || 1;
  const areaRows = areas.map((a) => { const inA = owned.filter((d) => d.areaId === a.id); return { a, n: inA.length, fx: inA.filter((d) => modeOf(d) === 'fixed').length }; }).filter((r) => r.n > 0);

  const bar = (n: number, t: number) => <div className="al-prog"><span style={{ width: `${Math.min(100, t ? (n / t) * 100 : 0)}%`, background: n > t ? '#dc2626' : n >= t ? '#16a34a' : hex }} /></div>;

  return (
    <>
      <div className="bk-grid">
        <div className="bk-rail">
          <div className="bk-rail__t">Allocating for</div>
          <select className="select" style={{ width: '100%' }} value={selSL} onChange={(e) => setSelSL(e.target.value)}>{serviceLines.map((s) => <option key={s.id} value={s.id}>{s.name} ({slDeskCount(s.id)})</option>)}</select>
          <div className="al-slswatch"><span style={{ background: hex }} /> {slName}</div>

          <div className="bk-rail__t">Quota — desks for {slName}</div>
          <div className="al-quota">
            <label><span>Fixed</span><input className="input" type="number" min={0} value={fixedTarget} onChange={(e) => setFixedTarget(Math.max(0, +e.target.value))} /></label>
            <label><span>Flexible</span><input className="input" type="number" min={0} value={flexTarget} onChange={(e) => setFlexTarget(Math.max(0, +e.target.value))} /></label>
            <div className="al-quota__tot">Total <b>{fixedTarget + flexTarget}</b></div>
          </div>
          <div className="sub-hint" style={{ marginTop: 8 }}>Fixed <b style={{ color: fixedN > fixedTarget ? '#dc2626' : 'var(--text)' }}>{fixedN}</b>/{fixedTarget}</div>
          {bar(fixedN, fixedTarget)}
          <div className="sub-hint" style={{ marginTop: 6 }}>Flexible <b style={{ color: flexN > flexTarget ? '#dc2626' : 'var(--text)' }}>{flexN}</b>/{flexTarget}</div>
          {bar(flexN, flexTarget)}
          {(fixedN > fixedTarget || flexN > flexTarget) && <div className="al-impact" style={{ maxWidth: 'none', marginTop: 8 }}><Icon name="alert" size={12} /> Allocated more than the quota — reduce or raise the target.</div>}

          <div className="bk-rail__t">Paint selected desks as</div>
          <div className="seg" style={{ width: '100%' }}>{(['fixed', 'flexible'] as DMode[]).map((m) => <button key={m} className={mode === m ? 'active' : ''} style={{ flex: 1 }} onClick={() => setMode(m)}>{m === 'fixed' ? 'Fixed' : 'Flexible'}</button>)}</div>

          <div className="bk-rail__t">Bulk select (by area · this floor)</div>
          <select className="select" style={{ width: '100%' }} value={areaSel} onChange={(e) => setAreaSel(e.target.value)}>{areas.filter((a) => a.floorId === floorId).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <button className="btn btn--ghost btn--sm" style={{ flex: 1 }} onClick={() => paint(areaDesks(areaSel, true))}>+ Free</button>
            <button className="btn btn--ghost btn--sm" style={{ flex: 1 }} onClick={() => paint(areaDesks(areaSel, false))}>+ All</button>
          </div>
          <button className="btn btn--ghost btn--sm is-danger" style={{ width: '100%', marginTop: 6 }} onClick={() => setMany(onFloor.filter((d) => ownerOf(d) === selSL).map((d) => d.id), { sl: '', mode })}>Clear {slName} (this floor)</button>

          <button className="btn btn--primary btn--sm" style={{ width: '100%', marginTop: 12, justifyContent: 'center' }} onClick={() => setSaved(true)}><Icon name="check" size={15} /> Save allocation</button>
          {saved && <div className="reco ok" style={{ marginTop: 8 }}>✓ Saved (mock) — synced to Booking eligibility &amp; the Floor view.</div>}
        </div>

        <div className="bk-mapwrap">
          <div className="bk-viewbar">
            <div className="field"><label>Floor</label><select className="select" value={floorId} onChange={(e) => { setFloorId(e.target.value); setAreaSel(areas.find((a) => a.floorId === e.target.value)?.id ?? areaSel); }}>{floors.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</select></div>
            <span className="spacer" />
            <span className="fed-active"><b>Click</b> a desk to add/remove · <b>drag a box</b> for many · painting as <b>{mode}</b></span>
          </div>
          {note && <div className="reco review" style={{ marginTop: 0, marginBottom: 10 }}><Icon name="lock" size={14} /> {note}</div>}
          <FloorPlan key={floorId + selSL} floor={floors.find((f) => f.id === floorId)!} desks={onFloor} zones={getZonesByFloor(floorId)} rooms={getRoomsByFloor(floorId)} mode="alloc" deskColors={deskColors} onSelectDesk={onDesk} onMarquee={paint} />
          <Legend items={LEGEND} />
          <p className="sub-hint" style={{ marginTop: 8 }}><Icon name="info" size={13} /> <b>Single-click</b> a desk to add/remove it, or <b>drag a box</b> to allocate many at once (right-drag to pan). You can allocate any <b>vacant</b> desk; desks in use by another line are locked. Fixed = {slName} colour, Flexible (bookable) = orange.</p>
        </div>
      </div>

      <div className="table-card" style={{ marginTop: 16 }}>
        <div className="al-cardhead">{slName} — area-wise allocation ({owned.length} desks · {Math.round((fixedN / total) * 100)}% fixed)</div>
        <table className="data-table">
          <thead><tr><th>Area</th><th>Floor</th><th className="num">Fixed</th><th className="num">Flexible</th><th className="num">Total</th><th>Share of {slName}</th></tr></thead>
          <tbody>
            {areaRows.map((r) => (
              <tr key={r.a.id}>
                <td>{r.a.name}</td><td className="muted">{floors.find((f) => f.id === r.a.floorId)?.name}</td>
                <td className="num">{r.fx}</td><td className="num">{r.n - r.fx}</td><td className="num">{r.n}</td>
                <td><div className="al-sharebar"><span style={{ width: `${Math.round((r.n / total) * 100)}%`, background: hex }} /></div><span className="muted" style={{ fontSize: 11 }}>{Math.round((r.n / total) * 100)}%</span></td>
              </tr>
            ))}
            {areaRows.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 20, color: 'var(--text-soft)' }}>No desks allocated to {slName} yet — select some on the map.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ---------------- 4 · Bulk move ---------------- */
function BulkMove() {
  const [groupBy, setGroupBy] = useState<'sl' | 'account' | 'project'>('sl');
  const [groupId, setGroupId] = useState(serviceLines[0].id);
  const [targetId, setTargetId] = useState(areas[0].id);
  const [makeRoom, setMakeRoom] = useState(false);
  const [status, setStatus] = useState<'draft' | 'executed'>('draft');

  const groupOptions = groupBy === 'sl' ? serviceLines : groupBy === 'account' ? accounts : projects;
  const groupSize = useMemo(() => {
    if (groupBy === 'sl') return employees.filter((e) => e.serviceLineId === groupId).length || desks.filter((d) => d.serviceLineId === groupId && !d.isVacant).length;
    if (groupBy === 'account') return desks.filter((d) => d.accountId === groupId && !d.isVacant).length;
    return employees.filter((e) => e.projectId === groupId).length;
  }, [groupBy, groupId]);

  const target = getArea(targetId)!;
  const free = target.vacTotal;
  const seated = Math.min(groupSize, makeRoom ? target.capTotal : free);
  const overflow = Math.max(0, groupSize - seated);
  const displaced = makeRoom ? Math.max(0, Math.min(groupSize, target.capTotal) - free) : 0;
  const cohesion = Math.max(70, 100 - overflow * 3 - displaced);
  const groupName = groupOptions.find((g) => g.id === groupId)?.name ?? '';

  return (
    <>
      <p className="sub-hint" style={{ marginBottom: 12 }}><Icon name="relocation" size={13} /> Move a group to a target area. AI auto-packs into free seats; large moves go through <b>draft → approve → execute</b> and notify everyone affected.</p>
      <div className="al-steps">
        <div className="al-step">
          <div className="al-step__n">1</div>
          <div style={{ flex: 1 }}>
            <div className="al-step__t">Who is moving</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
              <div className="seg">{(['sl', 'account', 'project'] as const).map((g) => <button key={g} className={groupBy === g ? 'active' : ''} onClick={() => { setGroupBy(g); setGroupId((g === 'sl' ? serviceLines : g === 'account' ? accounts : projects)[0].id); setStatus('draft'); }}>{g === 'sl' ? 'Service line' : g[0].toUpperCase() + g.slice(1)}</button>)}</div>
              <select className="select" value={groupId} onChange={(e) => { setGroupId(e.target.value); setStatus('draft'); }}>{groupOptions.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select>
              <span className="bk-chip" style={{ background: 'var(--brand-blue-tint)', color: 'var(--brand-blue)' }}>{groupSize} people</span>
            </div>
          </div>
        </div>
        <div className="al-step">
          <div className="al-step__n">2</div>
          <div style={{ flex: 1 }}>
            <div className="al-step__t">Target area</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6, alignItems: 'center' }}>
              <select className="select" value={targetId} onChange={(e) => { setTargetId(e.target.value); setStatus('draft'); }}>{areas.map((a) => <option key={a.id} value={a.id}>{a.name} ({floors.find((f) => f.id === a.floorId)?.name})</option>)}</select>
              <span className="sub-hint">free <b>{free}</b> · occupied <b>{target.occTotal}</b> · cap {target.capTotal}</span>
              <label className="bk-check"><input type="checkbox" checked={makeRoom} onChange={(e) => { setMakeRoom(e.target.checked); setStatus('draft'); }} /> Make room (AI relocates occupants)</label>
            </div>
          </div>
        </div>
        <div className="al-step">
          <div className="al-step__n">3</div>
          <div style={{ flex: 1 }}>
            <div className="al-step__t"><Icon name="robot" size={14} /> AI plan</div>
            <div className="al-plan">
              <div><span>Seated in target</span><b>{seated}</b></div>
              <div><span>Overflow (needs another area)</span><b style={{ color: overflow ? '#dc2626' : undefined }}>{overflow}</b></div>
              <div><span>Existing occupants relocated</span><b>{displaced}</b></div>
              <div><span>Team cohesion</span><b>{cohesion}%</b></div>
            </div>
            {overflow > 0 && <div className="reco review" style={{ marginTop: 8 }}><Icon name="robot" size={14} /> {overflow} won&apos;t fit — AI suggests splitting them to the nearest area with free seats, or enable “Make room”.</div>}
          </div>
        </div>
        <div className="al-step">
          <div className="al-step__n">4</div>
          <div style={{ flex: 1 }}>
            <div className="al-step__t">Review &amp; execute</div>
            {status === 'draft' ? (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                <button className="btn btn--ghost btn--sm" onClick={() => alert(`Mock: seat-by-seat preview — ${seated} of ${groupSize} ${groupName} into ${target.name}.`)}><Icon name="grid" size={14} /> Preview seat-by-seat</button>
                <button className="btn btn--primary btn--sm" onClick={() => setStatus('executed')}><Icon name="check" size={14} /> Approve &amp; execute</button>
              </div>
            ) : (
              <div className="reco ok" style={{ marginTop: 6 }}>✓ Move executed (mock): {seated} {groupName} seated in {target.name}{displaced ? `, ${displaced} relocated` : ''}{overflow ? `, ${overflow} pending` : ''}. <b>{seated + displaced}</b> employees notified (Email · Teams · WhatsApp).</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ---------------- 5 · Register ---------------- */
function Register() {
  const [kind, setKind] = useState<'all' | 'workstation' | 'cubicle' | 'cabin'>('all');
  const [occ, setOcc] = useState<'all' | 'occupied' | 'vacant'>('all');
  const [floorId, setFloorId] = useState('all');
  const [q, setQ] = useState('');
  const rows = seatRegister.filter((r) => {
    if (kind !== 'all' && r.deskKind !== kind) return false;
    if (occ === 'occupied' && r.isVacant) return false;
    if (occ === 'vacant' && !r.isVacant) return false;
    if (floorId !== 'all' && r.floorId !== floorId) return false;
    if (q.trim() && !`${r.occupantName ?? ''} ${r.empId ?? ''} ${r.seatNo} ${r.rawGroup ?? ''} ${r.rawAccount ?? ''}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });
  const dash = (v?: string) => (v ? v : <span className="muted">—</span>);
  return (
    <>
      <div className="ws-toolbar">
        <div className="field"><label>Search</label><input className="input" placeholder="Name, Emp ID, seat, group…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <div className="field"><label>Type</label><div className="seg">{(['all', 'workstation', 'cubicle', 'cabin'] as const).map((k) => <button key={k} className={kind === k ? 'active' : ''} onClick={() => setKind(k)}>{k === 'all' ? 'All' : k === 'workstation' ? 'WS' : k[0].toUpperCase() + k.slice(1)}</button>)}</div></div>
        <div className="field"><label>Status</label><div className="seg">{(['all', 'occupied', 'vacant'] as const).map((o) => <button key={o} className={occ === o ? 'active' : ''} onClick={() => setOcc(o)}>{o[0].toUpperCase() + o.slice(1)}</button>)}</div></div>
        <div className="field"><label>Floor</label><select className="select" value={floorId} onChange={(e) => setFloorId(e.target.value)}><option value="all">All</option>{floors.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</select></div>
        <div className="spacer" />
        <button className="btn btn--ghost btn--sm" onClick={() => alert('Mock: export register to CSV / Excel.')}><Icon name="image" size={15} /> Export</button>
      </div>
      <div className="sub-hint" style={{ margin: '0 0 8px' }}>Showing <b>{rows.length}</b> of {registerStats.total} seats</div>
      <div className="table-card"><div style={{ maxHeight: 520, overflowY: 'auto' }}>
        <table className="data-table">
          <thead><tr><th>Emp ID</th><th>Type</th><th>Seat #</th><th>Drawer Key</th><th>Name</th><th className="num">Ext</th><th>Group</th><th>Account</th><th>Status</th></tr></thead>
          <tbody>
            {rows.slice(0, 400).map((r) => (
              <tr key={r.id} style={r.isVacant ? { color: 'var(--text-muted)' } : undefined}>
                <td className="mono">{dash(r.empId)}</td><td><DeskKindBadge kind={r.deskKind} /></td><td className="mono">{r.seatNo}</td><td className="mono">{dash(r.drawerKey)}</td>
                <td>{r.isVacant ? <span className="muted">Vacant</span> : r.occupantName}</td><td className="num mono">{dash(r.extNumber)}</td>
                <td>{r.rawGroup || (r.serviceLineId ? serviceLineName(r.serviceLineId) : <span className="muted">—</span>)}</td>
                <td>{r.rawAccount || (r.accountId ? accountName(r.accountId) : <span className="muted">—</span>)}</td>
                <td><VacancyBadge vacant={r.isVacant} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>{rows.length > 400 && <p className="sub-hint" style={{ padding: '10px 14px', margin: 0 }}>Showing first 400 — narrow the filters.</p>}</div>
    </>
  );
}
