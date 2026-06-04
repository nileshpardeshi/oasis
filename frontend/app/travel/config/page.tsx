'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';

const POLICY = [
  { grade: 'M1–M2', domestic: 'Economy', intlShort: 'Economy', intlLong: 'Economy', cap: '₹1,60,000', advance: '14 days' },
  { grade: 'M3–M4', domestic: 'Economy', intlShort: 'Economy', intlLong: 'Premium Economy', cap: '₹2,40,000', advance: '10 days' },
  { grade: 'Director+', domestic: 'Economy', intlShort: 'Business', intlLong: 'Business', cap: '₹4,50,000', advance: '7 days' },
];

const PROVIDERS = [
  { name: 'TBO', role: 'India B2B — domestic/LCC', on: true },
  { name: 'Tripjack', role: 'India B2B — alt source', on: false },
  { name: 'Duffel', role: 'NDC / international', on: true },
  { name: 'Amadeus Self-Service', role: 'GDS cross-check', on: true },
  { name: 'Kiwi / Travelpayouts', role: 'Meta second opinion', on: false },
];

export default function TravelConfigPage() {
  const [window, setWindow] = useState(2);
  const [threshold, setThreshold] = useState(5);
  const [providers, setProviders] = useState(PROVIDERS);
  const [saved, setSaved] = useState(false);
  const toggle = (i: number) => { setProviders((p) => p.map((x, j) => (j === i ? { ...x, on: !x.on } : x))); setSaved(false); };

  return (
    <>
      {/* Travel policy */}
      <h3 className="section-title" style={{ marginTop: 0 }}>Travel policy</h3>
      <div className="table-card" style={{ marginBottom: 22 }}>
        <table className="data-table">
          <thead><tr><th>Grade</th><th>Domestic</th><th>Intl (short-haul)</th><th>Intl (long-haul)</th><th>Budget cap</th><th>Advance booking</th></tr></thead>
          <tbody>
            {POLICY.map((p) => (
              <tr key={p.grade}><td><b>{p.grade}</b></td><td>{p.domestic}</td><td>{p.intlShort}</td><td>{p.intlLong}</td><td>{p.cap}</td><td>{p.advance}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Fare-watch + providers */}
      <div className="cards-2">
        <div className="card" style={{ padding: 18 }}>
          <div className="panel__title" style={{ marginBottom: 12 }}>Fare-watch &amp; monitoring</div>
          <div className="form-grid">
            <div className="form-field"><label>Watch until (days before departure)</label><input className="input" type="number" min={0} max={14} value={window} onChange={(e) => { setWindow(+e.target.value); setSaved(false); }} /></div>
            <div className="form-field"><label>Alert threshold (% drop)</label><input className="input" type="number" min={1} max={50} value={threshold} onChange={(e) => { setThreshold(+e.target.value); setSaved(false); }} /></div>
          </div>
          <p className="sub-hint" style={{ marginTop: 10 }}>Schedule/PNR tracking: daily until 72h before, hourly on the day of travel.</p>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <div className="panel__title" style={{ marginBottom: 12 }}>Benchmark providers (Phase 1 — search only)</div>
          <div className="cfg-cat-list">
            {providers.map((p, i) => (
              <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 2px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ flex: 1 }}><b>{p.name}</b> <span className="muted" style={{ fontSize: 12 }}>· {p.role}</span></div>
                <button className={'tv-pill ' + (p.on ? 'tv-paid' : 'tv-unpaid')} style={{ cursor: 'pointer', border: 0 }} onClick={() => toggle(i)}>{p.on ? 'Enabled' : 'Disabled'}</button>
              </div>
            ))}
          </div>
          <p className="sub-hint" style={{ marginTop: 10 }}><Icon name="info" size={13} /> Booking content/providers are chosen later — Phase 1 only searches to benchmark.</p>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <button className="btn btn--primary btn--sm" onClick={() => setSaved(true)}>Save configuration</button>
        {saved && <span className="reco ok" style={{ display: 'inline-block', marginLeft: 12 }}>✓ Saved — watch {window} days / {threshold}% threshold · {providers.filter((p) => p.on).length} providers enabled.</span>}
      </div>
    </>
  );
}
