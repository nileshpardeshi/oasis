'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { payingEntities, categories } from '@/lib/invoicing/mockData';

const DEFAULT_TEMPLATE = `Dear {{vendorName}},

This is to confirm that payment for the following has been processed:

Bill no: {{billNo}}
Net amount: {{netAmount}}  (TDS: {{tds}})
UTR: {{utr}}
Date: {{paymentDate}}   Mode: {{mode}}

Regards,
Opus Technologies — Accounts Payable`;

export default function ConfigPage() {
  const [addEntity, setAddEntity] = useState(false);
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [savedTpl, setSavedTpl] = useState(false);

  return (
    <>
      {/* Paying entities */}
      <div className="toolbar">
        <h3 className="section-title" style={{ margin: 0 }}>Paying entities</h3>
        <div className="spacer" />
        <button className="btn btn--primary btn--sm" onClick={() => setAddEntity((s) => !s)}><Icon name="plus" size={15} strokeWidth={2.2} /> {addEntity ? 'Close' : 'Add entity'}</button>
      </div>
      {addEntity && (
        <div className="card" style={{ padding: 16, marginBottom: 14 }}>
          <div className="form-grid">
            <div className="form-field"><label>Code</label><input className="input" placeholder="e.g. OSPL" /></div>
            <div className="form-field"><label>Legal name</label><input className="input" placeholder="Opus Software Pvt. Ltd." /></div>
            <div className="form-field"><label>Country</label><input className="input" placeholder="India" /></div>
            <div className="form-field"><label>Currency</label><select className="select"><option>INR</option><option>USD</option><option>EUR</option><option>GBP</option></select></div>
          </div>
          <div style={{ marginTop: 12 }}><button className="btn btn--primary btn--sm" onClick={() => { setAddEntity(false); alert('Mock: entity added'); }}>Save entity</button></div>
        </div>
      )}
      <div className="table-card" style={{ marginBottom: 24 }}>
        <table className="data-table">
          <thead><tr><th>Code</th><th>Legal name</th><th>Country</th><th>Currency</th></tr></thead>
          <tbody>
            {payingEntities.map((p) => (
              <tr key={p.id}><td><b>{p.code}</b></td><td>{p.legalName}</td><td>{p.country}</td><td>{p.currency}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Categories */}
      <h3 className="section-title">Expense categories</h3>
      <div className="card" style={{ padding: 16, marginBottom: 24 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {categories.map((c) => <span key={c.id} className="pill st-unpaid" style={{ fontSize: 12 }}>{c.name}</span>)}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="input" placeholder="New category name" style={{ flex: 1 }} />
          <button className="btn btn--ghost btn--sm" onClick={() => alert('Mock: category added')}>Add</button>
        </div>
      </div>

      {/* Notification template */}
      <h3 className="section-title">Vendor notification template</h3>
      <div className="card" style={{ padding: 16, marginBottom: 24 }}>
        <p className="sub-hint" style={{ marginTop: 0 }}>Merge fields: <span className="mono">{'{{vendorName}} {{billNo}} {{netAmount}} {{tds}} {{utr}} {{paymentDate}} {{mode}}'}</span></p>
        <textarea className="input" style={{ width: '100%', height: 200, padding: 12, fontFamily: 'ui-monospace, Consolas, monospace', lineHeight: 1.5 }}
          value={template} onChange={(e) => { setTemplate(e.target.value); setSavedTpl(false); }} />
        <div style={{ marginTop: 12 }}>
          <button className="btn btn--primary btn--sm" onClick={() => setSavedTpl(true)}>Save template</button>
          {savedTpl && <span className="reco ok" style={{ display: 'inline-block', marginLeft: 12 }}>✓ Template saved.</span>}
        </div>
      </div>

      {/* Schedule pointer */}
      <h3 className="section-title">Notification schedule</h3>
      <div className="card" style={{ padding: 16 }}>
        <p className="muted" style={{ margin: 0, fontSize: 13 }}>
          The daily/weekly/monthly vendor-email schedule is configured under{' '}
          <Link className="panel__link" href="/invoicing/notifications">Notifications → Scheduled</Link>.
        </p>
      </div>
    </>
  );
}
