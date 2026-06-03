'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { vendors, categories } from '@/lib/invoicing/mockData';

export default function VendorsPage() {
  const [showForm, setShowForm] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <>
      <div className="toolbar">
        <h3 className="section-title" style={{ margin: 0 }}>Vendor master</h3>
        <div className="spacer" />
        <button className="btn btn--primary btn--sm" onClick={() => { setShowForm((s) => !s); setSaved(false); }}>
          <Icon name="plus" size={15} strokeWidth={2.2} /> {showForm ? 'Close' : 'Onboard vendor'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ padding: 18, marginBottom: 16 }}>
          <div className="panel__title" style={{ marginBottom: 12 }}>New vendor</div>
          {saved ? (
            <div className="reco ok">✓ Vendor saved (mock). Will be reusable in billing &amp; notifications.</div>
          ) : (
            <>
              <div className="form-grid">
                <div className="form-field"><label>Vendor name</label><input className="input" placeholder="Legal name" /></div>
                <div className="form-field"><label>GSTIN</label><input className="input" placeholder="27ABCDE1234F1Z5" /></div>
                <div className="form-field"><label>PAN</label><input className="input" placeholder="ABCDE1234F" /></div>
                <div className="form-field"><label>MSME registered?</label><select className="select"><option>No</option><option>Yes</option></select></div>
                <div className="form-field"><label>Default credit period (days)</label><input className="input" type="number" defaultValue={30} /></div>
                <div className="form-field"><label>Default category</label><select className="select">{categories.map((c) => <option key={c.id}>{c.name}</option>)}</select></div>
                <div className="form-field"><label>Bank account (masked)</label><input className="input" placeholder="XXXX1234" /></div>
                <div className="form-field"><label>AR contact email</label><input className="input" type="email" placeholder="ar@vendor.example" /></div>
              </div>
              <div style={{ marginTop: 14 }}>
                <button className="btn btn--primary btn--sm" onClick={() => setSaved(true)}>Save vendor</button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr><th>Vendor</th><th>GSTIN</th><th>PAN</th><th>MSME</th><th className="num">Credit</th><th>Bank</th><th>Contact</th><th>Status</th></tr>
          </thead>
          <tbody>
            {vendors.map((v) => (
              <tr key={v.id}>
                <td>{v.name}</td>
                <td className="mono">{v.gstin}</td>
                <td className="mono">{v.pan}</td>
                <td>{v.msme ? <span className="pill st-paid">MSME</span> : <span className="muted">—</span>}</td>
                <td className="num">{v.defaultCreditPeriodDays}d</td>
                <td className="mono">{v.bankAccount}</td>
                <td>{v.contactEmail}</td>
                <td><span className={`pill ${v.status === 'Active' ? 'st-paid' : 'st-unpaid'}`}>{v.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="sub-hint" style={{ marginTop: 10 }}>MSME vendors honour the statutory 45-day payment term (India MSMED Act) in due-date &amp; overdue alerts.</p>
    </>
  );
}
