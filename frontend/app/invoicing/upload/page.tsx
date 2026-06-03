'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { invoices, payingEntities } from '@/lib/invoicing/mockData';
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
  const [otherEntity, setOtherEntity] = useState('');
  const readyCount = invoices.filter((i) => i.extractionStatus === 'Ready for Review').length;

  return (
    <>
      <Stepper step={1} />

      <div className="toolbar">
        <div className="field">
          <label>Invoice received date</label>
          <input className="input" type="date" value={receivedDate} onChange={(e) => setReceivedDate(e.target.value)} />
        </div>
        <div className="field">
          <label>Paying company</label>
          <select className="select" value={entity} onChange={(e) => setEntity(e.target.value)}>
            {payingEntities.map((p) => <option key={p.id} value={p.code}>{p.code} — {p.legalName}</option>)}
            <option value="__other">Other (enter name)…</option>
          </select>
        </div>
        {entity === '__other' && (
          <div className="field">
            <label>Entity name</label>
            <input className="input" placeholder="Type entity name" value={otherEntity} onChange={(e) => setOtherEntity(e.target.value)} />
          </div>
        )}
      </div>

      <div className="dropzone" role="button" tabIndex={0}>
        <div className="dz-icon"><Icon name="plus" size={26} strokeWidth={2} /></div>
        <div style={{ fontWeight: 600, color: 'var(--text)' }}>Drag invoices here, or click to browse</div>
        <div style={{ fontSize: 12.5, marginTop: 4 }}>PDF, Word, Excel or scanned image · max 10 files · up to 15 MB each</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '20px 0 8px' }}>
        <h3 className="section-title" style={{ margin: 0 }}>Uploaded files ({invoices.length})</h3>
        <span className="sub-hint" style={{ margin: 0 }}>{readyCount} ready for review</span>
      </div>

      {invoices.map((inv) => (
        <div className="file-row" key={inv.id}>
          <div className="f-icon"><Icon name="invoicing" size={18} /></div>
          <div style={{ flex: 1 }}>
            <div className="f-name">{inv.fileName}</div>
            <div className="f-meta">{inv.fileType} · {inv.payingEntityCode} · received {inv.receivedDate}</div>
          </div>
          {inv.extractionStatus === 'Extracting' && (
            <div className="progress" aria-label="extracting"><span style={{ width: '60%' }} /></div>
          )}
          <span className={`pill ${STATUS_PILL[inv.extractionStatus]}`}>{inv.extractionStatus}</span>
        </div>
      ))}

      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <Link className="btn btn--primary" href="/invoicing/review">
          Proceed to review ({readyCount}) <Icon name="chevronRight" size={16} strokeWidth={2.2} />
        </Link>
        <Link className="btn btn--ghost" href="/invoicing">Cancel</Link>
      </div>
    </>
  );
}
