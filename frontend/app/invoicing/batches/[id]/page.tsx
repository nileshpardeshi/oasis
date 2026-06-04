'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { getBatch, linesForBatch, inr, categories, payingEntities, paymentPriority, daysBetween, addDays } from '@/lib/invoicing/mockData';
import { BatchStatusBadge, ValidationBadge, RiskBadge } from '@/components/invoicing/ui';
import type { BillingLine, BatchStatus } from '@/lib/invoicing/types';

type AdminState = 'Pending' | 'Approved' | 'Rejected';
type FinanceState = 'Pending' | 'Approved for Payment' | 'Sent Back';
interface LineFormData { entity: string; vendor: string; billNo: string; category: string; basic: number; gst: number }

const ADMIN_CLASS: Record<AdminState, string> = { Pending: 'st-unpaid', Approved: 'st-paid', Rejected: 'st-hold' };
const FIN_CLASS: Record<FinanceState, string> = { 'Pending': 'st-unpaid', 'Approved for Payment': 'st-paid', 'Sent Back': 'st-hold' };
const FIN_LABEL: Record<FinanceState, string> = { 'Pending': 'Pending', 'Approved for Payment': 'For Payment', 'Sent Back': 'Sent Back' };
const TODAY = '2026-06-04';

function PriorityPill({ due }: { due?: string }) {
  const p = paymentPriority(due);
  return <span className={`pill ${p === 'I' ? 'st-process' : 'st-sentfin'}`}>Cycle {p}</span>;
}

function InvoicePreviewModal({ line, onClose }: { line: BillingLine; onClose: () => void }) {
  const fileName = line.fileName ?? `${line.billNo}.pdf`;
  return (
    <div className="inv-modal-backdrop" onClick={onClose}>
      <div className="inv-modal" onClick={(e) => e.stopPropagation()}>
        <div className="inv-modal__head">
          <div className="panel__title"><Icon name="invoicing" size={16} /> {fileName}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn--primary btn--sm" onClick={() => alert('Mock: downloading ' + fileName)}><Icon name="download" size={15} /> Download</button>
            <button className="btn btn--ghost btn--icon" title="Close" aria-label="Close" onClick={onClose}><Icon name="close" size={16} /></button>
          </div>
        </div>
        <div className="inv-modal__body">
          <div className="pdf-stub" style={{ minHeight: 440, borderRadius: 0 }}>
            <div style={{ textAlign: 'center' }}>
              <Icon name="invoicing" size={46} />
              <div style={{ marginTop: 10, fontSize: 13.5, fontWeight: 600 }}>{fileName}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{line.vendorName} · {line.billNo} · {line.payingEntityCode}</div>
              <div style={{ fontSize: 11, marginTop: 6 }}>Original invoice preview renders here once the file is stored (backend phase).</div>
            </div>
          </div>
        </div>
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
      <div className="metric"><span>Due / cycle</span><span>{line.dueDate} · <PriorityPill due={line.dueDate} /></span></div>
      <div className="metric" style={{ borderBottom: 0 }}><span>Validation</span><ValidationBadge status={line.validationStatus} /></div>
      {line.validationNotes?.length ? (
        <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 12, color: 'var(--text-muted)' }}>
          {line.validationNotes.map((n, i) => <li key={i}>{n}</li>)}
        </ul>
      ) : null}
      <div className={'reco ' + (review ? 'review' : 'ok')}>
        {review ? '⚠ Review manually — risk/variance or a failed check needs a human decision.' : '✓ Looks normal — consistent with vendor history.'}
      </div>
    </div>
  );
}

