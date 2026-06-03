'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { invoices, payingEntities, addDays, paymentPriority } from '@/lib/invoicing/mockData';
import type { ExtractionStatus } from '@/lib/invoicing/types';

const STATUS_PILL: Record<ExtractionStatus, string> = {
  'Queued': 'st-unpaid',
  'Extracting': 'st-process',
  'Ready for Review': 'st-paid',
  'Confirmed': 'st-sentfin',
};

function Stepper({ step }: { step: 1 | 2 | 3 }) {
  const steps = ['Upload', 'Review & confirm', 'Build batch'];
  return (
    <div className="stepper">
      {steps.map((s, i) => {
        const n = (i + 1) as 1 | 2 | 3;
        const cls = n < step ? 'step done' : n === step ? 'step active' : 'step';
        return (
          <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span className={cls}><span className="dot">{n < step ? '✓' : n}</span><span>{s}</span></span>
            {i < steps.length - 1 && <span className="step-sep" />}
          </span>
        );
      })}
    </div>
  );
}

export default function UploadPage() {
  const [receivedDate, setReceivedDate] = useState('2026-06-03');
  const [entity, setEntity] = useState('OSPL');
  const [defaultCredit, setDefaultCredit] = useState(30);
  const [defaultRecurring, setDefaultRecurring] = useState<'Recurring' | 'Non-recurring'>('Non-recurring');
  // per-file overrides
  const [credit, setCredit] = useState<Record<string, number>>({});
  const [recurring, setRecurring] = useState<Record<string, 'Recurring' | 'Non-recurring'>>({});

  const readyCount = invoices.filter((i) => i.extractionStatus === 'Ready for Review').length;

  return (
    <>
      <Stepper step={1} />

      <div className="toolbar">
        <div className="field"><label>Invoice received date</label><input className="input" type="date" value={receivedDate} onChange={(e) => setReceivedDate(e.target.value)} /></div>
        <div className="field">
          <label>Default paying company</label>
          <select className="select" value={entity} onChange={(e) => setEntity(e.target.value)}>
            {payingEntities.map((p) => <option key={p.id} value={p.code}>{p.code} — {p.legalName}</option>)}
            <option value="__other">Other (enter in review)…</option>
          </select>
        </div>
        <div className="field"><label>Default credit period (days)</label><input className="input" type="number" min={0} max={180} value={defaultCredit} onChange={(e) => setDefaultCredit(+e.target.value)} /></div>
        <div className="field">
          <label>Default type</label>
          <select className="select" value={defaultRecurring} onChange={(e) => setDefaultRecurring(e.target.value as typeof defaultRecurring)}>
            <option>Non-recurring</option><option>Recurring</option>
          </select>
        </div>
      </div>

      <div className="dropzone" role="button" tabIndex={0}>
        <div className="dz-icon"><Icon name="plus" size={26} strokeWidth={2} /></div>
        <div style={{ fontWeight: 600, color: 'var(--text)' }}>Drag invoices here, or click to browse</div>
        <div style={{ fontSize: 12.5, marginTop: 4 }}>PDF, Word, Excel or scanned image · max 10 files · up to 15 MB each</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '20px 0 8px' }}>
        <h3 className="section-title" style={{ margin: 0 }}>Uploaded files ({invoices.length})</h3>
        <span className="sub-hint" style={{ margin: 0 }}>Credit period &amp; type are editable per invoice; due date &amp; priority are derived. Final values confirmed in review.</span>
      </div>

      <div className="table-card" style={{ overflowX: 'auto' }}>
        <table className="data-table" style={{ minWidth: 920 }}>
          <thead>
            <tr>
              <th>File</th><th>Entity</th><th>Received</th><th className="num">Credit (days)</th>
              <th>Due date</th><th>Priority</th><th>Type</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => {
              const cp = credit[inv.id] ?? defaultCredit;
              const rec = recurring[inv.id] ?? defaultRecurring;
              const due = addDays(inv.receivedDate, cp);
              const prio = paymentPriority(due);
              return (
                <tr key={inv.id}>
                  <td><div className="f-name" style={{ fontSize: 13 }}>{inv.fileName}</div><div className="attach"><Icon name="invoicing" size={11} /> {inv.fileType}</div></td>
                  <td>{inv.payingEntityCode}</td>
                  <td>{inv.receivedDate}</td>
                  <td className="num"><input className="input" type="number" style={{ width: 80, minWidth: 0, height: 32 }} value={cp} onChange={(e) => setCredit({ ...credit, [inv.id]: +e.target.value })} /></td>
                  <td>{due}</td>
                  <td><span className={`pill ${prio === 'I' ? 'st-process' : 'st-sentfin'}`}>Priority {prio}</span></td>
                  <td>
                    <select className="select" style={{ minWidth: 0, height: 32 }} value={rec} onChange={(e) => setRecurring({ ...recurring, [inv.id]: e.target.value as 'Recurring' | 'Non-recurring' })}>
                      <option>Non-recurring</option><option>Recurring</option>
                    </select>
                  </td>
                  <td>
                    {inv.extractionStatus === 'Extracting'
                      ? <span className="pill st-process">Extracting…</span>
                      : <span className={`pill ${STATUS_PILL[inv.extractionStatus]}`}>{inv.extractionStatus}</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <Link className="btn btn--primary" href="/invoicing/review">
          Proceed to review ({readyCount}) <Icon name="chevronRight" size={16} strokeWidth={2.2} />
        </Link>
        <Link className="btn btn--ghost" href="/invoicing">Cancel</Link>
      </div>
    </>
  );
}
