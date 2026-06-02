interface Bar {
  label: string;
  val: number;
  accent?: boolean;
}

// NOTE: sample data — replaced by live workspace-utilisation metrics later.
const BARS: Bar[] = [
  { label: 'Cloud', val: 72 },
  { label: 'Data', val: 88 },
  { label: 'QA', val: 54 },
  { label: 'ERP', val: 94, accent: true },
  { label: 'Digital', val: 66 },
  { label: 'Security', val: 41 },
];

export default function UtilizationChart() {
  return (
    <div className="card">
      <div className="panel__head">
        <div className="panel__title">
          Workspace utilisation — by service line <span className="tag">Sample</span>
        </div>
        <span className="panel__link">This week ▾</span>
      </div>
      <div className="panel__body">
        <div className="chart">
          {BARS.map((b) => (
            <div className="bar-col" key={b.label}>
              <div className={'bar' + (b.accent ? ' accent' : '')} style={{ height: `${b.val}%` }}>
                <span className="bar__val">{b.val}%</span>
              </div>
              <span className="bar-label">{b.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
