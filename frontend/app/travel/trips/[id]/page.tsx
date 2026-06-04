'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { getTrip, getTripPack, inr } from '@/lib/travel/mockData';
import { StatCards } from '@/components/travel/ui';
import type { PackItemKind } from '@/lib/travel/types';

const KIND_CLASS: Record<PackItemKind, string> = { flight: 'tv-info', transfer: 'tv-process', hotel: 'tv-vendor', meeting: 'tv-warn', note: 'tv-unpaid' };

export default function TripPackPage() {
  const { id } = useParams<{ id: string }>();
  const trip = getTrip(id);
  const pack = getTripPack(id);

  if (!trip) {
    return <div className="empty"><div className="empty__icon"><Icon name="travel" size={36} /></div><h2>Trip not found</h2><p><Link className="btn btn--back btn--sm" href="/travel/trips"><Icon name="arrowLeft" size={15} strokeWidth={2.2} /> Back to Trips</Link></p></div>;
  }

  const back = <div className="page-back"><Link className="btn btn--back btn--sm" href="/travel/trips"><Icon name="arrowLeft" size={15} strokeWidth={2.2} /> Back to Trips</Link></div>;
  const header = (
    <>
      <div className="tv-toolbar" style={{ alignItems: 'center' }}>
        <h3 className="section-title" style={{ margin: 0 }}>{trip.code}</h3>
        <span className="tv-pill tv-info">{trip.status}</span>
        <span className="muted" style={{ fontSize: 13 }}>{trip.routeLabel} · {trip.airline} · {trip.traveller}</span>
        <div className="spacer" />
        <button className="btn btn--ghost btn--sm" onClick={() => alert('Mock: download Trip Pack PDF')}><Icon name="download" size={15} /> PDF</button>
        <button className="btn btn--ghost btn--sm" onClick={() => alert('Mock: add flights/hotel/meetings to calendar (.ics)')}><Icon name="events" size={15} /> Add to calendar</button>
        <button className="btn btn--ghost btn--sm" onClick={() => alert('Mock: send pack to WhatsApp / Teams')}><Icon name="bell" size={15} /> Send</button>
      </div>
      <StatCards stats={[
        { icon: 'travel', tint: 'tint-blue', value: trip.pnr, label: `PNR · ${trip.airline}`, small: true },
        { icon: 'events', tint: 'tint-orange', value: `${trip.departDate}${trip.returnDate ? ' → ' + trip.returnDate : ''}`, label: 'Travel dates', small: true },
        { icon: 'analytics', tint: 'tint-green', value: inr(trip.fare), label: 'Fare', small: true },
        { icon: 'vendors', tint: 'tint-info', value: trip.vendorName, label: `${trip.entity} · ${trip.paymentStatus}`, small: true },
      ]} />
    </>
  );

  if (!pack) {
    return (
      <>
        {back}{header}
        <div className="card" style={{ padding: 20 }}>
          <div className="reco review" style={{ marginTop: 0 }}>The <b>AI Trip Pack</b> assembles automatically once a trip is ticketed (and is richest for international trips).</div>
          <p className="sub-hint" style={{ marginTop: 12 }}><Icon name="info" size={13} /> Open <Link className="panel__link" href="/travel/trips/tr-sfo">TRP-64393 (HYD→SFO)</Link> to see a complete pack — day-by-day timeline, weather, local transport, emergency info and documents.</p>
        </div>
      </>
    );
  }

  return (
    <>
      {back}{header}

      {pack.conflicts.length > 0 && (
        <div className="warn-inline" style={{ marginBottom: 16 }}><Icon name="alert" size={15} /> {pack.conflicts[0]}</div>
      )}

      <div className="cmp-hero" style={{ gridTemplateColumns: '1.3fr 1fr' }}>
        {/* Day-by-day timeline */}
        <div className="card" style={{ padding: 18 }}>
          <div className="panel__title" style={{ marginBottom: 12 }}><Icon name="events" size={16} /> Day-by-day itinerary</div>
          <div className="tl">
            {pack.days.map((d) => (
              <div key={d.date}>
                <div style={{ fontWeight: 700, margin: '2px 0 10px' }}>{d.label} <span className="muted" style={{ fontWeight: 400, fontSize: 12 }}>· {d.date}</span></div>
                {d.items.map((it, i) => (
                  <div className="tl__item" key={i}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
                      {it.time && <b className="mono" style={{ fontSize: 12.5 }}>{it.time}</b>}
                      <span style={{ fontWeight: 600 }}>{it.title}</span>
                      <span className={'tv-pill ' + KIND_CLASS[it.kind]} style={{ fontSize: 10 }}>{it.kind}</span>
                    </div>
                    {it.sub && <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{it.sub}</div>}
                    {it.warn && <div className="warn-inline" style={{ marginTop: 6 }}><Icon name="alert" size={14} /> {it.warn}</div>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Hotel + weather */}
        <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
          {pack.hotel && (
            <div className="card" style={{ padding: 16 }}>
              <div className="panel__title" style={{ marginBottom: 8 }}><Icon name="administration" size={16} /> Hotel</div>
              <div style={{ fontWeight: 700 }}>{pack.hotel.name}</div>
              <div className="muted" style={{ fontSize: 12.5 }}>{pack.hotel.address}</div>
              <div style={{ fontSize: 12.5, marginTop: 8 }}><span className="muted">Check-in</span> <b>{pack.hotel.checkIn}</b> · <span className="muted">Check-out</span> <b>{pack.hotel.checkOut}</b></div>
            </div>
          )}
          <div className="card" style={{ padding: 16 }}>
            <div className="panel__title" style={{ marginBottom: 10 }}><Icon name="info" size={16} /> Weather</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {pack.weather.map((w) => (
                <div key={w.day} style={{ textAlign: 'center', minWidth: 72, background: 'var(--bg)', borderRadius: 10, padding: '8px 10px' }}>
                  <div style={{ fontSize: 11.5, fontWeight: 600 }}>{w.day}</div>
                  <div style={{ fontSize: 16, fontWeight: 800 }}>{w.hi}°<span className="muted" style={{ fontSize: 12, fontWeight: 600 }}>/{w.lo}°</span></div>
                  <div className="muted" style={{ fontSize: 10.5 }}>{w.cond}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Pack panels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 16, marginTop: 16 }}>
        <div className="card" style={{ padding: 16 }}>
          <div className="panel__title" style={{ marginBottom: 8 }}><Icon name="procurement" size={16} /> Local transport</div>
          <table className="data-table"><tbody>
            {pack.transport.map((t, i) => (
              <tr key={i}><td>{t.leg}</td><td>{t.mode}</td><td className="num">{t.eta}</td><td className="num">{t.cost}</td></tr>
            ))}
          </tbody></table>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div className="panel__title" style={{ marginBottom: 8 }}><Icon name="alert" size={16} /> Safety &amp; emergency</div>
          {pack.emergency.map((e) => (
            <div key={e.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 12.5 }}>
              <span className="muted">{e.label}</span><b style={{ textAlign: 'right' }}>{e.value}</b>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div className="panel__title" style={{ marginBottom: 8 }}><Icon name="info" size={16} /> Destination basics</div>
          {pack.basics.map((b) => (
            <div key={b.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 12.5 }}>
              <span className="muted">{b.label}</span><b style={{ textAlign: 'right' }}>{b.value}</b>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div className="panel__title" style={{ marginBottom: 8 }}><Icon name="invoicing" size={16} /> Documents</div>
          {pack.documents.map((d) => (
            <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 12.5 }}>
              <span>{d.name}</span><span className="tv-pill tv-paid">{d.status}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="sub-hint" style={{ marginTop: 14 }}><Icon name="assistant" size={13} /> The pack is AI-assembled and <b>kept live</b> — if Monitoring detects a schedule change or rebooking, it regenerates and re-notifies the traveller (PDF / calendar / WhatsApp).</p>
    </>
  );
}
