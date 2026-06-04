'use client';

import { Fragment, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { billingLines, notificationLog, notificationSchedule, inr } from '@/lib/invoicing/mockData';
import { NotifBadge } from '@/components/invoicing/ui';
import type { BillingLine } from '@/lib/invoicing/types';

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtDate = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}-${MON[d.getMonth()]}-${String(d.getFullYear()).slice(2)}`;
};
const monthLabel = (iso?: string) => (iso ? `${MON[new Date(iso).getMonth()]} ${new Date(iso).getFullYear()}` : '—');

type Group = { vendor: string; bills: BillingLine[]; utr: string };

// Manual mode lists Paid + Not-Notified bills (dedup rule), GROUPED BY VENDOR — Finance pays each
// vendor as one combined payment (one UTR), so each vendor gets ONE consolidated email.
const pending = billingLines.filter((l) => l.paymentStatus === 'Paid' && l.notificationStatus === 'Not Notified');
const pendingGroups: Group[] = Object.values(
  pending.reduce((m, l) => {
    (m[l.vendorName] ??= { vendor: l.vendorName, bills: [] as BillingLine[], utr: l.utr ?? '—' }).bills.push(l);
    return m;
  }, {} as Record<string, Group>),
);

// A clean, finance-template-style payment advice (Dr gross / Cr -TDS lines, Basic+GST split, single UTR).
function EmailPreview({ group, onClose }: { group: Group; onClose: () => void }) {
  const { vendor, bills, utr } = group;
  const date = bills[0]?.paymentDate;
  const mode = bills[0]?.paymentMode ?? 'NEFT';
  const grossSum = bills.reduce((s, b) => s + b.totalAmount, 0);
  const tdsSum = bills.reduce((s, b) => s + (b.tdsAmount ?? 0), 0);
  const net = bills.reduce((s, b) => s + (b.paidAmount ?? b.totalAmount - (b.tdsAmount ?? 0)), 0);

  return (
    <div className="inv-modal-backdrop" onClick={onClose}>
      <div className="inv-modal" onClick={(e) => e.stopPropagation()} style={{ width: 'min(840px, 100%)' }}>
        <div className="inv-modal__head">
          <div className="panel__title"><Icon name="bell" size={16} /> Payment advice — {vendor}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn--ghost btn--sm" onClick={() => alert('Mock: download PDF / copy email HTML')}><Icon name="download" size={15} /> Download</button>
            <button className="btn btn--ghost btn--icon" title="Close" aria-label="Close" onClick={onClose}><Icon name="close" size={16} /></button>
          </div>
        </div>
        <div className="inv-modal__body" style={{ background: '#eef1f5' }}>
          <div className="email">
            <div className="email__head">
              <div><h3>Opus Technologies</h3><div className="tag">Accounts Payable</div></div>
              <div style={{ textAlign: 'right' }}><div className="tag">Payment Advice</div><div style={{ fontSize: 13.5, fontWeight: 700 }}>{monthLabel(date)}</div></div>
            </div>
            <div className="email__body">
              <p style={{ marginTop: 0 }}>Dear <b>{vendor}</b>,</p>
              <p style={{ marginTop: 6 }}>
                We confirm that the following <b>{bills.length} invoice(s)</b> have been processed for payment in <b>{monthLabel(date)}</b>.
                The combined amount has been remitted to your account as a <b>single payment</b> against the UTR below.
              </p>
              <div className="email__summary">
                <div><span>Payment date</span><b>{fmtDate(date)}</b></div>
                <div><span>UTR number</span><b className="mono">{utr}</b></div>
                <div><span>Payment mode</span><b>{mode}</b></div>
                <div><span>Net amount paid</span><b>{inr(net)}</b></div>
              </div>
              <div style={{ fontWeight: 700, margin: '4px 0 8px' }}>Payment Details</div>
              <div style={{ overflowX: 'auto' }}>
                <table className="email__table">
                  <thead>
                    <tr>
                      <th>Payment Date</th><th>Particulars</th><th>Invoice Ref No</th>
                      <th className="num">Amount</th><th>Dr/Cr</th><th className="num">Total Amount Paid</th><th>UTR No</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="email__vrow">
                      <td>{fmtDate(date)}</td>
                      <td colSpan={2}>{vendor}</td>
                      <td className="num" /><td />
                      <td className="num">{inr(net)}</td>
                      <td className="mono">{utr}</td>
                    </tr>
                    {bills.map((b) => (
                      <Fragment key={b.id}>
                        <tr>
                          <td />
                          <td>Agst Ref</td>
                          <td className="mono">{b.billNo}</td>
                          <td className="num">{inr(b.totalAmount)}</td>
                          <td>Dr</td>
                          <td className="num" />
                          <td />
                        </tr>
                        {(b.tdsAmount ?? 0) > 0 && (
                          <tr className="email__crrow">
                            <td />
                            <td>Agst Ref</td>
                            <td className="mono">{b.billNo}-TDS</td>
                            <td className="num">{inr(b.tdsAmount!)}</td>
                            <td>Cr</td>
                            <td className="num" />
                            <td />
                          </tr>
                        )}
                      </Fragment>
                    ))}
                    <tr className="email__total">
                      <td colSpan={3}>Gross total</td>
                      <td className="num">{inr(grossSum)}</td>
                      <td>Dr</td>
                      <td className="num" />
                      <td />
                    </tr>
                    {tdsSum > 0 && (
                      <tr className="email__crrow email__total">
                        <td colSpan={3}>Less: TDS deducted</td>
                        <td className="num">{inr(tdsSum)}</td>
                        <td>Cr</td>
                        <td className="num" />
                        <td />
                      </tr>
                    )}
                    <tr className="email__total email__net">
                      <td colSpan={5}>Net amount paid</td>
                      <td className="num">{inr(net)}</td>
                      <td className="mono">{utr}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p style={{ marginTop: 16 }}>If any detail does not match your records, please write to <span className="panel__link">accounts.payable@opustech.com</span> quoting the UTR above.</p>
              <p style={{ marginBottom: 0 }}>Regards,<br /><b>Accounts Payable</b><br />Opus Technologies</p>
            </div>
            <div className="email__foot">This is a system-generated payment advice from OASIS. Please do not reply to this email.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const [mode, setMode] = useState<'manual' | 'scheduled'>('manual');
  const [sel, setSel] = useState<Set<string>>(new Set(pendingGroups.map((g) => g.vendor)));
  const [sent, setSent] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  // schedule form
  const [sch, setSch] = useState(notificationSchedule);
  const [savedSchedule, setSavedSchedule] = useState(false);

  const toggle = (id: string) => {
    setSel((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const previewGroup = pendingGroups.find((g) => g.vendor === preview) ?? null;
  const firstSelected = pendingGroups.find((g) => sel.has(g.vendor))?.vendor ?? null;

  return (
    <>
      {previewGroup && <EmailPreview group={previewGroup} onClose={() => setPreview(null)} />}

      <div className="seg" style={{ marginBottom: 16 }}>
        <button className={mode === 'manual' ? 'active' : ''} onClick={() => setMode('manual')}>Manual send</button>
        <button className={mode === 'scheduled' ? 'active' : ''} onClick={() => setMode('scheduled')}>Scheduled</button>
      </div>

      {mode === 'manual' ? (
        <>
          <p className="sub-hint">Only <b>Paid</b> bills <b>not yet notified</b> are listed, <b>grouped per vendor</b>. Each vendor receives <b>one consolidated payment-advice email</b> covering all invoices paid that month — with each invoice's <b>Amount</b>, the finance <b>Dr/Cr</b> breakdown, the <b>Total Amount Paid</b> (net), and the single <b>UTR</b>. A vendor is never emailed twice for the same bill.</p>
          {sent ? (
            <div className="reco ok">✓ Sent <b>one consolidated payment-advice email</b> to {sel.size} vendor(s). Each lists every invoice paid that month (Amount + Dr/Cr), the Total Amount Paid (net), and the single UTR. Those bills are now marked <b>Notified</b>.</div>
          ) : pendingGroups.length === 0 ? (
            <div className="empty"><div className="empty__icon"><Icon name="check" size={36} /></div><h2>All caught up</h2><p>No paid bills are awaiting notification.</p></div>
          ) : (
            <>
              <div className="table-card" style={{ marginBottom: 14 }}>
                <table className="data-table">
                  <thead><tr><th style={{ width: 36 }}></th><th>Vendor</th><th>Invoices (combined)</th><th className="num">Net paid (total)</th><th>UTR (single)</th><th>Paid on</th><th>Email</th></tr></thead>
                  <tbody>
                    {pendingGroups.map((g) => {
                      const total = g.bills.reduce((s, b) => s + (b.paidAmount ?? b.totalAmount), 0);
                      return (
                        <tr key={g.vendor} className="row-link" onClick={() => toggle(g.vendor)}>
                          <td onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={sel.has(g.vendor)} onChange={() => toggle(g.vendor)} /></td>
                          <td>{g.vendor}</td>
                          <td>{g.bills.length} — <span className="mono" style={{ fontSize: 11.5 }}>{g.bills.map((b) => b.billNo).join(', ')}</span></td>
                          <td className="num">{inr(total)}</td>
                          <td className="mono">{g.utr}</td>
                          <td>{fmtDate(g.bills[0].paymentDate)}</td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <button className="btn btn--ghost btn--icon" title="Preview email" aria-label="Preview email" onClick={() => setPreview(g.vendor)}><Icon name="eye" size={16} /></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn--ghost btn--sm" disabled={!firstSelected} onClick={() => setPreview(firstSelected)}><Icon name="eye" size={15} /> Preview email</button>
                <button className="btn btn--primary btn--sm" disabled={sel.size === 0} onClick={() => setSent(true)}><Icon name="bell" size={15} /> Send {sel.size} vendor email(s)</button>
              </div>
            </>
          )}
        </>
      ) : (
        <>
          <p className="sub-hint">A scheduler scans <b>Paid, not-yet-notified</b> bills and emails each vendor automatically — same consolidated payment-advice format and dedup rule apply.</p>
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
