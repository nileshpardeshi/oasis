'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { alerts as seedAlerts, trips, inr } from '@/lib/travel/mockData';
import { StatCards } from '@/components/travel/ui';

const KIND_ICON = { 'fare-drop': 'arrowDown', 'schedule': 'bell', 'risk': 'alert' } as const;
const SEV_TINT = { success: 'tint-green', warning: 'tint-orange', info: 'tint-info' } as const;

export default function MonitoringPage() {
  const [list, setList] = useState(seedAlerts);
  const [done, setDone] = useState<Set<string>>(new Set());
  const watched = trips.filter((t) => t.fareWatch);
  const totalSaving = list.filter((a) => !done.has(a.id)).reduce((s, a) => s + (a.netSaving ?? 0), 0);

  return (
    <>
      <StatCards stats={[
        { icon: 'bell', tint: 'tint-blue', value: watched.length, label: 'Trips on fare-watch' },
        { icon: 'arrowDown', tint: 'tint-green', value: inr(totalSaving), label: 'Rebooking savings available', small: true, accent: true },
        { icon: 'alert', tint: 'tint-orange', value: list.filter((a) => a.kind === 'schedule' && !done.has(a.id)).length, label: 'Schedule changes' },
        { icon: 'check', tint: 'tint-info', value: done.size, label: 'Actioned' },
      ]} />

      <h3 className="section-title">Live alerts</h3>
      <div style={{ display: 'grid', gap: 12, marginBottom: 22 }}>
        {list.map((a) => {
          const isDone = done.has(a.id);
          return (
            <div key={a.id} className="card" style={{ padding: 16, opacity: isDone ? 0.6 : 1 }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div className={'act__icon ' + SEV_TINT[a.severity]}><Icon name={KIND_ICON[a.kind]} size={18} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <b style={{ fontSize: 14 }}>{a.message}</b>
                    <span className="tv-pill tv-vendor">{a.tripCode}</span>
                    {a.netSaving ? <span className="tv-pill tv-paid">net +{inr(a.netSaving)}</span> : null}
                  </div>
                  <div className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>{a.routeLabel} · {a.traveller} · {a.raisedAt}</div>
                  {a.detail && <div style={{ fontSize: 12.5, marginTop: 6 }}>{a.detail}</div>}
                </div>
                <div className="row-actions" style={{ flexShrink: 0 }}>
                  {!isDone && a.kind === 'fare-drop' && (a.netSaving ?? 0) > 0 && (
                    <button className="btn btn--primary btn--sm" onClick={() => alert('Mock: start rebooking with the vendor (HITL) — net saving ' + inr(a.netSaving!))}>Start rebooking</button>
                  )}
                  <button className="btn btn--ghost btn--sm" onClick={() => setDone((p) => new Set(p).add(a.id))} disabled={isDone}>{isDone ? 'Actioned' : 'Mark actioned'}</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <h3 className="section-title">Watched trips</h3>
      <div className="table-card">
        <table className="data-table">
          <thead><tr><th>Trip</th><th>Traveller</th><th>Route</th><th>Depart</th><th className="num">Booked fare</th><th>Watch window</th></tr></thead>
          <tbody>
            {watched.map((t) => (
              <tr key={t.id}><td className="mono">{t.code}</td><td>{t.traveller}</td><td>{t.routeLabel}</td><td>{t.departDate}</td><td className="num">{inr(t.fare)}</td><td className="muted">booking → 2 days pre-departure</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="sub-hint" style={{ marginTop: 12 }}><Icon name="info" size={13} /> Fare-watch runs from booking day until 2 days before departure (configurable); rebooking is recommended only when <b>net of change penalties</b> is positive. Schedule/PNR tracking is daily, then hourly on the day of travel.</p>
    </>
  );
}
