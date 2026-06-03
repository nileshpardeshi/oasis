'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { billingLines, notificationLog, notificationSchedule, inr } from '@/lib/invoicing/mockData';
import { NotifBadge } from '@/components/invoicing/ui';

// Manual mode lists only Paid + Not Notified bills (the dedup rule).
const pending = billingLines.filter((l) => l.paymentStatus === 'Paid' && l.notificationStatus === 'Not Notified');

export default function NotificationsPage() {
  const [mode, setMode] = useState<'manual' | 'scheduled'>('manual');
  const [sel, setSel] = useState<Set<string>>(new Set(pending.map((p) => p.id)));
  const [sent, setSent] = useState(false);

  // schedule form
  const [sch, setSch] = useState(notificationSchedule);
  const [savedSchedule, setSavedSchedule] = useState(false);

  const toggle = (id: string) => {
    setSel((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  return (
    <>
      <div className="seg" style={{ marginBottom: 16 }}>
        <button className={mode === 'manual' ? 'active' : ''} onClick={() => setMode('manual')}>Manual send</button>
        <button className={mode === 'scheduled' ? 'active' : ''} onClick={() => setMode('scheduled')}>Scheduled</button>
      </div>

      {mode === 'manual' ? (
        <>
          <p className="sub-hint">Only <b>Paid</b> bills <b>not yet notified</b> are listed — a vendor is never emailed twice for the same bill.</p>
          {sent ? (
            <div className="reco ok">✓ Sent payment confirmation to {sel.size} vendor(s). Those bills are now marked <b>Notified</b> and won’t appear here again.</div>
          ) : pending.length === 0 ? (
            <div className="empty"><div className="empty__icon"><Icon name="check" size={36} /></div><h2>All caught up</h2><p>No paid bills are awaiting notification.</p></div>
          ) : (
            <>
              <div className="table-card" style={{ marginBottom: 14 }}>
                <table className="data-table">
                  <thead><tr><th style={{ width: 36 }}></th><th>Vendor</th><th>Bill no</th><th className="num">Net paid</th><th>UTR</th><th>Paid on</th></tr></thead>
                  <tbody>
                    {pending.map((l) => (
                      <tr key={l.id} className="row-link" onClick={() => toggle(l.id)}>
                        <td><input type="checkbox" checked={sel.has(l.id)} onChange={() => toggle(l.id)} /></td>
                        <td>{l.vendorName}</td>
                        <td className="mono">{l.billNo}</td>
                        <td className="num">{inr(l.paidAmount ?? l.totalAmount)}</td>
                        <td className="mono">{l.utr}</td>
                        <td>{l.paymentDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn--ghost btn--sm" onClick={() => alert('Mock preview:\n\nDear vendor, your payment has been processed.\nBill: <bill no>, Net: <amount>, UTR: <utr>, Date: <date>, Mode: NEFT.')}>Preview message</button>
                <button className="btn btn--primary btn--sm" disabled={sel.size === 0} onClick={() => setSent(true)}><Icon name="bell" size={15} /> Send to {sel.size} vendor(s)</button>
              </div>
            </>
          )}
        </>
      ) : (
        <>
          <p className="sub-hint">A scheduler scans <b>Paid, not-yet-notified</b> bills and emails each vendor automatically — same dedup rule applies.</p>
          <div className="card" style={{ padding: 18, maxWidth: 640 }}>
            <div className="form-grid">
              <div className="form-field">
                <label>Enabled</label>
                <select className="select" value={sch.enabled ? 'yes' : 'no'} onChange={(e) => { setSch({ ...sch, enabled: e.target.value === 'yes' }); setSavedSchedule(false); }}>
                  <option value="yes">On</option><option value="no">Off</option>
                </select>
              </div>
              <div className="form-field">
                <label>Frequency</label>
                <select className="select" value={sch.frequency} onChange={(e) => { setSch({ ...sch, frequency: e.target.value as typeof sch.frequency }); setSavedSchedule(false); }}>
                  <option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option>
                </select>
              </div>
              <div className="form-field">
                <label>Time</label>
                <input className="input" type="time" value={sch.time} onChange={(e) => { setSch({ ...sch, time: e.target.value }); setSavedSchedule(false); }} />
              </div>
              <div className="form-field">
                <label>Timezone</label>
                <select className="select" value={sch.timezone} onChange={(e) => { setSch({ ...sch, timezone: e.target.value }); setSavedSchedule(false); }}>
                  <option>Asia/Kolkata</option><option>America/New_York</option><option>UTC</option>
                </select>
              </div>
              {sch.frequency === 'weekly' && (
                <div className="form-field">
                  <label>Day of week</label>
                  <select className="select" value={sch.dayOfWeek} onChange={(e) => { setSch({ ...sch, dayOfWeek: e.target.value }); setSavedSchedule(false); }}>
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
              )}
              {sch.frequency === 'monthly' && (
                <div className="form-field">
                  <label>Day of month</label>
                  <input className="input" type="number" min={1} max={28} value={sch.dayOfMonth ?? 1} onChange={(e) => { setSch({ ...sch, dayOfMonth: +e.target.value }); setSavedSchedule(false); }} />
                </div>
              )}
            </div>
            <div style={{ marginTop: 16 }}>
              <button className="btn btn--primary btn--sm" onClick={() => setSavedSchedule(true)}>Save schedule</button>
              {savedSchedule && <span className="reco ok" style={{ display: 'inline-block', marginLeft: 12 }}>✓ Saved — {sch.enabled ? `runs ${sch.frequency} at ${sch.time} (${sch.timezone})` : 'disabled'}.</span>}
            </div>
          </div>
        </>
      )}

      {/* Notification log */}
      <h3 className="section-title" style={{ marginTop: 26 }}>Notification log</h3>
      <div className="table-card">
        <table className="data-table">
          <thead><tr><th>Vendor</th><th>Bill ref(s)</th><th>Channel</th><th>Trigger</th><th>Status</th><th>Sent at</th><th></th></tr></thead>
          <tbody>
            {notificationLog.map((n) => (
              <tr key={n.id}>
                <td>{n.vendorName}</td>
                <td className="mono">{n.billRefs.join(', ')}</td>
                <td>{n.channel}</td>
                <td style={{ textTransform: 'capitalize' }}>{n.trigger}</td>
                <td><NotifBadge status={n.status} /></td>
                <td>{n.sentAt}</td>
                <td className="num">{n.status === 'Failed' && <button className="btn btn--ghost btn--sm" onClick={() => alert('Mock: retried')}>Retry</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
