// OASIS — lightweight chart components (pure SVG/CSS, no dependencies).
import * as React from 'react';
import type { ChartDatum } from '@/lib/invoicing/reports';

export const PALETTE = ['#064281', '#2f6cb0', '#0a5ba8', '#f7991f', '#16a34a', '#dc2626', '#7c9cc4', '#b7791f', '#0e7490', '#9333ea'];

export function DonutChart({ data, size = 188, thickness = 28 }: { data: ChartDatum[]; size?: number; thickness?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const cx = size / 2;
  let acc = 0;

  return (
    <div className="donut-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img">
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="#eef1f5" strokeWidth={thickness} />
        {data.map((d, i) => {
          const len = (d.value / total) * c;
          const seg = (
            <circle
              key={i} cx={cx} cy={cx} r={r} fill="none"
              stroke={d.color ?? PALETTE[i % PALETTE.length]} strokeWidth={thickness}
              strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-acc}
              transform={`rotate(-90 ${cx} ${cx})`} strokeLinecap="butt"
            />
          );
          acc += len;
          return seg;
        })}
        <text x={cx} y={cx - 4} textAnchor="middle" fontSize="22" fontWeight="800" fill="#1b2a41">{total}</text>
        <text x={cx} y={cx + 16} textAnchor="middle" fontSize="11" fill="#64748b">total</text>
      </svg>
      <div className="donut-legend">
        {data.map((d, i) => (
          <div className="legend-item" key={i}>
            <span className="legend-dot" style={{ background: d.color ?? PALETTE[i % PALETTE.length] }} />
            <span>{d.label}</span>
            <span className="legend-val">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RankBars({ data, format }: { data: ChartDatum[]; format?: (n: number) => string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const fmt = format ?? ((n: number) => n.toLocaleString('en-IN'));
  return (
    <div className="rankbars">
      {data.map((d, i) => (
        <div className="rb-row" key={i}>
          <div className="rb-label" title={d.label}>{d.label}</div>
          <div className="rb-track"><span className="rb-bar" style={{ width: `${(d.value / max) * 100}%`, background: d.color ?? PALETTE[i % PALETTE.length] }} /></div>
          <div className="rb-val">{fmt(d.value)}</div>
        </div>
      ))}
    </div>
  );
}

export function BarChartV({ data, suffix = '' }: { data: ChartDatum[]; suffix?: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="chart">
      {data.map((d, i) => (
        <div className="bar-col" key={i}>
          <div className="bar" style={{ height: `${Math.max(4, (d.value / max) * 100)}%`, background: d.color ? d.color : undefined }}>
            <span className="bar__val">{d.value}{suffix}</span>
          </div>
          <span className="bar-label">{d.label}</span>
        </div>
      ))}
    </div>
  );
}
