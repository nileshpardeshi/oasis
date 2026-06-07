'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { StatCards, BookingStatusBadge, EmptyState } from '@/components/workspace/ui';
import { bookings, getMyBookings, getDesk, getRoom, currentUser, fmtDate, fmtTime, nowISO, addDays } from '@/lib/workspace/mockData';
import type { Booking } from '@/lib/workspace/types';

const DAY_START = 8, DAY_END = 20, dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const hourOf = (iso: string) => { const t = iso.slice(11, 16); return +t.slice(0, 2) + (+t.slice(3, 5)) / 60; };

export default function MyBookingsPage() {
  const today = nowISO().slice(0, 10);
  const mine = getMyBookings(currentUser.employeeId);
  const seed: Booking[] = (mine.length ? mine : bookings.slice(0, 7)).filter((b) => b.deskId || b.meetingRoomId);
  const [cancelled, setCancelled] = useState<Set<string>>(new Set());
  const [arrived, setArrived] = useState<Set<string>>(new Set());
  const rows = seed.filter((b) => !cancelled.has(b.id));
  const where = (b: Booking) => (b.deskId ? getDesk(b.deskId)?.deskNo : b.meetingRoomId ? getRoom(b.meetingRoomId)?.name : '—') ?? '—';
  const isArrived = (b: Booking) => arrived.has(b.id) || b.status === 'checked_in';

  const week = Array.from({ length: 7 }, (_, i) => addDays(today, i));
  const byDay = (d: string) => rows.filter((b) => b.startsAt.slice(0, 10) === d);

  return (
    <>
      <div className="ws-toolbar">
        <Link className="btn btn--ghost btn--sm" href="/workspace/booking"><Icon name="arrowLeft" size={15} /> Back to booking</Link>
        <div className="spacer" />
        <Link className="btn btn--primary btn--sm" href="/workspace/booking"><Icon name="plus" size={15} /> New booking</Link>
      </div>

      <StatCards stats={[
        { icon: 'calendar', tint: 'tint-blue', value: rows.length, label: 'Upcoming bookings' },
        { icon: 'check', tint: 'tint-green', value: rows.filter(isArrived).length, label: 'Checked-in' },
        { icon: 'seat', tint: 'tint-info', value: rows.filter((b) => !isArrived(b)).length, label: 'Awaiting arrival' },
        { icon: 'qr', tint: 'tint-orange', value: rows.length, label: 'QR passes' },
      ]} />

      {/* week timeline (Outlook-style) */}
      <h3 className="section-title">This week</h3>
      <div className="bk-week">
        {week.map((d) => {
          const dt = new Date(d); const isToday = d === today;
          return (
            <div className={'bk-week__col' + (isToday ? ' on' : '')} key={d}>
              <div className="bk-week__head">{dow[dt.getDay()]} <b>{dt.getDate()}</b></div>
              <div className="bk-week__track">
                {[12, 16].map((h) => <span key={h} className="bk-week__gl" style={{ top: `${((h - DAY_START) / (DAY_END - DAY_START)) * 100}%` }} />)}
                {byDay(d).map((b) => {
                  const s = Math.max(DAY_START, hourOf(b.startsAt)), e = Math.min(DAY_END, hourOf(b.endsAt));
                  const top = ((s - DAY_START) / (DAY_END - DAY_START)) * 100, h = Math.max(8, ((e - s) / (DAY_END - DAY_START)) * 100);
                  const arr = isArrived(b);
                  return (
                    <div key={b.id} className={'bk-week__bk' + (arr ? ' arrived' : '')} style={{ top: `${top}%`, height: `${h}%` }} title={`${where(b)} · ${fmtTime(b.startsAt)}–${fmtTime(b.endsAt)}`}>
                      <b>{where(b)}</b><span>{fmtTime(b.startsAt)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* list with actions */}
      <h3 className="section-title" style={{ marginTop: 18 }}>All bookings</h3>
      {rows.length === 0 ? (
        <EmptyState icon="calendar" title="No bookings yet" message="Book a desk from the booking map — it appears here with a QR check-in pass." />
      ) : (
        <div className="table-card">
          <table className="data-table">
            <thead><tr><th>Ref</th><th>Desk</th><th>When</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {rows.map((b) => {
                const arr = isArrived(b);
                return (
                  <tr key={b.id}>
                    <td className="mono">{b.code}</td>
                    <td>{where(b)}{b.meetingRoomId && <span className="muted" style={{ fontSize: 12 }}> · room</span>}</td>
                    <td>{fmtDate(b.startsAt)} · {fmtTime(b.startsAt)}–{fmtTime(b.endsAt)}</td>
                    <td>{arr ? <span className="ws-pill ws-info"><Icon name="check" size={12} /> Arrived</span> : <BookingStatusBadge status={b.status} />}</td>
                    <td><div className="row-actions">
                      {!arr && <button className="btn btn--ghost btn--sm" title="Confirm arrival (scan QR)" onClick={() => setArrived((p) => new Set(p).add(b.id))}><Icon name="qr" size={14} /> Check in</button>}
                      <button className="icon-btn" title="Change schedule" onClick={() => alert(`Mock: change schedule for ${b.code} (date / slot / desk).`)}><Icon name="calendar" size={15} /></button>
                      <button className="icon-btn icon-btn--danger" title="Cancel booking" onClick={() => setCancelled((p) => new Set(p).add(b.id))}><Icon name="trash" size={15} /></button>
                    </div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="sub-hint" style={{ marginTop: 14 }}><Icon name="qr" size={13} /> Each confirmed booking carries a rotating QR pass — scan at the desk to check in. Only you (or an admin) can change, cancel or check in your booking; no check-in within the grace window auto-releases the desk.</p>
    </>
  );
}
