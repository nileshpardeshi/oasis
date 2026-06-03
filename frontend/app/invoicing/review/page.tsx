'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { invoices, categories, payingEntities, addDays, paymentPriority } from '@/lib/invoicing/mockData';
import { ConfidenceDot } from '@/components/invoicing/ui';
import type { Invoice } from '@/lib/invoicing/types';

const reviewable = invoices.filter((i) => i.extractionStatus === 'Ready for Review');

function Stepper() {
  return (
    <div className="stepper">
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span className="step done"><span className="dot">✓</span><span>Upload</span></span><span className="step-sep" />
        <span className="step active"><span className="dot">2</span><span>Review &amp; confirm</span></span><span className="step-sep" />
        <span className="step"><span className="dot">3</span><span>Build batch</span></span>
      </span>
    </div>
  );
}

function ReviewCard({ invoice, index, total, confirmed, onConfirm, onPrev }: {
  invoice: Invoice; index: number; total: number; confirmed: boolean;
  onConfirm: () => void; onPrev: () => void;
}) {
  const [vendor, setVendor] = useState(invoice.vendorName.value);
  const [billNo, setBillNo] = useState(invoice.billNo.value);
  const [billDate, setBillDate] = useState(invoice.billDate.value);
  const [basic, setBasic] = useState(invoice.basicAmount.value);
  const [gst, setGst] = useState(invoice.gstAmount.value);
  const [totalAmt, setTotalAmt] = useState(invoice.totalAmount.value);
  const [category, setCategory] = useState(invoice.categoryId ?? '');
  const [desc, setDesc] = useState(invoice.description.value);
  const [entity, setEntity] = useState(invoice.payingEntityCode);
  const [received, setReceived] = useState(invoice.receivedDate);
  const [credit, setCredit] = useState(30);
  const [recurring, setRecurring] = useState<'Recurring' | 'Non-recurring'>('Non-recurring');
  const dueDate = addDays(received, credit);
  const priority = paymentPriority(dueDate);

  const arithmeticOff = Math.abs(basic + gst - totalAmt) > 1;
  const hasLow = [invoice.vendorName, invoice.billNo, invoice.billDate, invoice.basicAmount, invoice.gstAmount, invoice.totalAmount, invoice.description]
    .some((f) => f.confidence === 'low');

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <strong>Invoice {index + 1} of {total}</strong>
        <span className="sub-hint" style={{ margin: 0 }}>{invoice.fileName} · {invoice.payingEntityCode}</span>
      </div>

      <div className="split">
        {/* Original preview */}
        <div className="pdf-pane">
          <div className="panel__head">
            <div className="panel__title"><Icon name="invoicing" size={16} /> Original invoice</div>
            <button className="btn btn--ghost btn--sm" onClick={() => alert('Mock: download ' + invoice.fileName)}><Icon name="invoicing" size={14} /> Download</button>
          </div>
          <div className="pdf-stub">
            <div style={{ textAlign: 'center' }}>
              <Icon name="invoicing" size={40} />
              <div style={{ marginTop: 8, fontSize: 12.5 }}>{invoice.fileName}</div>
              <div style={{ fontSize: 11 }}>(PDF preview renders here)</div>
            </div>
          </div>
        </div>

        {/* Extracted fields */}
        <div className="fields-pane">
          <div className="field-row">
            <label><ConfidenceDot level={invoice.vendorName.confidence} /><br />Vendor</label>
            <input className="input" value={vendor} onChange={(e) => setVendor(e.target.value)} style={{ minWidth: 0 }} />
          </div>
          <div className="field-row">
            <label><ConfidenceDot level={invoice.billNo.confidence} /><br />Bill no</label>
            <input className="input" value={billNo} onChange={(e) => setBillNo(e.target.value)} style={{ minWidth: 0 }} />
          </div>
          <div className="field-row">
            <label><ConfidenceDot level={invoice.billDate.confidence} /><br />Bill date</label>
            <input className="input" type="date" value={billDate} onChange={(e) => setBillDate(e.target.value)} style={{ minWidth: 0 }} />
          </div>
          <div className="field-row">
            <label><ConfidenceDot level={invoice.basicAmount.confidence} /><br />Basic</label>
            <input className="input" type="number" value={basic} onChange={(e) => setBasic(+e.target.value)} style={{ minWidth: 0 }} />
          </div>
          <div className="field-row">
            <label><ConfidenceDot level={invoice.gstAmount.confidence} /><br />GST</label>
            <input className="input" type="number" value={gst} onChange={(e) => setGst(+e.target.value)} style={{ minWidth: 0 }} />
          </div>
          <div className="field-row">
            <label><ConfidenceDot level={invoice.totalAmount.confidence} /><br />Total</label>
            <input className="input" type="number" value={totalAmt} onChange={(e) => setTotalAmt(+e.target.value)} style={{ minWidth: 0 }} />
          </div>
          <div className="field-row">
            <label>Category</label>
            <select className="select" value={category} onChange={(e) => setCategory(e.target.value)} style={{ minWidth: 0 }}>
              <option value="">— select —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="field-row">
            <label><ConfidenceDot level={invoice.description.confidence} /><br />Description</label>
            <input className="input" value={desc} onChange={(e) => setDesc(e.target.value)} style={{ minWidth: 0 }} />
          </div>
          <div className="field-row">
            <label>Paying entity</label>
            <select className="select" value={entity} onChange={(e) => setEntity(e.target.value)} style={{ minWidth: 0 }}>{payingEntities.map((p) => <option key={p.id} value={p.code}>{p.code}</option>)}</select>
          </div>
          <div className="field-row">
            <label>Bill received date</label>
            <input className="input" type="date" value={received} onChange={(e) => setReceived(e.target.value)} style={{ minWidth: 0 }} />
          </div>
          <div className="field-row">
            <label>Credit period (days)</label>
            <input className="input" type="number" value={credit} onChange={(e) => setCredit(+e.target.value)} style={{ minWidth: 0 }} />
          </div>
          <div className="field-row">
            <label>Type</label>
            <select className="select" value={recurring} onChange={(e) => setRecurring(e.target.value as typeof recurring)} style={{ minWidth: 0 }}><option>Non-recurring</option><option>Recurring</option></select>
          </div>
          <div className="field-row">
            <label>Due date (auto)</label>
            <div><b>{dueDate}</b> &nbsp; <span className={`pill ${priority === 'I' ? 'st-process' : 'st-sentfin'}`}>Priority {priority}</span></div>
          </div>

          {arithmeticOff && <div className="warn-inline"><Icon name="alert" size={15} /> Basic + GST ({(basic + gst).toLocaleString('en-IN')}) ≠ Total ({totalAmt.toLocaleString('en-IN')}) — please check.</div>}
          {hasLow && <div className="warn-inline"><Icon name="alert" size={15} /> Some fields were extracted with low confidence — verify before confirming.</div>}
          {confirmed && <div className="reco ok" style={{ marginTop: 10 }}>✓ Confirmed &amp; added to batch.</div>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
        <button className="btn btn--ghost" onClick={onPrev} disabled={index === 0}>
          <Icon name="chevronRight" size={16} strokeWidth={2.2} style={{ transform: 'rotate(180deg)' }} /> Previous
        </button>
        {index < total - 1 ? (
          <button className="btn btn--primary" onClick={onConfirm}>Confirm &amp; next <Icon name="chevronRight" size={16} strokeWidth={2.2} /></button>
        ) : (
          <Link className="btn btn--success" href="/invoicing/batches" onClick={onConfirm}><Icon name="check" size={16} strokeWidth={2.2} /> Confirm &amp; go to billing batch</Link>
        )}
        <Link className="btn btn--ghost" href="/invoicing/upload">Back to upload</Link>
      </div>
    </>
  );
}

export default function ReviewPage() {
  const [idx, setIdx] = useState(0);
  const [confirmedSet, setConfirmedSet] = useState<Set<number>>(new Set());

  if (reviewable.length === 0) {
    return <div className="empty"><div className="empty__icon"><Icon name="invoicing" size={36} /></div><h2>Nothing to review</h2><p>Upload invoices first.</p></div>;
  }

  const inv = reviewable[idx];
  const confirm = () => {
    setConfirmedSet((prev) => new Set(prev).add(idx));
    if (idx < reviewable.length - 1) setIdx(idx + 1);
  };

  return (
    <>
      <Stepper />
      <ReviewCard
        key={inv.id}
        invoice={inv}
        index={idx}
        total={reviewable.length}
        confirmed={confirmedSet.has(idx)}
        onConfirm={confirm}
        onPrev={() => setIdx(Math.max(0, idx - 1))}
      />
    </>
  );
}
