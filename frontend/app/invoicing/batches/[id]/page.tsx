'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { getBatch, linesForBatch, inr, categories } from '@/lib/invoicing/mockData';
import { BatchStatusBadge, ValidationBadge, RiskBadge, Money } from '@/components/invoicing/ui';
import type { BillingLine } from '@/lib/invoicing/types';

interface NewInvoiceData { vendor: string; billNo: string; category: string; basic: number; gst: number }

function AddInvoicePanel({ onAdd, onClose }: { onAdd: (d: NewInvoiceData) => void; onClose: () => void }) {
  const [vendor, setVendor] = useState('');
  const [billNo, setBillNo] = useState('');
  const [category, setCategory] = useState('');
  const [basic, setBasic] = useState(0);
  const [gst, setGst] = useState(0);
  return (
    <div className="card" style={{ padding: 18, marginBottom: 16 }}>
      <div className="panel__title" style={{ marginBottom: 4 }}>Add a missing invoice to this batch</div>
      <p className="sub-hint">Upload the invoice (PDF/Word/Excel) — AI extraction runs in the backend phase; for now enter the key fields.</p>
      <div className="dropzone" role="button" tabIndex={0} style={{ padding: 22, marginBottom: 14 }}>
        <div className="dz-icon"><Icon name="plus" size={22} strokeWidth={2} /></div>
        <div style={{ fontSize: 13 }}>Drag invoice here or click to browse</div>
      </div>
      <div className="form-grid">
        <div className="form-field"><label>Vendor</label><input className="input" value={vendor} onChange={(e) => setVendor(e.target.value)} /></div>
        <div className="form-field"><label>Bill no</label><input className="input" value={billNo} onChange={(e) => setBillNo(e.target.value)} /></div>
        <div className="form-field"><label>Category</label><select className="select" value={category} onChange={(e) => setCategory(e.target.value)}><option value="">— select —</option>{categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
        <div className="form-field"><label>Basic</label><input className="input" type="number" value={basic} onChange={(e) => setBasic(+e.target.value)} /></div>
        <div className="form-field"><label>GST</label><input className="input" type="number" value={gst} onChange={(e) => setGst(+e.target.value)} /></div>
        <div className="form-field"><label>Total</label><input className="input" type="number" value={basic + gst} readOnly /></div>
      </div>
      <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
        <button className="btn btn--primary btn--sm" disabled={!vendor || !billNo} onClick={() => onAdd({ vendor, billNo, category, basic, gst })}>Add to batch</button>
        <button className="btn btn--ghost btn--sm" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

function Assistant({ line }: { line: BillingLine }) {
  const avg = Math.max(1, Math.round(line.totalAmount / 1.25));
  const pct = Math.round((line.totalAmount / avg - 1) * 100);
  const review = line.riskLevel !== 'Low' || line.validationStatus === 'Fail';
  return (
    <div className="assist">
      <h4><Icon name="assistant" size={16} /> Smart Approval Assistant</h4>
      <div className="metric"><span>Vendor</span><span>{line.vendorName}</span></div>
      <div className="metric"><span>This bill</span><span>{inr(line.totalAmount)}</span></div>
      <div className="metric"><span>6-month average</span><span>{inr(avg)}</span></div>
      <div className="metric"><span>Variance</span><span style={{ color: pct > 25 ? 'var(--danger)' : 'var(--text)' }}>{pct > 0 ? '+' : ''}{pct}%</span></div>
      <div className="metric"><span>Risk</span><RiskBadge level={line.riskLevel} /></div>
      <div className="metric" style={{ borderBottom: 0 }}><span>Validation</span><ValidationBadge status={line.validationStatus} /></div>
      {line.validationNotes?.length ? (
        <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 12, color: 'var(--text-muted)' }}>
          {line.validationNotes.map((n, i) => <li key={i}>{n}</li>)}
        </ul>
      ) : null}
      <div className={'reco ' + (review ? 'review' : 'ok')}>
        {review
          ? '⚠ Review manually — risk/variance or a failed check needs a human decision.'
          : '✓ Looks normal — consistent with vendor history. OK to approve.'}
      </div>
    </div>
  );
}

export default function BatchDetailPage({ params }: { params: { id: string } }) {
  const batch = getBatch(params.id);
  const baseLines = linesForBatch(params.id);
  const [addedLines, setAddedLines] = useState<BillingLine[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const lines = [...baseLines, ...addedLines];
  const [selectedId, setSelectedId] = useState(baseLines[0]?.id);
  const [comment, setComment] = useState('');
  const [override, setOverride] = useState(false);
  const [action, setAction] = useState<null | 'Approved' | 'Rejected' | 'Needs Correction'>(null);

  if (!batch) {
    return <div className="empty"><div className="empty__icon"><Icon name="invoicing" size={36} /></div><h2>Batch not found</h2><p><Link className="panel__link" href="/invoicing/batches">Back to batches</Link></p></div>;
  }

  const handleAdd = (d: NewInvoiceData) => {
    const id = 'add-' + (addedLines.length + 1);
    setAddedLines((prev) => [...prev, {
      id, payingEntityCode: batch.payingEntityCode, vendorName: d.vendor || 'New vendor',
      billNo: d.billNo || ('TMP-' + id), billDate: '2026-06-04', description: 'Added to batch',
      categoryName: d.category || 'Miscellaneous/Other', costCenter: '—', department: '—',
      basicAmount: d.basic, gstAmount: d.gst, totalAmount: d.basic + d.gst, dueDate: '2026-07-04',
      paymentStatus: 'Not Paid', isRecurring: false, riskLevel: 'Low', validationStatus: 'Pass', notificationStatus: 'Not Notified',
    }]);
    setShowAdd(false);
  };

  const selected = lines.find((l) => l.id === selectedId) ?? lines[0];
  const basic = lines.reduce((s, l) => s + l.basicAmount, 0);
  const gst = lines.reduce((s, l) => s + l.gstAmount, 0);
  const total = lines.reduce((s, l) => s + l.totalAmount, 0);
  const fails = lines.filter((l) => l.validationStatus === 'Fail').length;
  const warns = lines.filter((l) => l.validationStatus === 'Warning').length;
  const canApprove = fails === 0 || override;

  return (
    <>
      <div className="toolbar">
        <Link className="panel__link" href="/invoicing/batches">← Batches</Link>
        <h3 className="section-title" style={{ margin: '0 0 0 6px' }}>{batch.code}</h3>
        <BatchStatusBadge status={batch.status} />
        <div className="spacer" />
        <button className="btn btn--primary btn--sm" onClick={() => setShowAdd((s) => !s)}><Icon name="plus" size={15} strokeWidth={2.2} /> Add invoice</button>
        <button className="btn btn--ghost btn--sm" onClick={() => alert('Mock: download Excel (.xlsx)')}><Icon name="invoicing" size={15} /> Excel</button>
        <button className="btn btn--ghost btn--sm" onClick={() => alert('Mock: download PDF')}><Icon name="invoicing" size={15} /> PDF</button>
      </div>

      {showAdd && <AddInvoicePanel onAdd={handleAdd} onClose={() => setShowAdd(false)} />}

      <div className="totals-bar">
        <div><b>{lines.length}</b><span>Invoices</span></div>
        <div><b>{inr(basic)}</b><span>Basic</span></div>
        <div><b>{inr(gst)}</b><span>GST</span></div>
        <div><b>{inr(total)}</b><span>Total</span></div>
        <div><b>{batch.payingEntityCode}</b><span>Entity</span></div>
        <div><b>{batch.periodMonth}</b><span>Period</span></div>
      </div>

      {/* Validation gate summary */}
      <div className="notice" style={{ background: fails ? 'var(--danger-tint)' : warns ? '#fef3cd' : 'var(--success-tint)', borderColor: 'transparent', color: 'var(--text)' }}>
        <Icon name={fails ? 'alert' : 'check'} size={18} />
        <span>
          <b>Validation gate:</b> {lines.length - fails - warns} pass · {warns} warning · {fails} fail.
          {fails ? ' A failed check blocks “send to finance” until resolved or overridden.' : ' Ready for approval.'}
        </span>
      </div>

      <div className="table-card" style={{ marginBottom: 16 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Vendor</th><th>Bill no</th><th>Bill date</th><th>Category</th><th>Dept / CC</th>
              <th className="num">Basic</th><th className="num">GST</th><th className="num">Total</th>
              <th>Due</th><th>Validation</th><th>Risk</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.id} className="row-link" onClick={() => setSelectedId(l.id)} style={{ background: l.id === selected?.id ? '#eef4fb' : undefined }}>
                <td>{l.vendorName}</td>
                <td className="mono">{l.billNo}</td>
                <td>{l.billDate}</td>
                <td>{l.categoryName}</td>
                <td>{l.department} · {l.costCenter}</td>
                <td className="num">{inr(l.basicAmount)}</td>
                <td className="num">{inr(l.gstAmount)}</td>
                <td className="num">{inr(l.totalAmount)}</td>
                <td>{l.dueDate}</td>
                <td><ValidationBadge status={l.validationStatus} /></td>
                <td><RiskBadge level={l.riskLevel} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="cards-2">
        {/* Approval */}
        <div className="card" style={{ padding: 18 }}>
          <div className="panel__title" style={{ marginBottom: 12 }}>Cross-check &amp; approve</div>
          {action ? (
            <div className={'reco ' + (action === 'Approved' ? 'ok' : 'review')}>
              Batch marked <b>{action}</b>{comment ? ` — “${comment}”` : ''}. (Recorded in audit trail.)
              {action === 'Approved' && <div style={{ marginTop: 8 }}><button className="btn btn--primary btn--sm" onClick={() => alert('Mock: shared with Finance')}>Send to Finance</button></div>}
            </div>
          ) : (
            <>
              <textarea className="input" style={{ width: '100%', height: 70, padding: 10 }} placeholder="Comment (required for reject / needs-correction)" value={comment} onChange={(e) => setComment(e.target.value)} />
              {fails > 0 && (
                <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12.5, margin: '10px 0', color: 'var(--danger)' }}>
                  <input type="checkbox" checked={override} onChange={(e) => setOverride(e.target.checked)} />
                  Override {fails} failed validation(s) with a logged reason
                </label>
              )}
              <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                <button className="btn btn--success btn--sm" disabled={!canApprove} onClick={() => setAction('Approved')}><Icon name="check" size={15} strokeWidth={2.2} /> Approve</button>
                <button className="btn btn--ghost btn--sm" disabled={!comment} onClick={() => setAction('Needs Correction')}>Needs correction</button>
                <button className="btn btn--danger btn--sm" disabled={!comment} onClick={() => setAction('Rejected')}>Reject</button>
              </div>
              {!canApprove && <div className="warn-inline"><Icon name="alert" size={15} /> Resolve or override failed validations to approve.</div>}
              <div className="sub-hint" style={{ marginTop: 12, marginBottom: 0 }}>Role-based maker–checker enforcement arrives with the RBAC module; actions are audit-logged.</div>
            </>
          )}
        </div>

        {/* Assistant */}
        {selected && <Assistant line={selected} />}
      </div>
    </>
  );
}
