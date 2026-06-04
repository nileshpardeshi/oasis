'use client';

import { Fragment, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { reconLines, billingLines, inr, masterMonthOf } from '@/lib/invoicing/mockData';

// Resolve the billing month (invoice received month) for a reference — independent of which bill file it came in.
const masterOf = (billNo: string) => masterMonthOf(billingLines.find((l) => l.billNo === billNo)?.billReceivedDate);

const PAYMENT_MONTHS = ['May 2026', 'Jun 2026'];

export default function ReconciliationPage() {
  const [payMonth, setPayMonth] = useState('May 2026');
  const [ran, setRan] = useState(false);
  const [tab, setTab] = useState<'matched' | 'exception'>('matched');
  const [approved, setApproved] = useState(false);

  const matched = reconLines.filter((r) => r.match === 'matched');
  const exceptions = reconLines.filter((r) => r.match !== 'matched');
  const netMatched = matched.reduce((s, r) => s + r.net, 0);
  const mastersSpanned = Array.from(new Set(matched.map((r) => masterOf(r.billNo))));
  // Matched lines grouped by vendor — Finance pays each vendor as one combined payment (one UTR).
  const matchedGroups = Object.values(matched.reduce((m, r) => {
    (m[r.vendorName] ??= { vendor: r.vendorName, utr: r.utr, rows: [] as typeof matched }).rows.push(r);
    return m;
  }, {} as Record<string, { vendor: string; utr: string; rows: typeof matched }>));

  return (
    <>
      <div className="assist" style={{ borderLeftColor: 'var(--accent)', marginBottom: 16 }}>
        <h4><Icon name="info" size={16} /> Reconciliation is master-level, not batch-level</h4>
        <p className="muted" style={{ fontSize: 12.5, margin: 0 }}>
          Finance pays once or twice a month and issues <b>one monthly payment report</b>. A single report can clear invoices
          received across different months (e.g. an April-received bill paid in the May run alongside May-received bills).
          Each reference is matched to the open invoice <b>wherever it lives — across master files</b> — by bill number, vendor and amount, so cross-month timing resolves automatically.
        </p>
      </div>

      <div className="toolbar">
        <div className="field">
          <label>Payment report month</label>
          <select className="select" value={payMonth} onChange={(e) => { setPayMonth(e.target.value); setRan(false); setApproved(false); }}>
            {PAYMENT_MONTHS.map((m) => <option key={m} value={m}>{m} — payments executed</option>)}
          </select>
        </div>
        <div className="field" style={{ alignSelf: 'flex-end' }}>
          <span className="sub-hint" style={{ margin: 0 }}>Matched against <b>all open masters</b> — not a single bill file.</span>
        </div>
      </div>

      <div className="dropzone" role="button" tabIndex={0} onClick={() => setRan(true)}>
        <div className="dz-icon"><Icon name="check" size={26} strokeWidth={2} /></div>
        <div style={{ fontWeight: 600, color: 'var(--text)' }}>Upload {payMonth} finance payment report</div>
        <div style={{ fontSize: 12.5, marginTop: 4 }}>Excel, Word or email (.eml/.msg) — vendor-grouped with UTRs. Click to simulate.</div>
      </div>

      {ran && (
        <>
          <div className="totals-bar" style={{ marginTop: 16 }}>
            <div><b>{matched.length}</b><span>Matched</span></div>
            <div><b style={{ color: exceptions.length ? 'var(--danger)' : undefined }}>{exceptions.length}</b><span>Exceptions</span></div>
            <div><b>{mastersSpanned.length}</b><span>Billing months spanned</span></div>
            <div><b>{inr(netMatched)}</b><span>Net matched (ΣDr − ΣTDS)</span></div>
            <div><b style={{ color: 'var(--success)' }}>✓ Balanced</b><span>Net = report total</span></div>
          </div>

          {mastersSpanned.length > 1 && (
            <div className="warn-inline" style={{ background: '#eef4fb', color: 'var(--brand-blue)', marginBottom: 12 }}>
              <Icon name="info" size={15} /> This report clears invoices from <b>{mastersSpanned.join(' and ')}</b> — each is reconciled against its own master file.
            </div>
          )}

          <div className="seg" style={{ marginBottom: 14 }}>
            <button className={tab === 'matched' ? 'active' : ''} onClick={() => setTab('matched')}>Matched ({matched.length})</button>
            <button className={tab === 'exception' ? 'active' : ''} onClick={() => setTab('exception')}>Exceptions ({exceptions.length})</button>
          </div>

          <div className="table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Bill no (ref)</th><th>Vendor</th><th>Billing Month</th><th className="num">Gross</th><th className="num">TDS</th>
                  <th className="num">Net</th><th>UTR</th><th>Paid on</th><th>Mode</th><th>Result</th>
                </tr>
              </thead>
              <tbody>
                {tab === 'matched' ? matchedGroups.map((g) => {
                  const gGross = g.rows.reduce((s, r) => s + r.gross, 0);
                  const gTds = g.rows.reduce((s, r) => s + r.tds, 0);
                  const gNet = g.rows.reduce((s, r) => s + r.net, 0);
                  const gMasters = Array.from(new Set(g.rows.map((r) => masterOf(r.billNo))));
                  return (
                    <Fragment key={g.vendor}>
                      <tr className="group-row">
                        <td colSpan={3}><b>{g.vendor}</b> <span className="muted" style={{ fontSize: 12 }}>· {g.rows.length} bill(s) · {gMasters.join(', ')}</span></td>
                        <td className="num">{inr(gGross)}</td>
                        <td className="num">{gTds ? inr(gTds) : '—'}</td>
                        <td className="num"><b>{inr(gNet)}</b></td>
                        <td className="mono">{g.utr}</td>
                        <td colSpan={3}><span className="muted" style={{ fontSize: 11.5 }}>1 combined payment · 1 UTR</span></td>
                      </tr>
                      {g.rows.map((r, i) => (
                        <tr key={i}>
                          <td className="mono" style={{ paddingLeft: 22 }}>{r.billNo}</td>
                          <td>{r.vendorName}</td>
                          <td>{masterOf(r.billNo)}</td>
                          <td className="num">{inr(r.gross)}</td>
                          <td className="num">{r.tds ? inr(r.tds) : '—'}</td>
                          <td className="num">{inr(r.net)}</td>
                          <td className="mono">{r.utr}</td>
                          <td>{r.paymentDate}</td>
                          <td>{r.mode}</td>
                          <td><span className="pill st-paid">Matched</span></td>
                        </tr>
                      ))}
                    </Fragment>
                  );
                }) : exceptions.map((r, i) => (
                  <tr key={i}>
                    <td className="mono">{r.billNo}</td>
                    <td>{r.vendorName}</td>
                    <td>{masterOf(r.billNo)}</td>
                    <td className="num">{inr(r.gross)}</td>
                    <td className="num">{r.tds ? inr(r.tds) : '—'}</td>
                    <td className="num">{inr(r.net)}</td>
                    <td className="mono">{r.utr}</td>
                    <td>{r.paymentDate}</td>
                    <td>{r.mode}</td>
                    <td><span className="pill st-hold" title={r.note}>Exception</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {tab === 'exception' && exceptions.length > 0 && (
            <div className="warn-inline" style={{ marginTop: 10 }}>
              <Icon name="alert" size={15} /> {exceptions[0].note}. Resolve manually — never auto-marked Paid.
            </div>
          )}

          <div className="cards-2" style={{ marginTop: 18 }}>
            <div className="card" style={{ padding: 18 }}>
              <div className="panel__title" style={{ marginBottom: 10 }}>Review &amp; approve status update</div>
              {approved ? (
                <div className="reco ok">✓ {matched.length} bills marked <b>Paid</b> (UTR, date, TDS captured) across {mastersSpanned.join(' & ')}. Recorded in audit trail; each master file updated in place.</div>
              ) : (
                <>
                  <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>Approving will set the {matched.length} matched bills to <b>Paid</b> and capture their UTR/date/TDS — updating whichever master file each invoice belongs to. Exceptions stay open.</p>
                  <button className="btn btn--success btn--sm" onClick={() => setApproved(true)}><Icon name="check" size={15} strokeWidth={2.2} /> Approve status update</button>
                </>
              )}
            </div>
            <div className="assist">
              <h4><Icon name="info" size={16} /> How matching works</h4>
              <p className="muted" style={{ fontSize: 12.5, margin: 0 }}>
                Each “Agst Ref” line is matched to an open invoice by reference number — searched across <b>every master file</b>, not just one
                month. <b>-TDS</b> credit lines fold into the net (Net = ΣDr − ΣTDS). The per-vendor net is validated against the report’s
                group total; any mismatch or unknown reference goes to the exception queue and is never auto-paid.
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}
