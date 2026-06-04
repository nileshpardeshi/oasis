'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { travellers } from '@/lib/travel/mockData';

export default function NewRequestPage() {
  const [travellerId, setTravellerId] = useState(travellers[0].id);
  const [tripType, setTripType] = useState('Round-trip');
  const [origin, setOrigin] = useState('HYD');
  const [dest, setDest] = useState('SFO');
  const [intl, setIntl] = useState(true);
  const [depart, setDepart] = useState('2026-06-13');
  const [ret, setRet] = useState('2026-06-20');
  const [cabin, setCabin] = useState('Economy');
  const [entity, setEntity] = useState('OSPL');
  const [billClient, setBillClient] = useState(false);
  const [needHotel, setNeedHotel] = useState(true);
  const [needTransit, setNeedTransit] = useState(true);
  const [purpose, setPurpose] = useState('Client meeting');
  const [budget, setBudget] = useState(160000);
  const [submitted, setSubmitted] = useState(false);

  const t = travellers.find((x) => x.id === travellerId)!;

  if (submitted) {
    return (
      <>
        <div className="page-back"><Link className="btn btn--back btn--sm" href="/travel/requests"><Icon name="arrowLeft" size={15} strokeWidth={2.2} /> Back to Requests</Link></div>
        <div className="card" style={{ padding: 22, maxWidth: 720 }}>
          <div className="reco ok" style={{ marginTop: 0 }}>✓ Request <b>TRV-{Math.floor(64400 + travellers.indexOf(t))}</b> created for <b>{t.name}</b> ({origin}→{dest}). Policy checked; {intl ? 'visa flag raised. ' : ''}RFQ simulated to your selected vendors and the AI market benchmark search started.</div>
          <p className="sub-hint" style={{ marginTop: 14 }}>In the live system this would email the vendor RFQ (the §7-C.1 template), kick off the AI search, and land in the queue as <b>Sourcing</b>. For the prototype, open an existing request to see the comparison.</p>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <Link className="btn btn--primary btn--sm" href="/travel/requests/r1">Open a compared request →</Link>
            <button className="btn btn--ghost btn--sm" onClick={() => setSubmitted(false)}>Raise another</button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="page-back"><Link className="btn btn--back btn--sm" href="/travel/requests"><Icon name="arrowLeft" size={15} strokeWidth={2.2} /> Back to Requests</Link></div>

      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <div className="panel__title" style={{ marginBottom: 14 }}>New travel request</div>

        <h3 className="section-title" style={{ marginTop: 0 }}>Traveller</h3>
        <div className="form-grid">
          <div className="form-field"><label>Traveller</label>
            <select className="select" value={travellerId} onChange={(e) => setTravellerId(e.target.value)}>
              {travellers.map((x) => <option key={x.id} value={x.id}>{x.name} · {x.empNo}</option>)}
            </select>
          </div>
          <div className="form-field"><label>Service line / Project</label><input className="input" value={`${t.serviceLine} · ${t.project}`} readOnly /></div>
          <div className="form-field"><label>Grade / Home office</label><input className="input" value={`${t.grade} · ${t.homeOffice}`} readOnly /></div>
          <div className="form-field"><label>Frequent flyer</label><input className="input" defaultValue={t.frequentFlyer ?? ''} placeholder="e.g. EK ••••" /></div>
        </div>

        <h3 className="section-title">Trip</h3>
        <div className="form-grid">
          <div className="form-field"><label>Trip type</label><select className="select" value={tripType} onChange={(e) => setTripType(e.target.value)}><option>Round-trip</option><option>One-way</option><option>Multi-city</option></select></div>
          <div className="form-field"><label>Origin (IATA)</label><input className="input" value={origin} onChange={(e) => setOrigin(e.target.value.toUpperCase())} /></div>
          <div className="form-field"><label>Destination (IATA)</label><input className="input" value={dest} onChange={(e) => setDest(e.target.value.toUpperCase())} /></div>
          <div className="form-field"><label>Cabin</label><select className="select" value={cabin} onChange={(e) => setCabin(e.target.value)}><option>Economy</option><option>Premium Economy</option><option>Business</option><option>First</option></select></div>
          <div className="form-field"><label>Departure</label><input className="input" type="date" value={depart} onChange={(e) => setDepart(e.target.value)} /></div>
          <div className="form-field"><label>Return</label><input className="input" type="date" value={ret} onChange={(e) => setRet(e.target.value)} disabled={tripType === 'One-way'} /></div>
          <div className="form-field"><label>Purpose</label><input className="input" value={purpose} onChange={(e) => setPurpose(e.target.value)} /></div>
          <div className="form-field"><label>Scope</label><select className="select" value={intl ? 'Intl' : 'Dom'} onChange={(e) => setIntl(e.target.value === 'Intl')}><option value="Dom">Domestic</option><option value="Intl">International</option></select></div>
        </div>

        <h3 className="section-title">Billing &amp; needs</h3>
        <div className="form-grid">
          <div className="form-field"><label>Bill-to entity</label><select className="select" value={entity} onChange={(e) => setEntity(e.target.value)}><option>OSPL</option><option>OSSPL</option><option>OCSI</option></select></div>
          <div className="form-field"><label>Bill to client?</label><select className="select" value={billClient ? 'Y' : 'N'} onChange={(e) => setBillClient(e.target.value === 'Y')}><option value="N">No</option><option value="Y">Yes</option></select></div>
          <div className="form-field"><label>Budget cap (₹)</label><input className="input" type="number" value={budget} onChange={(e) => setBudget(+e.target.value)} /></div>
          <div className="form-field"><label>Add-ons</label>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', height: 38 }}>
              <label style={{ display: 'inline-flex', gap: 6, fontWeight: 500 }}><input type="checkbox" checked={needHotel} onChange={(e) => setNeedHotel(e.target.checked)} /> Hotel</label>
              <label style={{ display: 'inline-flex', gap: 6, fontWeight: 500 }}><input type="checkbox" checked={needTransit} onChange={(e) => setNeedTransit(e.target.checked)} /> Transit</label>
            </div>
          </div>
        </div>

        {/* policy / visa hints */}
        <div style={{ marginTop: 16, display: 'grid', gap: 8 }}>
          {cabin === 'Business' && <div className="warn-inline"><Icon name="alert" size={15} /> Business class needs <b>department-head approval</b> (policy).</div>}
          {intl && <div className="warn-inline" style={{ background: 'var(--info-tint)', color: 'var(--info)' }}><Icon name="info" size={15} /> International trip — <b>visa & passport check</b> will run (links to the Visa module); passport validity ≥ 6 months required.</div>}
          <div className="sub-hint"><Icon name="info" size={13} /> On submit, OASIS runs the policy check, emails the vendor RFQ (§7-C.1 template), and starts the AI market-benchmark search.</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn--primary" onClick={() => setSubmitted(true)}>Create request &amp; send RFQ <Icon name="chevronRight" size={16} strokeWidth={2.2} /></button>
        <Link className="btn btn--back" href="/travel/requests"><Icon name="arrowLeft" size={16} strokeWidth={2.2} /> Cancel</Link>
      </div>
    </>
  );
}
