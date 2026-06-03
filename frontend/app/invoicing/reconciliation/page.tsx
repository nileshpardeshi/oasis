'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { billingBatches, reconLines, inr } from '@/lib/invoicing/mockData';

export default function ReconciliationPage() {
  const [batchId, setBatchId] = useState('b3');
  const [ran, setRan] = useState(false);
  const [tab, setTab] = useState<'matched' | 'exception'>('matched');
  const [approved, setApproved] = useState(false);

  const matched = reconLines.filter((r) => r.match === 'matched');
  const exceptions = reconLines.filter((r) => r.match !== 'matched');
  const rows = tab === 'matched' ? matched : exceptions;
  const netMatched = matched.reduce((s, r) => s + r.net, 0);

  return (
    <>
      <div className="toolbar">
        <div className="field">
          <label>Reconcile against batch</label>
          <select className="select" value={batchId} onChange={(e) => { setBatchId(e.target.value); setRan(false); setApproved(false); }}>
            {billingBatches.map((b) => <option key={b.id} value={b.id}>{b.code} — {b.payingEntityCode} · {b.periodMonth}</option>)}
          </select>
        </div>
      </div>

      <div className="dropzone" role="button" tabIndex={0} onClick={() => setRan(true)}>
        <div className="dz-icon"><Icon name="check" size={26} strokeWidth={2} /></div>
        <div style={{ fontWeight: 600, color: 'var(--text)' }}>Upload finance payment report</div>
        <div style={{ fontSize: 12.5, marginTop: 4 }}>Excel, Word or email (.eml/.msg) — vendor-grouped with UTRs. Click to simulate.</div>
      </div>

      {ran && (
        <>
          <div className="totals-bar" style={{ marginTop: 16 }}>
            <div><b>{matched.length}</b><span>Matched</span></div>
            <div><b style={{ color: exceptions.length ? 'var(--danger)' : undefined }}>{exceptions.length}</b><span>Exceptions</span></div>
            <div><b>{inr(netMatched)}</b><span>Net matched (ΣDr − ΣTDS)</span></div>
            <div><b>{inr(netMatched)}</b><span>Report total</span></div>
            <div><b style={{ color: 'var(--success)' }}>✓ Balanced</b><span>Net = report total</span></div>
          </div>

          <div className="seg" style={{ marginBottom: 14 }}>
            <button className={tab === 'matched' ? 'active' : ''} onClick={() => setTab('matched')}>Matched ({matched.length})</button>
            <button className={tab === 'exception' ? 'active' : ''} onClick={() => setTab('exception')}>Exceptions ({exceptions.length})</button>
          </div>

          <div className="table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Bill no (ref)</th><th>Vendor</th><th className="num">Gross</th><th className="num">TDS</th>
                  <th className="num">Net</th><th>UTR</th><th>Paid on</th><th>Mode</th><th>Result</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td className="mono">{r.billNo}</td>
                    <td>{r.vendorName}</td>
                    <td className="num">{inr(r.gross)}</td>
                    <td className="num">{r.tds ? inr(r.tds) : '—'}</td>
                    <td className="num">{inr(r.net)}</td>
                    <td className="mono">{r.utr}</td>
                    <td>{r.paymentDate}</td>
                    <td>{r.mode}</td>
                    <td>{r.match === 'matched'
                      ? <span className="pill st-paid">Matched</span>
                      : <span className="pill st-hold" title={r.note}>Exception</span>}</td>
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
                <div className="reco ok">✓ {matched.length} bills marked <b>Paid</b> (UTR, date, TDS captured). Recorded in audit trail.</div>
              ) : (
                <>
                  <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>Approving will set the {matched.length} matched bills to <b>Paid</b> and capture their UTR/date/TDS. Exceptions stay open.</p>
                  <button className="btn btn--success btn--sm" onClick={() => setApproved(true)}><Icon name="check" size={15} strokeWidth={2.2} /> Approve status update</button>
                </>
              )}
            </div>
            <div className="assist">
              <h4><Icon name="info" size={16} /> How matching works</h4>
              <p className="muted" style={{ fontSize: 12.5, margin: 0 }}>
                Each “Agst Ref” line is matched to a bill by reference number; <b>-TDS</b> credit lines fold into the net
                (Net = ΣDr − ΣTDS). The per-vendor net is validated against the report’s group total; any mismatch or
                unknown reference goes to the exception queue.
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}
