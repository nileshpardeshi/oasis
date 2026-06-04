'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { getRequest, allOptions, median, verdict, inr, fmtDur } from '@/lib/travel/mockData';
import { StatCards, StatusBadge, VerdictBadge, PolicyBadge, SourceTag } from '@/components/travel/ui';
import type { QuoteOption } from '@/lib/travel/types';

type Lens = 'value' | 'price' | 'time' | 'policy';

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const r = getRequest(id);
  const [lens, setLens] = useState<Lens>('value');
  const [selId, setSelId] = useState<string | undefined>(r?.recommendedOptionId);
  const [decision, setDecision] = useState<'none' | 'recommended' | 'approved'>('none');

  if (!r) {
    return <div className="empty"><div className="empty__icon"><Icon name="travel" size={36} /></div><h2>Request not found</h2><p><Link className="btn btn--back btn--sm" href="/travel/requests"><Icon name="arrowLeft" size={15} strokeWidth={2.2} /> Back to Requests</Link></p></div>;
  }

  const opts = allOptions(r);
  const back = <div className="page-back"><Link className="btn btn--back btn--sm" href="/travel/requests"><Icon name="arrowLeft" size={15} strokeWidth={2.2} /> Back to Requests</Link></div>;

  const header = (
    <>
      <div className="tv-toolbar" style={{ alignItems: 'center' }}>
        <h3 className="section-title" style={{ margin: 0 }}>{r.code}</h3>
        <StatusBadge status={r.status} />
        <span className="muted" style={{ fontSize: 13 }}>{r.originCity} ({r.originCode}) → {r.destCity} ({r.destCode}) · {r.tripType}</span>
      </div>
      <StatCards stats={[
        { icon: 'travel', tint: 'tint-blue', value: `${r.originCode}→${r.destCode}`, label: r.international ? 'International' : 'Domestic', small: true },
        { icon: 'helpdesk', tint: 'tint-info', value: r.traveller.name, label: `${r.traveller.grade} · ${r.traveller.serviceLine}`, small: true },
        { icon: 'events', tint: 'tint-orange', value: `${r.departDate}${r.returnDate ? ' → ' + r.returnDate : ''}`, label: `${r.cabin} · ${r.entity}`, small: true },
        { icon: 'analytics', tint: 'tint-green', value: r.budget ? inr(r.budget) : '—', label: 'Budget cap', small: true },
      ]} />
    </>
  );

  // No normalised options yet → awaiting state
  if (opts.length === 0) {
    return (
      <>
        {back}{header}
        <div className="card" style={{ padding: 18, marginBottom: 16 }}>
          <div className="panel__title" style={{ marginBottom: 10 }}>Sourcing — awaiting quotes &amp; benchmark</div>
          <div className="table-card">
            <table className="data-table">
              <thead><tr><th>Vendor</th><th>Status</th><th>Received</th><th className="num">Turnaround</th></tr></thead>
              <tbody>
                {r.vendorQuotes.map((v) => (
                  <tr key={v.id}><td>{v.vendorName}</td><td><span className={'tv-pill ' + (v.status === 'Received' ? 'tv-paid' : 'tv-warn')}>{v.status}</span></td><td>{v.receivedAt ?? '—'}</td><td className="num">{v.turnaroundHrs ? v.turnaroundHrs + 'h' : '—'}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="sub-hint" style={{ marginTop: 12 }}><Icon name="assistant" size={14} /> The AI market-benchmark search runs in parallel; quotes are auto-normalised on arrival, then the comparison opens here.</p>
        </div>
      </>
    );
  }

  // ---- comparison math ----
  const fares = opts.map((o) => o.fare);
  const med = median(fares);
  const lo = Math.min(...fares);
  const hi = Math.max(...fares);
  const span = Math.max(1, hi - lo);
  const pct = (f: number) => Math.min(100, Math.max(0, ((f - lo) / span) * 100));

  const inPolicyOpts = opts.filter((o) => o.inPolicy);
  const cheapest = opts.reduce((a, b) => (b.fare < a.fare ? b : a));
  const cheapestInPolicy = (inPolicyOpts.length ? inPolicyOpts : opts).reduce((a, b) => (b.fare < a.fare ? b : a));
  const fastest = opts.reduce((a, b) => (b.totalDurationMin < a.totalDurationMin ? b : a));
  const bestValue = opts.reduce((a, b) => (b.score > a.score ? b : a));
  const benchMin = Math.min(...(r.benchmark.length ? r.benchmark.map((b) => b.fare) : [med]));

  const tagsFor = (o: QuoteOption) => {
    const t: string[] = [];
    if (o.id === cheapest.id) t.push('Cheapest');
    if (o.id === fastest.id) t.push('Fastest');
    if (o.id === bestValue.id) t.push('Best value');
    return t;
  };

  const sorted = [...opts].sort((a, b) => {
    if (lens === 'price') return a.fare - b.fare;
    if (lens === 'time') return a.totalDurationMin - b.totalDurationMin;
    if (lens === 'policy') return Number(b.inPolicy) - Number(a.inPolicy) || a.fare - b.fare;
    return b.score - a.score; // value
  });

  const sel = opts.find((o) => o.id === selId) ?? sorted[0];
  const recommended = opts.find((o) => o.id === r.recommendedOptionId);
  const negotiate = (o: QuoteOption) => {
    const delta = o.fare - benchMin;
    alert(
      `Draft to ${o.sourceName}:\n\n` +
      `Re: ${r.code} ${r.originCode}–${r.destCode} (${o.airline}, ${r.cabin}).\n` +
      `Your quote ₹${o.fare.toLocaleString('en-IN')}. Our market benchmark for the same itinerary is ₹${benchMin.toLocaleString('en-IN')} ` +
      `(${delta > 0 ? '−₹' + delta.toLocaleString('en-IN') : 'in line'}). Can you match or better this? Please revert by EOD.`,
    );
  };

  return (
    <>
      {back}{header}

      {/* Verdict hero + market range */}
      <div className="cmp-hero">
        <div className="card" style={{ padding: 18 }}>
          <div className="panel__title" style={{ marginBottom: 6 }}><Icon name="assistant" size={16} /> Market benchmark verdict</div>
          <div className="verdict-hero">
            <b>{inr(cheapestInPolicy.fare)}</b>
            <span className="muted">best in-policy ({cheapestInPolicy.airline}, {cheapestInPolicy.sourceName})</span>
          </div>
          <p className="sub-hint" style={{ marginTop: 8 }}>
            Market range <b>{inr(lo)}</b>–<b>{inr(hi)}</b>, median <b>{inr(med)}</b> across {opts.length} options.
            {recommended && <> Recommended vendor quote <b>{inr(recommended.fare)}</b> is <b style={{ color: recommended.fare > benchMin ? 'var(--danger)' : 'var(--success)' }}>{recommended.fare > benchMin ? `+₹${(recommended.fare - benchMin).toLocaleString('en-IN')}` : 'at/under'}</b> vs the AI benchmark ({inr(benchMin)}).</>}
          </p>
          <div className="market-bar">
            <div className="market-tick median" style={{ left: `${pct(med)}%` }}><span>median {inr(med)}</span></div>
            <div className="market-dot" style={{ left: `${pct(sel.fare)}%` }}><span>{sel.airline} {inr(sel.fare)}</span></div>
          </div>
          <div className="lens">
            {(['value', 'price', 'time', 'policy'] as Lens[]).map((l) => (
              <button key={l} className={lens === l ? 'active' : ''} onClick={() => setLens(l)}>
                {l === 'value' ? 'Best value' : l === 'price' ? 'Cheapest' : l === 'time' ? 'Fastest' : 'In policy'}
              </button>
            ))}
          </div>
        </div>

        {/* Selected option detail */}
        <div className="card" style={{ padding: 18 }}>
          <div className="panel__title" style={{ marginBottom: 8 }}>{sel.airline} · {sel.cabin} <SourceTag source={sel.source} name={sel.sourceName} /></div>
          <div className="seglist">
            {sel.segments.map((s, i) => (
              <div className="segrow" key={i}>
                <div><div className="leg">{s.dep} → {s.arr}{s.arrNextDay ? ' +1' : ''}</div><div className="muted" style={{ fontSize: 11 }}>{s.date}</div></div>
                <div><div className="leg">{s.fromCode} → {s.toCode}</div><div className="muted" style={{ fontSize: 11 }}>{s.flightNo} · {fmtDur(s.durationMin)} · {s.baggage}</div></div>
                <div className="muted" style={{ fontSize: 11 }}>{s.carrier.split(' — ')[0]}</div>
              </div>
            ))}
          </div>
          {sel.layovers.length > 0 && <div className="layover-note">Layover: {sel.layovers.join(' · ')}</div>}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 12, fontSize: 12.5 }}>
            <span><span className="muted">Fare</span> <b>{inr(sel.fare)}</b></span>
            <span><span className="muted">Refundable</span> <b>{sel.refundable ? 'Yes' : sel.refundableFare ? `+${inr(sel.refundableFare)}` : 'No'}</b></span>
            <span><span className="muted">Baggage</span> <b>{sel.baggage}</b></span>
            <span><span className="muted">Change</span> <b>{sel.changeRule}</b></span>
            <span><span className="muted">Cancel</span> <b>{sel.cancelRule}</b></span>
          </div>
        </div>
      </div>

      {/* Comparison grid */}
      <div className="table-card" style={{ overflowX: 'auto', marginBottom: 16 }}>
        <table className="data-table" style={{ minWidth: 980 }}>
          <thead>
            <tr><th>Source</th><th>Airline / route</th><th className="num">Duration</th><th>Bags</th><th>Refund</th><th className="num">Fare</th><th>vs median</th><th>Policy</th><th className="num">Score</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {sorted.map((o) => {
              const isRec = o.id === r.recommendedOptionId;
              const cls = o.id === r.recommendedOptionId ? 'cmp-row--rec' : o.source === 'benchmark' ? 'cmp-row--bench' : '';
              const diff = med ? Math.round(((o.fare - med) / med) * 100) : 0;
              return (
                <tr key={o.id} className={'row-link ' + cls} onClick={() => setSelId(o.id)}>
                  <td><SourceTag source={o.source} name={o.sourceName} /></td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{isRec && <Icon name="check" size={13} strokeWidth={2.4} />} {o.airline} {tagsFor(o).map((t) => <span key={t} className="tv-pill tv-info" style={{ marginLeft: 4, fontSize: 10 }}>{t}</span>)}</div>
                    <div className="opt-route"><span className="stop">{o.stops === 0 ? 'Non-stop' : `${o.stops} stop`}</span>{o.layovers.length ? ' · ' + o.layovers.join(', ') : ''}</div>
                  </td>
                  <td className="num">{fmtDur(o.totalDurationMin)}</td>
                  <td>{o.baggage}</td>
                  <td>{o.refundable ? 'Yes' : o.refundableFare ? '+₹' : 'No'}</td>
                  <td className="num"><b>{inr(o.fare)}</b></td>
                  <td><VerdictBadge verdict={verdict(o.fare, med)} /> <span className="muted" style={{ fontSize: 11 }}>{diff > 0 ? '+' : ''}{diff}%</span></td>
                  <td><PolicyBadge inPolicy={o.inPolicy} /></td>
                  <td className="num">{o.score}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="row-actions">
                      <button className="btn btn--ghost btn--icon" title="View detail" aria-label="View detail" onClick={() => setSelId(o.id)}><Icon name="eye" size={16} /></button>
                      {o.source === 'vendor' && <button className="btn btn--ghost btn--icon" title="Negotiate" aria-label="Negotiate" onClick={() => negotiate(o)}><Icon name="assistant" size={16} /></button>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Recommend / approve + assistant */}
      <div className="cards-2">
        <div className="card" style={{ padding: 18 }}>
          <div className="panel__title" style={{ marginBottom: 10 }}>Recommend &amp; approve</div>
          {decision === 'approved' ? (
            <div className="reco ok">✓ <b>{sel.airline}</b> ({inr(sel.fare)}, {sel.sourceName}) approved. Handed to the vendor to book (Phase 1 — OASIS records the PNR and starts fare-watch). Booking + support stay with the vendor.</div>
          ) : decision === 'recommended' ? (
            <>
              <div className="reco review">Sent for approval: <b>{sel.airline}</b> · {inr(sel.fare)} · {sel.sourceName}. Awaiting approver sign-off.</div>
              <button className="btn btn--success btn--sm" style={{ marginTop: 10 }} onClick={() => setDecision('approved')}><Icon name="check" size={15} strokeWidth={2.2} /> Approve &amp; hand to vendor</button>
            </>
          ) : (
            <>
              <p className="sub-hint" style={{ marginTop: 0 }}>Selected: <b>{sel.airline} · {inr(sel.fare)}</b> ({sel.sourceName}). {sel.inPolicy ? '' : 'Out-of-policy — justification required.'}</p>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button className="btn btn--primary btn--sm" onClick={() => setDecision('recommended')}><Icon name="check" size={15} strokeWidth={2.2} /> Recommend for approval</button>
                {sel.source === 'vendor' && <button className="btn btn--ghost btn--sm" onClick={() => negotiate(sel)}><Icon name="assistant" size={15} /> Negotiate</button>}
              </div>
            </>
          )}
        </div>
        <div className="assist">
          <h4><Icon name="info" size={16} /> How the benchmark works</h4>
          <p className="muted" style={{ fontSize: 12.5, margin: 0 }}>
            Vendor quotes are auto-normalised to one schema (segments, layovers, baggage, refundability, landed cost) and shown beside the
            <b> AI market benchmark</b> (TBO/Tripjack + Duffel + Amadeus). We report a <b>range + median</b> with a verdict — no single source is the
            absolute cheapest, so use it to <b>negotiate or pick the best vendor</b>. Phase 1 doesn't book — the chosen vendor fulfils &amp; supports.
          </p>
        </div>
      </div>
    </>
  );
}