function LineForm({ initial, onSubmit, onClose }: { initial: BillingLine | null; onSubmit: (d: LineFormData) => void; onClose: () => void }) {
  const editing = !!initial;
  const [entity, setEntity] = useState(initial?.payingEntityCode ?? payingEntities[0].code);
  const [vendor, setVendor] = useState(initial?.vendorName ?? '');
  const [billNo, setBillNo] = useState(initial?.billNo ?? '');
  const [category, setCategory] = useState(initial?.categoryName ?? '');
  const [basic, setBasic] = useState(initial?.basicAmount ?? 0);
  const [gst, setGst] = useState(initial?.gstAmount ?? 0);
  return (
    <div className="card" style={{ padding: 18, marginBottom: 16 }}>
      <div className="panel__title" style={{ marginBottom: 4 }}>{editing ? `Edit invoice — ${initial!.billNo}` : 'Add a missing invoice to this batch'}</div>
      <p className="sub-hint">{editing ? 'Update the fields and/or reupload the invoice file.' : 'Upload the invoice (PDF/Word/Excel) — for the prototype, enter the key fields.'}</p>
      <div className="dropzone" role="button" tabIndex={0} style={{ padding: 22, marginBottom: 14 }}>
        <div className="dz-icon"><Icon name="plus" size={22} strokeWidth={2} /></div>
        <div style={{ fontSize: 13 }}>{editing ? 'Reupload invoice (optional) — drag here or click to browse' : 'Drag invoice here or click to browse'}</div>
      </div>
      <div className="form-grid">
        <div className="form-field"><label>Paying entity</label><select className="select" value={entity} onChange={(e) => setEntity(e.target.value)}>{payingEntities.map((p) => <option key={p.id} value={p.code}>{p.code}</option>)}</select></div>
        <div className="form-field"><label>Vendor</label><input className="input" value={vendor} onChange={(e) => setVendor(e.target.value)} /></div>
        <div className="form-field"><label>Bill no</label><input className="input" value={billNo} onChange={(e) => setBillNo(e.target.value)} /></div>
        <div className="form-field"><label>Category</label><select className="select" value={category} onChange={(e) => setCategory(e.target.value)}><option value="">— select —</option>{categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
        <div className="form-field"><label>Basic</label><input className="input" type="number" value={basic} onChange={(e) => setBasic(+e.target.value)} /></div>
        <div className="form-field"><label>GST</label><input className="input" type="number" value={gst} onChange={(e) => setGst(+e.target.value)} /></div>
      </div>
      <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
        <button className="btn btn--primary btn--sm" disabled={!vendor || !billNo} onClick={() => onSubmit({ entity, vendor, billNo, category, basic, gst })}>{editing ? 'Save changes' : 'Add to batch'}</button>
        <button className="btn btn--ghost btn--sm" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

export default function BatchDetailPage({ params }: { params: { id: string } }) {
  const batch = getBatch(params.id);
  const seed = linesForBatch(params.id);
  const [batchStatus, setBatchStatus] = useState<BatchStatus>(batch?.status ?? 'Draft');
  const [lines, setLines] = useState<BillingLine[]>(seed);
  const [role, setRole] = useState<'admin' | 'finance'>('admin');
  const [showAdd, setShowAdd] = useState(false);
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [previewLineId, setPreviewLineId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [focusId, setFocusId] = useState<string | undefined>(undefined);
  const [adminStatus, setAdminStatus] = useState<Record<string, AdminState>>(() => Object.fromEntries(seed.map((l) => [l.id, 'Pending'])));
  const [financeStatus, setFinanceStatus] = useState<Record<string, FinanceState>>(() => Object.fromEntries(seed.map((l) => [l.id, 'Pending'])));
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [comment, setComment] = useState('');
  const [override, setOverride] = useState(false);
  const [action, setAction] = useState<null | 'Approved' | 'Rejected' | 'Needs Correction'>(null);
  const [sentInfo, setSentInfo] = useState<string | null>(null);
  const [financeComment, setFinanceComment] = useState('');
  const [financeMsg, setFinanceMsg] = useState<string | null>(null);

  if (!batch) {
    return <div className="empty"><div className="empty__icon"><Icon name="invoicing" size={36} /></div><h2>Batch not found</h2><p><Link className="btn btn--back btn--sm" href="/invoicing/batches"><Icon name="arrowLeft" size={15} strokeWidth={2.2} /> Back to Billing Batches</Link></p></div>;
  }

  const focus = lines.find((l) => l.id === focusId) ?? lines[0];
  const basic = lines.reduce((s, l) => s + l.basicAmount, 0);
  const gst = lines.reduce((s, l) => s + l.gstAmount, 0);
  const total = lines.reduce((s, l) => s + l.totalAmount, 0);
  const fails = lines.filter((l) => l.validationStatus === 'Fail').length;
  const warns = lines.filter((l) => l.validationStatus === 'Warning').length;
  const canApprove = fails === 0 || override;
  const entities = Array.from(new Set(lines.map((l) => l.payingEntityCode)));
  const adminApproved = lines.filter((l) => (adminStatus[l.id] ?? 'Pending') === 'Approved').length;
  const finApproved = lines.filter((l) => (financeStatus[l.id] ?? 'Pending') === 'Approved for Payment').length;

  const handleAdd = (d: LineFormData) => {
    const id = 'add-' + (lines.length + 1) + '-' + Math.max(0, ...lines.map((l) => Number(l.id.replace(/\D/g, '')) || 0));
    const line: BillingLine = {
      id, fileName: (d.billNo || 'invoice') + '.pdf', fileType: 'PDF', payingEntityCode: d.entity, vendorName: d.vendor,
      billNo: d.billNo || ('TMP-' + id), billDate: TODAY, billReceivedDate: TODAY, creditPeriodDays: 30, dueDate: addDays(TODAY, 30),
      description: 'Added to batch', categoryName: d.category || 'Miscellaneous/Other', costCenter: '—', department: '—',
      basicAmount: d.basic, gstAmount: d.gst, totalAmount: d.basic + d.gst,
      paymentStatus: 'Not Paid', isRecurring: false, riskLevel: 'Low', validationStatus: 'Pass', notificationStatus: 'Not Notified',
    };
    setLines((p) => [...p, line]);
    setAdminStatus((s) => ({ ...s, [id]: 'Pending' }));
    setFinanceStatus((s) => ({ ...s, [id]: 'Pending' }));
    setShowAdd(false);
  };
  const updateLine = (id: string, d: LineFormData) => {
    setLines((p) => p.map((l) => (l.id === id ? { ...l, payingEntityCode: d.entity, vendorName: d.vendor, billNo: d.billNo, categoryName: d.category || l.categoryName, basicAmount: d.basic, gstAmount: d.gst, totalAmount: d.basic + d.gst } : l)));
    setEditingLineId(null);
  };
  const deleteLine = (id: string) => {
    if (typeof window !== 'undefined' && window.confirm('Remove this invoice from the batch?')) {
      setLines((p) => p.filter((l) => l.id !== id));
      setSelected((s) => { const n = new Set(s); n.delete(id); return n; });
    }
  };

  const toggleSel = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allSelected = lines.length > 0 && selected.size === lines.length;
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(lines.map((l) => l.id)));
  const bulkAdmin = (st: AdminState) => { setAdminStatus((s) => { const n = { ...s }; selected.forEach((id) => { n[id] = st; }); return n; }); setSelected(new Set()); };
  const bulkFinance = (st: FinanceState) => { setFinanceStatus((s) => { const n = { ...s }; selected.forEach((id) => { n[id] = st; }); return n; }); setSelected(new Set()); };

  const sendToFinance = () => {
    setLines((p) => p.map((l) => ({ ...l, sentToFinanceOn: l.sentToFinanceOn ?? TODAY })));
    setBatchStatus('Sent to Finance');
    setSentInfo(`📧 Email sent to finance@opustech.example — subject “Billing batch ${batch.code} for review” — ${lines.length} invoices, total ${inr(total)}. Batch status → Sent to Finance. Finance can now review it here (switch the role to Finance).`);
  };
  const financeApproveBatch = () => {
    setFinanceStatus((s) => { const n = { ...s }; lines.forEach((l) => { n[l.id] = 'Approved for Payment'; }); return n; });
    setBatchStatus('Approved By Finance');
    setFinanceMsg(`✓ Finance approved batch ${batch.code} for payment (${lines.length} invoices, ${inr(total)}). Status → Approved By Finance.`);
  };
  const financeSendBack = () => {
    setBatchStatus('Needs Correction');
    setFinanceMsg(`↩ Sent back to Admin for correction${financeComment ? `: “${financeComment}”` : ''}. Status → Needs Correction.`);
  };

  const editingLine = lines.find((l) => l.id === editingLineId) ?? null;
  const previewLine = lines.find((l) => l.id === previewLineId) ?? null;

  // Group invoices by vendor — Finance pays each vendor as one combined payment (one UTR). Tracking stays per invoice.
  const byVendor = lines.reduce((m, l) => { (m[l.vendorName] ??= []).push(l); return m; }, {} as Record<string, BillingLine[]>);
  const vendorNames = Object.keys(byVendor);
  const toggleVendor = (vn: string) => setCollapsed((s) => { const n = new Set(s); n.has(vn) ? n.delete(vn) : n.add(vn); return n; });
  const toggleVendorSel = (vn: string, select: boolean) => setSelected((s) => { const n = new Set(s); byVendor[vn].forEach((l) => { select ? n.add(l.id) : n.delete(l.id); }); return n; });

  return (
    <>
      {previewLine && <InvoicePreviewModal line={previewLine} onClose={() => setPreviewLineId(null)} />}

      <div className="page-back">
        <Link className="btn btn--back btn--sm" href="/invoicing/batches"><Icon name="arrowLeft" size={15} strokeWidth={2.2} /> Back to Billing Batches</Link>
      </div>

      <div className="toolbar">
        <h3 className="section-title" style={{ margin: 0 }}>{batch.code}</h3>
        <BatchStatusBadge status={batchStatus} />
        <div className="spacer" />
        <span className="muted" style={{ fontSize: 12 }}>View as (demo):</span>
        <div className="seg">
          <button className={role === 'admin' ? 'active' : ''} onClick={() => { setRole('admin'); setSelected(new Set()); }}>Admin</button>
          <button className={role === 'finance' ? 'active' : ''} onClick={() => { setRole('finance'); setSelected(new Set()); }}>Finance</button>
        </div>
        <button className="btn btn--primary btn--sm" onClick={() => { setShowAdd((s) => !s); setEditingLineId(null); }}><Icon name="plus" size={15} strokeWidth={2.2} /> Add invoice</button>
        <button className="btn btn--ghost btn--sm" onClick={() => alert('Mock: download Excel (.xlsx)')}><Icon name="download" size={15} /> Excel</button>
        <button className="btn btn--ghost btn--sm" onClick={() => alert('Mock: download PDF')}><Icon name="download" size={15} /> PDF</button>
      </div>

      {showAdd && <LineForm initial={null} onSubmit={handleAdd} onClose={() => setShowAdd(false)} />}
      {editingLine && <LineForm key={editingLine.id} initial={editingLine} onSubmit={(d) => updateLine(editingLine.id, d)} onClose={() => setEditingLineId(null)} />}

      <div className="totals-bar">
        <div><b>{lines.length}</b><span>Invoices</span></div>
        <div><b>{inr(basic)}</b><span>Basic</span></div>
        <div><b>{inr(gst)}</b><span>GST</span></div>
        <div><b>{inr(total)}</b><span>Total</span></div>
        <div><b>{entities.join(', ') || '—'}</b><span>Entities (per invoice)</span></div>
        <div><b>{batch.periodMonth}</b><span>Billing Month</span></div>
      </div>

      <div className="notice" style={{ background: fails ? 'var(--danger-tint)' : warns ? '#fef3cd' : 'var(--success-tint)', borderColor: 'transparent', color: 'var(--text)' }}>
        <Icon name={fails ? 'alert' : 'check'} size={18} />
        <span><b>Validation gate:</b> {lines.length - fails - warns} pass · {warns} warning · {fails} fail.{fails ? ' A failed check blocks “send to finance” until resolved or overridden.' : ' Ready for approval.'}</span>
      </div>

      {/* Bulk action bar (role-aware) */}
      <div className="totals-bar" style={{ alignItems: 'center' }}>
        {role === 'admin' ? (
          <>
            <div><b>{adminApproved}</b><span>Approved</span></div>
            <div><b>{lines.length - adminApproved}</b><span>Pending/other</span></div>
            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className="muted" style={{ fontSize: 12.5 }}>{selected.size} selected</span>
              <button className="btn btn--success btn--sm" disabled={!selected.size} onClick={() => bulkAdmin('Approved')}><Icon name="check" size={15} strokeWidth={2.2} /> Approve selected</button>
              <button className="btn btn--danger btn--sm" disabled={!selected.size} onClick={() => bulkAdmin('Rejected')}>Reject selected</button>
            </div>
          </>
        ) : (
          <>
            <div><b>{finApproved}</b><span>For payment</span></div>
            <div><b>{lines.length - finApproved}</b><span>Pending/other</span></div>
            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className="muted" style={{ fontSize: 12.5 }}>{selected.size} selected</span>
              <button className="btn btn--success btn--sm" disabled={!selected.size} onClick={() => bulkFinance('Approved for Payment')}><Icon name="check" size={15} strokeWidth={2.2} /> Approve for payment</button>
              <button className="btn btn--ghost btn--sm" disabled={!selected.size} onClick={() => bulkFinance('Sent Back')}>Send back selected</button>
            </div>
          </>
        )}
      </div>

      <div className="table-card" style={{ overflowX: 'auto', marginBottom: 12 }}>
        <table className="data-table" style={{ minWidth: 1180 }}>
          <thead>
            <tr>
              <th style={{ width: 34 }}><input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="select all" /></th>
              <th>Vendor</th><th>Bill no</th><th>Entity</th><th>Received</th><th className="num">Credit</th><th>Due</th><th>Payment Cycle</th><th>Sent to Fin.</th>
              <th className="num">Total</th><th>Validation</th><th>Admin</th><th>Finance</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendorNames.map((vn) => {
              const vlines = byVendor[vn];
              const vTotal = vlines.reduce((s, l) => s + l.totalAmount, 0);
              const vCollapsed = collapsed.has(vn);
              const vAllSel = vlines.every((l) => selected.has(l.id));
              return (
                <Fragment key={vn}>
                  <tr className="group-row">
                    <td onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={vAllSel} onChange={() => toggleVendorSel(vn, !vAllSel)} aria-label={`select ${vn}`} /></td>
                    <td colSpan={8}>
                      <button className="acc-toggle" onClick={() => toggleVendor(vn)} aria-label="toggle">{vCollapsed ? '▸' : '▾'}</button>
                      <b>{vn}</b> <span className="muted" style={{ fontSize: 12 }}>· {vlines.length} invoice(s)</span>
                    </td>
                    <td className="num"><b>{inr(vTotal)}</b></td>
                    <td colSpan={4}><span className="muted" style={{ fontSize: 11.5 }}>Finance pays this vendor in <b>1 payment · 1 UTR</b></span></td>
                  </tr>
                  {!vCollapsed && vlines.map((l) => {
                    const as = adminStatus[l.id] ?? 'Pending';
                    const fs = financeStatus[l.id] ?? 'Pending';
                    const credit = l.creditPeriodDays ?? daysBetween(l.billDate, l.dueDate);
                    return (
                      <tr key={l.id} className={'row-link' + (l.id === focusId ? ' row-focus' : '')} onClick={() => setFocusId(l.id)}>
                        <td onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selected.has(l.id)} onChange={() => toggleSel(l.id)} /></td>
                        <td style={{ paddingLeft: 22 }}>{l.vendorName}{l.isRecurring && <span className="pill st-sentfin" style={{ marginLeft: 6, fontSize: 10 }}>Recurring</span>}</td>
                        <td className="mono">{l.billNo}<div className="attach"><Icon name="invoicing" size={12} /> {l.fileName ?? l.billNo + '.pdf'}</div></td>
                        <td>{l.payingEntityCode}</td>
                        <td>{l.billReceivedDate ?? l.billDate}</td>
                        <td className="num">{credit ?? '—'}{credit != null ? 'd' : ''}</td>
                        <td>{l.dueDate}</td>
                        <td><PriorityPill due={l.dueDate} /></td>
                        <td>{l.sentToFinanceOn ?? '—'}</td>
                        <td className="num">{inr(l.totalAmount)}</td>
                        <td><ValidationBadge status={l.validationStatus} /></td>
                        <td><span className={`pill ${ADMIN_CLASS[as]}`}>{as}</span></td>
                        <td><span className={`pill ${FIN_CLASS[fs]}`}>{FIN_LABEL[fs]}</span></td>
                        <td onClick={(e) => e.stopPropagation()} style={{ whiteSpace: 'nowrap' }}>
                          <div className="row-actions">
                            <button className="btn btn--ghost btn--icon" title="View original invoice" aria-label="View original invoice" onClick={() => setPreviewLineId(l.id)}><Icon name="eye" size={16} /></button>
                            <button className="btn btn--ghost btn--icon" title="Edit / reupload" aria-label="Edit or reupload" onClick={() => { setEditingLineId(l.id); setShowAdd(false); }}><Icon name="edit" size={16} /></button>
                            <button className="btn btn--ghost btn--icon is-danger" title="Delete invoice" aria-label="Delete invoice" onClick={() => deleteLine(l.id)}><Icon name="trash" size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </Fragment>
              );
            })}
            {lines.length === 0 && <tr><td colSpan={14} style={{ textAlign: 'center', padding: 24, color: 'var(--text-soft)' }}>No invoices in this batch. Use “Add invoice”.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="sub-hint" style={{ marginTop: -4 }}>Tick rows to bulk-{role === 'admin' ? 'approve/reject' : 'approve-for-payment / send back'}. Row actions: <b>View</b> (eye) opens the original invoice, <b>Edit</b> (pencil) updates fields or reuploads, <b>Delete</b> (trash) removes the line. Cycle I = due by 7th, Cycle II = due by 22nd.</p>

      <div className="cards-2">
        {role === 'admin' ? (
          <div className="card" style={{ padding: 18 }}>
            <div className="panel__title" style={{ marginBottom: 12 }}>Final batch decision &amp; send to Finance</div>
            {sentInfo ? <div className="reco ok">{sentInfo}</div> : action ? (
              <div className={'reco ' + (action === 'Approved' ? 'ok' : 'review')}>
                Batch marked <b>{action}</b>{comment ? ` — “${comment}”` : ''}. (Audit-logged.)
                {action === 'Approved' && <div style={{ marginTop: 8 }}><button className="btn btn--primary btn--sm" onClick={sendToFinance}><Icon name="bell" size={15} /> Send to Finance (email)</button></div>}
              </div>
            ) : (
              <>
                <p className="muted" style={{ fontSize: 12.5, marginTop: 0 }}>{adminApproved}/{lines.length} invoices approved by admin.</p>
                <textarea className="input" style={{ width: '100%', height: 60, padding: 10 }} placeholder="Comment (required for reject / needs-correction)" value={comment} onChange={(e) => setComment(e.target.value)} />
                {fails > 0 && (
                  <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12.5, margin: '10px 0', color: 'var(--danger)' }}>
                    <input type="checkbox" checked={override} onChange={(e) => setOverride(e.target.checked)} /> Override {fails} failed validation(s) with a logged reason
                  </label>
                )}
                <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                  <button className="btn btn--success btn--sm" disabled={!canApprove} onClick={() => setAction('Approved')}><Icon name="check" size={15} strokeWidth={2.2} /> Approve batch</button>
                  <button className="btn btn--ghost btn--sm" disabled={!comment} onClick={() => setAction('Needs Correction')}>Needs correction</button>
                  <button className="btn btn--danger btn--sm" disabled={!comment} onClick={() => setAction('Rejected')}>Reject</button>
                </div>
                {!canApprove && <div className="warn-inline"><Icon name="alert" size={15} /> Resolve or override failed validations to approve.</div>}
              </>
            )}
          </div>
        ) : (
          <div className="card" style={{ padding: 18 }}>
            <div className="panel__title" style={{ marginBottom: 12 }}>Finance review &amp; approval</div>
            {financeMsg ? <div className={'reco ' + (financeMsg.startsWith('↩') ? 'review' : 'ok')}>{financeMsg}</div> : (
              <>
                <p className="muted" style={{ fontSize: 12.5, marginTop: 0 }}>{finApproved}/{lines.length} invoices approved for payment. Verify each invoice (incl. <b>Payment Cycle</b>) — you can also <b>Edit</b> to correct, or send the batch back.</p>
                <textarea className="input" style={{ width: '100%', height: 60, padding: 10 }} placeholder="Note (for send-back to Admin)" value={financeComment} onChange={(e) => setFinanceComment(e.target.value)} />
                <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                  <button className="btn btn--success btn--sm" onClick={financeApproveBatch}><Icon name="check" size={15} strokeWidth={2.2} /> Approve for Payment (batch)</button>
                  <button className="btn btn--ghost btn--sm" disabled={!financeComment} onClick={financeSendBack}>Send back for correction</button>
                </div>
                <div className="sub-hint" style={{ marginTop: 12, marginBottom: 0 }}>Finance access is a demo role toggle here; real role-based access arrives with the RBAC module. Actions are audit-logged.</div>
              </>
            )}
          </div>
        )}

        {focus && <Assistant line={focus} />}
      </div>
    </>
  );
}
