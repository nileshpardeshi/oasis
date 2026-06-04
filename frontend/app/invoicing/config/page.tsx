'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { payingEntities, categories } from '@/lib/invoicing/mockData';

interface Entity { id: string; code: string; legalName: string; country: string; currency: string }
interface Category { id: string; name: string }
type EntityForm = { id?: string; code: string; legalName: string; country: string; currency: string };

const DEFAULT_TEMPLATE = `Dear {{vendorName}},

This is to confirm that payment for the following has been processed:

Bill no: {{billNo}}
Net amount: {{netAmount}}  (TDS: {{tds}})
UTR: {{utr}}
Date: {{paymentDate}}   Mode: {{mode}}

Regards,
Opus Technologies — Accounts Payable`;

const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 8)}`;

export default function ConfigPage() {
  const [ents, setEnts] = useState<Entity[]>(() => payingEntities.map((p) => ({ id: p.id, code: p.code, legalName: p.legalName, country: p.country, currency: p.currency })));
  const [entForm, setEntForm] = useState<EntityForm | null>(null);

  const [cats, setCats] = useState<Category[]>(() => categories.map((c) => ({ id: c.id, name: c.name })));
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catDraft, setCatDraft] = useState('');
  const [newCat, setNewCat] = useState('');

  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [savedTpl, setSavedTpl] = useState(false);

  // --- entities ---
  const saveEntity = () => {
    if (!entForm) return;
    if (!entForm.code.trim()) { alert('Entity code is required.'); return; }
    const clean: Entity = { id: entForm.id ?? uid('ent'), code: entForm.code.trim(), legalName: entForm.legalName.trim(), country: entForm.country.trim() || '—', currency: entForm.currency };
    setEnts((list) => (entForm.id ? list.map((e) => (e.id === entForm.id ? clean : e)) : [...list, clean]));
    setEntForm(null);
  };
  const deleteEntity = (id: string) => {
    if (typeof window !== 'undefined' && window.confirm('Delete this paying entity? Invoices already tagged to it are not changed.')) {
      setEnts((list) => list.filter((e) => e.id !== id));
      if (entForm?.id === id) setEntForm(null);
    }
  };

  // --- categories ---
  const addCat = () => {
    const name = newCat.trim();
    if (!name) return;
    setCats((list) => [...list, { id: uid('cat'), name }]);
    setNewCat('');
  };
  const saveCat = () => {
    const name = catDraft.trim();
    if (!name) return;
    setCats((list) => list.map((c) => (c.id === editingCatId ? { ...c, name } : c)));
    setEditingCatId(null);
  };
  const deleteCat = (id: string) => {
    if (typeof window !== 'undefined' && window.confirm('Delete this expense category?')) {
      setCats((list) => list.filter((c) => c.id !== id));
      if (editingCatId === id) setEditingCatId(null);
    }
  };

  return (
    <>
      {/* Paying entities */}
      <div className="toolbar">
        <h3 className="section-title" style={{ margin: 0 }}>Paying entities</h3>
        <div className="spacer" />
        <button className="btn btn--primary btn--sm" onClick={() => setEntForm(entForm ? null : { code: '', legalName: '', country: 'India', currency: 'INR' })}>
          <Icon name={entForm ? 'close' : 'plus'} size={15} strokeWidth={2.2} /> {entForm ? 'Close' : 'Add entity'}
        </button>
      </div>
      {entForm && (
        <div className="card" style={{ padding: 16, marginBottom: 14 }}>
          <div className="panel__title" style={{ marginBottom: 12 }}>{entForm.id ? 'Edit entity' : 'Add entity'}</div>
          <div className="form-grid">
            <div className="form-field"><label>Code</label><input className="input" placeholder="e.g. OSPL" value={entForm.code} onChange={(e) => setEntForm({ ...entForm, code: e.target.value })} /></div>
            <div className="form-field"><label>Legal name</label><input className="input" placeholder="Opus Software Pvt. Ltd." value={entForm.legalName} onChange={(e) => setEntForm({ ...entForm, legalName: e.target.value })} /></div>
            <div className="form-field"><label>Country</label><input className="input" placeholder="India" value={entForm.country} onChange={(e) => setEntForm({ ...entForm, country: e.target.value })} /></div>
            <div className="form-field"><label>Currency</label><select className="select" value={entForm.currency} onChange={(e) => setEntForm({ ...entForm, currency: e.target.value })}><option>INR</option><option>USD</option><option>EUR</option><option>GBP</option></select></div>
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
            <button className="btn btn--primary btn--sm" onClick={saveEntity}>{entForm.id ? 'Save changes' : 'Save entity'}</button>
            <button className="btn btn--ghost btn--sm" onClick={() => setEntForm(null)}>Cancel</button>
          </div>
        </div>
      )}
      <div className="table-card" style={{ marginBottom: 24 }}>
        <table className="data-table">
          <thead><tr><th>Code</th><th>Legal name</th><th>Country</th><th>Currency</th><th>Actions</th></tr></thead>
          <tbody>
            {ents.map((p) => (
              <tr key={p.id}>
                <td><b>{p.code}</b></td><td>{p.legalName}</td><td>{p.country}</td><td>{p.currency}</td>
                <td>
                  <div className="row-actions">
                    <button className="btn btn--ghost btn--icon" title="Edit entity" aria-label="Edit entity" onClick={() => setEntForm({ ...p })}><Icon name="edit" size={16} /></button>
                    <button className="btn btn--ghost btn--icon is-danger" title="Delete entity" aria-label="Delete entity" onClick={() => deleteEntity(p.id)}><Icon name="trash" size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {ents.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 20, color: 'var(--text-soft)' }}>No paying entities — add one above.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Categories */}
      <h3 className="section-title">Expense categories</h3>
      <div className="card" style={{ padding: 16, marginBottom: 24 }}>
        <div className="cfg-cat-list">
          {cats.map((c) => (
            <div className="cfg-cat-row" key={c.id}>
              {editingCatId === c.id ? (
                <>
                  <input className="input" style={{ flex: 1, height: 34, minWidth: 0 }} value={catDraft} autoFocus
                    onChange={(e) => setCatDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') saveCat(); if (e.key === 'Escape') setEditingCatId(null); }} />
                  <button className="btn btn--primary btn--sm" onClick={saveCat}>Save</button>
                  <button className="btn btn--ghost btn--sm" onClick={() => setEditingCatId(null)}>Cancel</button>
                </>
              ) : (
                <>
                  <span style={{ flex: 1 }}>{c.name}</span>
                  <div className="row-actions">
                    <button className="btn btn--ghost btn--icon" title="Edit category" aria-label="Edit category" onClick={() => { setEditingCatId(c.id); setCatDraft(c.name); }}><Icon name="edit" size={16} /></button>
                    <button className="btn btn--ghost btn--icon is-danger" title="Delete category" aria-label="Delete category" onClick={() => deleteCat(c.id)}><Icon name="trash" size={16} /></button>
                  </div>
                </>
              )}
            </div>
          ))}
          {cats.length === 0 && <p className="muted" style={{ margin: '4px 0', fontSize: 13 }}>No categories yet — add one below.</p>}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <input className="input" placeholder="New category name" style={{ flex: 1 }} value={newCat}
            onChange={(e) => setNewCat(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addCat(); }} />
          <button className="btn btn--primary btn--sm" onClick={addCat}><Icon name="plus" size={15} strokeWidth={2.2} /> Add</button>
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
