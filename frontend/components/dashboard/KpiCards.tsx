import { Icon, type IconName } from '@/components/ui/Icon';

type Delta = { dir: 'up' | 'down' | 'flat'; text: string };

interface Kpi {
  icon: IconName;
  tint: string;
  value: string;
  sub?: string;
  label: string;
  delta: Delta;
}

// NOTE: sample data — wired to live APIs in a later phase.
const KPIS: Kpi[] = [
  { icon: 'procurement', tint: 'tint-orange', value: '18', label: 'Open procurement requests', delta: { dir: 'up', text: '12%' } },
  { icon: 'workspace', tint: 'tint-blue', value: '264', sub: ' / 320', label: 'Desks booked today', delta: { dir: 'flat', text: '82%' } },
  { icon: 'invoicing', tint: 'tint-info', value: '42', label: 'Pending invoices', delta: { dir: 'down', text: '5%' } },
  { icon: 'travel', tint: 'tint-blue', value: '9', label: 'Upcoming trips (7 days)', delta: { dir: 'up', text: '3' } },
  { icon: 'events', tint: 'tint-red', value: '5', label: 'AMC renewals due (30 days)', delta: { dir: 'down', text: '' } },
];

function DeltaBadge({ delta }: { delta: Delta }) {
  if (delta.dir === 'flat') return <span className="kpi__delta flat">{delta.text}</span>;
  return (
    <span className={'kpi__delta ' + (delta.dir === 'up' ? 'up' : 'down')}>
      <Icon name={delta.dir === 'up' ? 'arrowUp' : 'arrowDown'} size={12} strokeWidth={2.4} />
      {delta.text}
    </span>
  );
}

export default function KpiCards() {
  return (
    <div className="grid-kpi">
      {KPIS.map((k) => (
        <div className="card kpi" key={k.label}>
          <div className="kpi__top">
            <div className={'kpi__icon ' + k.tint}>
              <Icon name={k.icon} size={21} />
            </div>
            <DeltaBadge delta={k.delta} />
          </div>
          <div className="kpi__value">
            {k.value}
            {k.sub ? <small>{k.sub}</small> : null}
          </div>
          <div className="kpi__label">{k.label}</div>
        </div>
      ))}
    </div>
  );
}
