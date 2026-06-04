'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { StatCards, BookingStatusBadge, EmptyState } from '@/components/workspace/ui';
import { bookings, getMyBookings, getDesk, getRoom, currentUser, fmtDate, fmtTime } from '@/lib/workspace/mockData';
import type { Booking } from '@/lib/workspace/types';

export default function MyBookingsPage() {
  const mine = getMyBookings(currentUser.employeeId);
  const seed: Booking[] = mine.length ? mine : bookings.slice(0, 6);
  const [cancelled, setCancelled] = useState<Set<string>>(new Set());
  const rows = seed.filter((b) => !cancelled.has(b.id));
  const where = (b: Booking) => (b.deskId ? getDesk(b.deskId)?.deskNo : b.meetingRoomId ? getRoom(b.meetingRoomId)?.name : '—') ?? '—';

  return (
    <>
      <div className="ws-toolbar">
        <Link className="btn btn--ghost btn--sm" href="/workspace/booking"><Icon name="arrowLeft" size={15} /> Back to booking</Link>
        <div className="spacer" />
        <Link className="btn btn--primary btn--sm" href="/workspace/booking"><Icon name="plus" size={15} /> New booking</Link>
      </div>

      <StatCards stats={[
        { icon: 'calendar', tint: 'tint-blue', value: rows.length, label: 'Upcoming bookings' },
        { icon: 'check', tint: 'tint-green', value: rows.filter((b) => b.status === 'booked' || b.status === 'checked_in').length, label: 'Confirmed' },
        { icon: 'clock', tint: 'tint-orange', value: rows.filter((b) => b.status === 'held').length, label: 'On hold' },
        { icon: 'qr', tint: 'tint-info', value: rows.filter((b) => b.qrToken).length, label: 'With QR pass' },
      ]} />

      {rows.length === 0 ? (
        <EmptyState icon="calendar" title="No bookings yet" message="Book a desk from the booking map — it appears here with a QR check-in pass." />
      ) : (
        <div className="table-card">
          <table className="data-table">
            <thead><tr><th>Ref</th><th>Where</th><th>Type</th><th>When</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id}>
                  <td className="mono">{b.code}</td>
                  <td>{where(b)}{b.meetingRoomId && <span className="muted" style={{ fontSize: 12 }}> · room</span>}</td>
                  <td>{b.kind.replace('_', ' ')}</td>
                  <td>{fmtDate(b.startsAt)} · {fmtTime(b.startsAt)}–{fmtTime(b.endsAt)}</td>
                  <td><BookingStatusBadge status={b.status} /></td>
                  <td><div className="row-actions">
                    <button className="icon-btn" title="QR pass" onClick={() => alert(`Mock: QR check-in pass for ${b.code}`)}><Icon name="qr" size={15} /></button>
                    <button className="icon-btn icon-btn--danger" title="Cancel" onClick={() => setCancelled((p) => new Set(p).add(b.id))}><Icon name="trash" size={15} /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="sub-hint" style={{ marginTop: 14 }}><Icon name="qr" size={13} /> Each confirmed booking carries a rotating QR pass; scan at the desk to check in. No check-in within the grace window auto-releases the desk.</p>
    </>
  );
}
