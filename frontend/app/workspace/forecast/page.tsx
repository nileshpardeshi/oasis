'use client';

import { Icon } from '@/components/ui/Icon';
import { StatCards, ConfidenceChip } from '@/components/workspace/ui';
import { forecast } from '@/lib/workspace/mockData';

export default function ForecastPage() {
  const peak = forecast.reduce((a, b) => (b.predictedOccupancy > a.predictedOccupancy ? b : a));
  const low = forecast.reduce((a, b) => (b.predictedOccupancy < a.predictedOccupancy ? b : a));
  const avg = Math.round(forecast.reduce((s, f) => s + f.predictedOccupancy, 0) / forecast.length);
  const max = Math.max(...forecast.map((f) => f.predictedOccupancy));

  return (
    <>
      <StatCards stats={[
        { icon: 'forecast', tint: 'tint-blue', value: `${avg}%`, label: 'Avg predicted occupancy (next week)' },
        { icon: 'crosshair', tint: 'tint-red', value: `${peak.predictedOccupancy}%`, label: `Peak — ${peak.scopeLabel}` },
        { icon: 'check', tint: 'tint-green', value: `${low.predictedOccupancy}%`, label: `Lowest — ${low.scopeLabel}` },
        { icon: 'alert', tint: 'tint-orange', value: forecast.filter((f) => f.predictedOccupancy > 85).length, label: 'Days over 85% (capacity risk)' },
      ]} />

      <div className="table-card" style={{ padding: 20 }}>
        <div className="section-title" style={{ marginTop: 0 }}>Predicted occupancy — next 5 working days</div>
        <div className="ws-bars">
          {forecast.map((f) => (
            <div className="ws-bar-col" key={f.date}>
              <div className="ws-bar" style={{ height: `${(f.predictedOccupancy / max) * 100}%`, background: f.predictedOccupancy > 85 ? 'linear-gradient(180deg,#f87171,#dc2626)' : f.predictedOccupancy > 60 ? 'linear-gradient(180deg,#ffb858,#f7991f)' : 'linear-gradient(180deg,#86efac,#16a34a)' }}>
                <div className="ws-bar__val">{f.predictedOccupancy}%</div>
              </div>
              <div className="ws-bar-label">{f.scopeLabel.split(' · ')[0]}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="table-card" style={{ marginTop: 16 }}>
        <table className="data-table">
          <thead><tr><th>Day</th><th>Scope</th><th className="num">Predicted</th><th className="num">Capacity</th><th>Confidence</th></tr></thead>
          <tbody>
            {forecast.map((f) => (
              <tr key={f.date}><td>{f.date}</td><td>{f.scopeLabel}</td><td className="num">{f.predictedOccupancy}%</td><td className="num">{f.capacity}</td><td><ConfidenceChip confidence={f.confidence} /></td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="sub-hint" style={{ marginTop: 14 }}><Icon name="robot" size={13} /> Forecast is model-generated (ARIMA/Prophet-class) from historical occupancy + calendar signals. Used for capacity planning, not attendance enforcement.</p>
    </>
  );
}
