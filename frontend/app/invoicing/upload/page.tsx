'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { invoices, payingEntities, addDays, paymentPriority } from '@/lib/invoicing/mockData';
import type { ExtractionStatus } from '@/lib/invoicing/types';

type LineType = 'Recurring' | 'Non-recurring';
interface FileRow {
  id: string;
  fileName: string;
  fileType: string;
  entity: string;
  received: string;
  credit: number;       // per-file value (NOT a live default)
  type: LineType;
  status: ExtractionStatus;
}

const STATUS_PILL: Record<ExtractionStatus, string> = {
  'Queued': 'st-unpaid',
  'Extracting': 'st-process',
  'Ready for Review': 'st-paid',
  'Confirmed': 'st-sentfin',
};

// Files already in the list each carry their OWN values (snapshot taken when they were uploaded).
const seedFiles: FileRow[] = invoices.map((inv) => ({
  id: inv.id, fileName: inv.fileName, fileType: inv.fileType, entity: inv.payingEntityCode,
  received: inv.receivedDate, credit: 30, type: 'Non-recurring', status: inv.extractionStatus,
}));

// Simulated "browse" pool — clicking the dropzone adds one of these using the CURRENT defaults.
const NEW_FILES = [
  { fileName: 'Vodafone_Idea_May.pdf', fileType: 'PDF' },
  { fileName: 'Hyatt_Regency_stay.pdf', fileType: 'PDF' },
  { fileName: 'BlueDart_courier.xlsx', fileType: 'Excel' },
  { fileName: 'MSEDCL_electricity.pdf', fileType: 'PDF (scan)' },
];

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
  const [files, setFiles] = useState<FileRow[]>(seedFiles);
  // Defaults applied to the NEXT upload only — not to files already in the list.
  const [receivedDate, setReceivedDate] = useState('2026-06-03');
  const [entity, setEntity] = useState('OSPL');
  const [defCredit, setDefCredit] = useState(30);
  const [defType, setDefType] = useState<LineType>('Non-recurring');

  const readyCount = files.filter((f) => f.status === 'Ready for Review').length;

  const addFile = () => {
    setFiles((prev) => {
      const tmpl = NEW_FILES[prev.length % NEW_FILES.length];
      const row: FileRow = {
        id: 'up-' + (prev.length + 1),
        fileName: tmpl.fileName, fileType: tmpl.fileType,
        entity: entity === '__other' ? 'Other' : entity,
        received: receivedDate, credit: defCredit, type: defType, status: 'Ready for Review',
      };
      return [...prev, row];
    });
  };
  const updateFile = (id: string, patch: Partial<FileRow>) =>
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));

  return (
    <>
      <Stepper step={1} />

      <div className="toolbar">
        <div className="field"><label>Invoice received date</label><input className="input" type="date" value={receivedDate} onChange={(e) => setReceivedDate(e.target.value)} /></div>
        <div className="field">
          <label>Paying company</label>
          <select className="select" value={entity} onChange={(e) => setEntity(e.target.value)}>
            {payingEntities.map((p) => <option key={p.id} value={p.code}>{p.code} — {p.legalName}</option>)}
            <option value="__other">Other (enter in review)…</option>
          </select>
        </div>
        <div className="field"><label>Credit period (days)</label><input className="input" type="number" min={0} max={180} value={defCredit} onChange={(e) => setDefCredit(+e.target.value)} /></div>
        <div className="field">
          <label>Type</label>
          <select className="select" value={defType} onChange={(e) => setDefType(e.target.value as LineType)}>
            <option>Non-recurring</option><option>Recurring</option>
          </select>
        </div>
      </div>
      <p className="sub-hint" style={{ marginTop: -6 }}>
        <Icon name="info" size={13} /> These values apply to the files you upload <b>next</b> — each uploaded file keeps its own value (editable per row below). Changing them does not affect files already added.
      </p>

      <div className="dropzone" role="button" tabIndex={0} onClick={addFile} onKeyDown={(e) => { if (e.key === 'Enter') addFile(); }}>
        <div className="dz-icon"><Icon name="plus" size={26} strokeWidth={2} /></div>
        <div style={{ fontWeight: 600, color: 'var(--text)' }}>Drag invoices here, or click to browse</div>
        <div style={{ fontSize: 12.5, marginTop: 4 }}>PDF, Word, Excel or scanned image · max 10 files · up to 15 MB each · uploaded with the values above</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '20px 0 8px' }}>
        <h3 className="section-title" style={{ margin: 0 }}>Uploaded files ({files.length})</h3>
        <span className="sub-hint" style={{ margin: 0 }}>Each file's credit period &amp; type are independent — edit any row; due date &amp; payment cycle recompute for that file only.</span>
      </div>

      <div className="table-card" style={{ overflowX: 'auto' }}>
        <table className="data-table" style={{ minWidth: 1000 }}>
          <thead>
            <tr>
              <th>File</th><th>Entity</th><th>Received</th><th className="num">Credit (days)</th>
              <th>Due date</th><th>Payment Cycle</th><th>Type</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {files.map((f) => {
              const due = addDays(f.received, f.credit);
              const prio = paymentPriority(due);
              return (
                <tr key={f.id}>
                  <td><div className="f-name" style={{ fontSize: 13 }}>{f.fileName}</div><div className="attach"><Icon name="invoicing" size={11} /> {f.fileType}</div></td>
                  <td>{f.entity}</td>
                  <td>{f.received}</td>
                  <td className="num"><input className="input" type="number" style={{ width: 80, minWidth: 0, height: 32 }} value={f.credit} onChange={(e) => updateFile(f.id, { credit: +e.target.value })} /></td>
                  <td>{due}</td>
                  <td><span className={`pill ${prio === 'I' ? 'st-process' : 'st-sentfin'}`}>Cycle {prio}</span></td>
                  <td>
                    <select className="select" style={{ minWidth: 0, height: 32 }} value={f.type} onChange={(e) => updateFile(f.id, { type: e.target.value as LineType })}>
                      <option>Non-recurring</option><option>Recurring</option>
                    </select>
                  </td>
                  <td>
                    {f.status === 'Extracting'
                      ? <span className="pill st-process">Extracting…</span>
                      : <span className={`pill ${STATUS_PILL[f.status]}`}>{f.status}</span>}
                  </td>
                  <td><button className="btn btn--ghost btn--icon is-danger" title="Remove file" aria-label="Remove file" onClick={() => removeFile(f.id)}><Icon name="trash" size={16} /></button></td>
                </tr>
              );
            })}
            {files.length === 0 && <tr><td colSpan={9} style={{ textAlign: 'center', padding: 24, color: 'var(--text-soft)' }}>No files yet — click the dropzone above to add.</td></tr>}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <Link className="btn btn--primary" href="/invoicing/review">
          Proceed to review ({readyCount}) <Icon name="chevronRight" size={16} strokeWidth={2.2} />
        </Link>
        <Link className="btn btn--back" href="/invoicing"><Icon name="arrowLeft" size={16} strokeWidth={2.2} /> Back to Overview</Link>
      </div>
    </>
  );
}
