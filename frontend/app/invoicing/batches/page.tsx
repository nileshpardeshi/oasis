'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { billingBatches, payingEntities, linesForBatch } from '@/lib/invoicing/mockData';
import { BatchStatusBadge, Money } from '@/components/invoicing/ui';
import type { BillingBatch, BatchStatus } from '@/lib/invoicing/types';

const EDIT_STATUSES: BatchStatus[] = ['Draft', 'Generated', 'Validated', 'Pending Approval', 'Needs Correction', 'Rejected', 'Approved', 'Sent to Finance', 'Reconciliation Open', 'Closed'];

// Entity lives on each invoice — derive the distinct entities a batch spans.
const entitiesFor = (b: BillingBatch) => Array.from(new Set(linesForBatch(b.id).map((l) => l.payingEntityCode)));

function EditBatchForm({ batch, onSave, onCancel }: { batch: BillingBatch; onSave: (b: BillingBatch) => void; onCancel: () => void }) {
  const [code, setCode] = useState(batch.code);
  const [period, setPeriod] = useState(batch.periodMonth);
  const [status, setStatus] = useState<BatchStatus>(batch.status);
  return (
    <div className="card" style={{ padding: 18, marginBottom: 16 }}>
      <div className="panel__title" style={{ marginBottom: 12 }}>Edit batch — {batch.code}</div>
      <div className="form-grid">
        <div className="form-field"><label>Batch code</label><input className="input" value={code} onChange={(e) => setCode(e.target.value)} /></div>
        <div className="form-field"><label>Period</label><input className="input" value={period} onChange={(e) => setPeriod(e.target.value)} /></div>
        <div className="form-field"><label>Status</label><select className="select" value={status} onChange={(e) => setStatus(e.target.value as BatchStatus)}>{EDIT_STATUSES.map((s) => <option key={s}>{s}</option>)}</select></div>
      </div>
      <p className="sub-hint" style={{ marginTop: 10 }}>Paying entity is set per invoice (not on the batch).</p>
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
  const [entity, setEntity] = useState('All');
  const [status, setStatus] = useState('All');
  const [editingId, setEditingId] = useState<string | null>(null);

  const rows = useMemo(() => batches.filter((b) => {
    if (status !== 'All' && b.status !== status) return false;
    if (entity !== 'All' && !entitiesFor(b).includes(entity)) return false;
    const q = text.trim().toLowerCase();
    if (q && !(`${b.code} ${b.periodMonth}`.toLowerCase().includes(q))) return false;
    return true;
  }), [batches, text, entity, status]);

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
        <div className="field" style={{ flex: '1 1 220px' }}>
          <label>Search — batch code / period</label>
          <input className="input" style={{ width: '100%' }} placeholder="e.g. BILL-2026 or Jun" value={text} onChange={(e) => setText(e.target.value)} />
        </div>
        <div className="field"><label>Entity</label>
          <select className="select" value={entity} onChange={(e) => setEntity(e.target.value)}><option>All</option>{payingEntities.map((p) => <option key={p.id}>{p.code}</option>)}</select>
        </div>
        <div className="field"><label>Status</label>
          <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}><option>All</option>{EDIT_STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
        </div>
        <div className="spacer" />
        <Link className="btn btn--primary btn--sm" href="/invoicing/upload"><Icon name="plus" size={15} strokeWidth={2.2} /> New from upload</Link>
      </div>

      {editing && <EditBatchForm key={editing.id} batch={editing} onSave={saveEdit} onCancel={() => setEditingId(null)} />}

      <div className="totals-bar">
        <div><b>{rows.length}</b><span>Batches</span></div>
        <div><b>{rows.reduce((s, b) => s + b.lineIds.length, 0)}</b><span>Invoices</span></div>
        <div><b>{rows.filter((b) => b.status === 'Pending Approval').length}</b><span>Pending approval</span></div>
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Batch</th><th>Entity</th><th>Period</th><th className="num">Invoices</th>
              <th className="num">Total value</th><th>Recurring</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id}>
                <td className="mono">{b.code}</td>
                <td>{entitiesFor(b).join(', ') || '—'}</td>
                <td>{b.periodMonth}</td>
                <td className="num">{b.lineIds.length}</td>
                <td className="num"><Money value={b.totalValue} /></td>
                <td>{b.recurringCount} rec · {b.nonRecurringCount} non-rec</td>
                <td><BatchStatusBadge status={b.status} /></td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <Link className="btn btn--ghost btn--sm" href={`/invoicing/batches/${b.id}`}>View</Link>{' '}
                  <button className="btn btn--ghost btn--sm" onClick={() => setEditingId(b.id)}>Edit</button>{' '}
                  <button className="btn btn--ghost btn--sm" style={{ color: 'var(--danger)' }} onClick={() => remove(b.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 26, color: 'var(--text-soft)' }}>No batches match your filters.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
