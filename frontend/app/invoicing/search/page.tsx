'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { billingLines, payingEntities, categories, inr, batchForLine } from '@/lib/invoicing/mockData';
import { StatusBadge, NotifBadge } from '@/components/invoicing/ui';
import type { PaymentStatus } from '@/lib/invoicing/types';

const STATUSES: (PaymentStatus | 'All')[] = ['All', 'Not Paid', 'Sent to Finance', 'In Process', 'Paid', 'Partially Paid', 'On Hold'];

export default function RecordsPage() {
  const [text, setText] = useState('');
  const [status, setStatus] = useState<string>('All');
  const [entity, setEntity] = useState('All');
  const [category, setCategory] = useState('All');

  const rows = useMemo(() => {
    const q = text.trim().toLowerCase();
    return billingLines.filter((l) => {
      if (status !== 'All' && l.paymentStatus !== status) return false;
      if (entity !== 'All' && l.payingEntityCode !== entity) return false;
      if (category !== 'All' && l.categoryName !== category) return false;
      if (q && !(`${l.billNo} ${l.utr ?? ''} ${l.vendorName}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [text, status, entity, category]);

  const total = rows.reduce((s, l) => s + l.totalAmount, 0);

  return (
    <>
      <div className="toolbar">
        <div className="field" style={{ flex: '1 1 240px' }}>
          <label>Search — bill no, UTR, vendor</label>
          <input className="input" style={{ width: '100%' }} placeholder="e.g. STL-2026 or UTR…" value={text} onChange={(e) => setText(e.target.value)} />
        </div>
        <div className="field">
          <label>Status</label>
          <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Entity</label>
          <select className="select" value={entity} onChange={(e) => setEntity(e.target.value)}>
            <option>All</option>
            {payingEntities.map((p) => <option key={p.id}>{p.code}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Category</label>
          <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option>All</option>
            {categories.map((c) => <option key={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="spacer" />
        <button className="btn btn--ghost btn--sm" onClick={() => alert('Mock: export results to Excel/CSV')}><Icon name="invoicing" size={15} /> Export</button>
      </div>

      <div className="totals-bar">
        <div><b>{rows.length}</b><span>Records</span></div>
        <div><b>{inr(total)}</b><span>Total value</span></div>
        <div><b>{rows.filter((r) => r.paymentStatus === 'Paid').length}</b><span>Paid</span></div>
        <div><b>{rows.filter((r) => r.paymentStatus !== 'Paid').length}</b><span>Open</span></div>
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Entity</th><th>Billing Month</th><th>Vendor</th><th>Bill no</th><th>Batch ID</th><th>Bill date</th><th>Category</th>
              <th className="num">Total</th><th>Due</th><th>Status</th><th>UTR</th><th>Notified</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((l) => {
              const b = batchForLine(l.id);
              return (
              <tr key={l.id}>
                <td>{l.payingEntityCode}</td>
                <td>{b?.periodMonth ?? '—'}</td>
                <td>{l.vendorName}</td>
                <td className="mono">{l.billNo}</td>
                <td className="mono">{b ? <Link className="panel__link" href={`/invoicing/batches/${b.id}`}>{b.code}</Link> : '—'}</td>
                <td>{l.billDate}</td>
                <td>{l.categoryName}</td>
                <td className="num">{inr(l.totalAmount)}</td>
                <td>{l.dueDate}</td>
                <td><StatusBadge status={l.paymentStatus} /></td>
                <td className="mono">{l.utr ?? '—'}</td>
                <td><NotifBadge status={l.notificationStatus} /></td>
              </tr>
              );
            })}
            {rows.length === 0 && <tr><td colSpan={12} style={{ textAlign: 'center', padding: 28, color: 'var(--text-soft)' }}>No records match your filters.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
