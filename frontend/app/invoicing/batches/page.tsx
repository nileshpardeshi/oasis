'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { billingBatches } from '@/lib/invoicing/mockData';
import { BatchStatusBadge, Money } from '@/components/invoicing/ui';
import type { BillingBatch, BatchStatus } from '@/lib/invoicing/types';

const EDIT_STATUSES: BatchStatus[] = ['Draft', 'Generated', 'Validated', 'Pending Approval', 'Needs Correction', 'Rejected', 'Approved', 'Sent to Finance', 'Reconciliation Open', 'Closed'];

function EditBatchForm({ batch, onSave, onCancel }: { batch: BillingBatch; onSave: (b: BillingBatch) => void; onCancel: () => void }) {
  const [code, setCode] = useState(batch.code);
  const [period, setPeriod] = useState(batch.periodMonth);
  const [status, setStatus] = useState<BatchStatus>(batch.status);
  return (
    <div className="card" style={{ padding: 18, marginBottom: 16 }}>
      <div className="panel__title" style={{ marginBottom: 12 }}>Edit batch — {batch.code}</div>
      <div className="form-grid">
        <div className="form-field"><label>Batch code</label><input className="input" value={code} onChange={(e) => setCode(e.target.value)} /></div>
        <div className="form-field"><label>Billing Month</label><input className="input" value={period} onChange={(e) => setPeriod(e.target.value)} /></div>
        <div className="form-field"><label>Status</label><select className="select" value={status} onChange={(e) => setStatus(e.target.value as BatchStatus)}>{EDIT_STATUSES.map((s) => <option key={s}>{s}</option>)}</select></div>
      </div>
      <p className="sub-hint" style={{ marginTop: 10 }}>Code format <b>BILL-DD-MON-YYYY-&lt;I/II/…&gt;</b>. <b>Paying entity is set per invoice</b> (not on the batch); the billing month groups bill files by invoice received month.</p>
      <div style={{ marginTop: 8, display: 'flex', gap: 10 }}>
        <button className="btn btn--primary btn--sm" onClick={() => onSave({ ...batch, code, periodMonth: period, status })}>Save changes</button>
        <button className="btn btn--ghost btn--sm" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

export default function BatchesPage() {
  const [batches, setBatches] = useState<BillingBatch[]>(billingBatches);
  const [text, setText] = useState('');
  const [status, setStatus] = useState('All');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [view, setView] = useState<'batches' | 'masters'>('batches');

  const rows = useMemo(() => batches.filter((b) => {
    if (status !== 'All' && b.status !== status) return false;
    const q = text.trim().toLowerCase();
    if (q && !(`${b.code} ${b.periodMonth}`.toLowerCase().includes(q))) return false;
    return true;
  }), [batches, text, status]);

  // Master files = bill files rolled up by billing month (invoice received month).
  const masters = useMemo(() => {
    const m: Record<string, { month: string; batches: BillingBatch[] }> = {};
    rows.forEach((b) => { (m[b.periodMonth] ??= { month: b.periodMonth, batches: [] }).batches.push(b); });
    return Object.values(m).map((g) => ({
      ...g,
      invoices: g.batches.reduce((s, b) => s + b.lineIds.length, 0),
      total: g.batches.reduce((s, b) => s + b.totalValue, 0),
      recurring: g.batches.reduce((s, b) => s + b.recurringCount, 0),
      nonRecurring: g.batches.reduce((s, b) => s + b.nonRecurringCount, 0),
    }));
  }, [rows]);

  const editing = batches.find((b) => b.id === editingId) ?? null;

  const remove = (id: string) => {
    if (typeof window !== 'undefined' && window.confirm('Delete this billing batch? This cannot be undone.')) {
      setBatches((list) => list.filter((b) => b.id !== id));
      if (editingId === id) setEditingId(null);
    }
  };
  const saveEdit = (updated: BillingBatch) => {
    setBatches((list) => list.map((b) => (b.id === updated.id ? updated : b)));
    setEditingId(null);
  };

  return (
    <>
      <div className="toolbar">
        <div className="field" style={{ flex: '1 1 260px' }}>
          <label>Search — batch code / billing month</label>
          <input className="input" style={{ width: '100%' }} placeholder="e.g. BILL-03-JUN or May 2026" value={text} onChange={(e) => setText(e.target.value)} />
        </div>
        <div className="field"><label>Status</label>
          <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}><option>All</option>{EDIT_STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
        </div>
        <div className="spacer" />
        <Link className="btn btn--primary btn--sm" href="/invoicing/upload"><Icon name="plus" size={15} strokeWidth={2.2} /> New from upload</Link>
      </div>

      <div className="seg" style={{ marginBottom: 14 }}>
        <button className={view === 'batches' ? 'active' : ''} onClick={() => setView('batches')}>Bill files ({rows.length})</button>
        <button className={view === 'masters' ? 'active' : ''} onClick={() => setView('masters')}>Master files — monthly ({masters.length})</button>
      </div>

      {editing && <EditBatchForm key={editing.id} batch={editing} onSave={saveEdit} onCancel={() => setEditingId(null)} />}

      <div className="totals-bar">
        <div><b>{rows.length}</b><span>Bill files</span></div>
        <div><b>{masters.length}</b><span>Billing months</span></div>
        <div><b>{rows.reduce((s, b) => s + b.lineIds.length, 0)}</b><span>Invoices</span></div>
        <div><b>{rows.filter((b) => b.status === 'Pending Approval').length}</b><span>Pending approval</span></div>
      </div>

      {view === 'masters' ? (
        <div style={{ display: 'grid', gap: 14 }}>
          {masters.map((m) => (
            <div key={m.month} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="master-head">
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}><Icon name="invoicing" size={15} /> Master file — {m.month}</div>
                  <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>{m.batches.length} bill file(s) · {m.invoices} invoice(s) · {m.recurring} rec / {m.nonRecurring} non-rec · keyed by invoice received month</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ textAlign: 'right' }}><div style={{ fontWeight: 700 }}><Money value={m.total} /></div><div className="muted" style={{ fontSize: 11 }}>Master total</div></div>
                  <button className="btn btn--ghost btn--sm" onClick={() => alert('Mock: download consolidated master file for ' + m.month)}><Icon name="download" size={15} /> Download master file</button>
                </div>
              </div>
              <table className="data-table">
                <thead><tr><th>Bill file</th><th className="num">Invoices</th><th className="num">Value</th><th>Recurring</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {m.batches.map((b) => (
                    <tr key={b.id}>
                      <td className="mono">{b.code}</td>
                      <td className="num">{b.lineIds.length}</td>
                      <td className="num"><Money value={b.totalValue} /></td>
                      <td>{b.recurringCount} rec · {b.nonRecurringCount} non-rec</td>
                      <td><BatchStatusBadge status={b.status} /></td>
                      <td>
                        <div className="row-actions">
                          <Link className="btn btn--ghost btn--icon" href={`/invoicing/batches/${b.id}`} title="View" aria-label="View"><Icon name="eye" size={16} /></Link>
                          <button className="btn btn--ghost btn--icon" title="Edit" aria-label="Edit" onClick={() => { setEditingId(b.id); setView('batches'); }}><Icon name="edit" size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          {masters.length === 0 && <div className="empty"><div className="empty__icon"><Icon name="invoicing" size={34} /></div><h2>No master files</h2><p>No bill files match your filters.</p></div>}
        </div>
      ) : (
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Bill file</th><th>Billing Month</th><th className="num">Invoices</th>
                <th className="num">Total value</th><th>Recurring</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id}>
                  <td className="mono">{b.code}</td>
                  <td>{b.periodMonth}</td>
                  <td className="num">{b.lineIds.length}</td>
                  <td className="num"><Money value={b.totalValue} /></td>
                  <td>{b.recurringCount} rec · {b.nonRecurringCount} non-rec</td>
                  <td><BatchStatusBadge status={b.status} /></td>
                  <td>
                    <div className="row-actions">
                      <Link className="btn btn--ghost btn--icon" href={`/invoicing/batches/${b.id}`} title="View" aria-label="View"><Icon name="eye" size={16} /></Link>
                      <button className="btn btn--ghost btn--icon" title="Edit" aria-label="Edit" onClick={() => setEditingId(b.id)}><Icon name="edit" size={16} /></button>
                      <button className="btn btn--ghost btn--icon is-danger" title="Delete" aria-label="Delete" onClick={() => remove(b.id)}><Icon name="trash" size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 26, color: 'var(--text-soft)' }}>No bill files match your filters.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
