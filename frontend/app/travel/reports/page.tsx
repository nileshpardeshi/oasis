import { Icon, type IconName } from '@/components/ui/Icon';

const REPORTS: { name: string; desc: string; icon: IconName; tint: string }[] = [
  { name: 'Trip register', desc: 'All trips with route, fare, vendor, status, payment.', icon: 'travel', tint: 'tint-blue' },
  { name: 'Vendor scorecard', desc: 'Price index, response SLA, service rating, win rate.', icon: 'vendors', tint: 'tint-info' },
  { name: 'Route cost trends', desc: 'Avg fare by route over time; benchmark vs booked.', icon: 'analytics', tint: 'tint-orange' },
  { name: 'Realised savings', desc: 'Vendor-vs-benchmark + fare-drop + policy savings.', icon: 'arrowDown', tint: 'tint-green' },
  { name: 'Fare-drop savings', desc: 'Post-booking fare drops captured and rebooked.', icon: 'bell', tint: 'tint-green' },
  { name: 'Policy compliance', desc: 'In/out-of-policy rate, advance-booking compliance.', icon: 'check', tint: 'tint-blue' },
  { name: 'Schedule-disruption log', desc: 'Schedule changes detected & handled per trip.', icon: 'alert', tint: 'tint-orange' },
  { name: 'Payment schedule / ageing', desc: 'Advance/due/settled per booking (→ Invoicing).', icon: 'invoicing', tint: 'tint-info' },
  { name: 'Spend vs budget', desc: 'Travel spend by dept / cost-centre / entity.', icon: 'analytics', tint: 'tint-blue' },
  { name: 'CO₂ / ESG', desc: 'Carbon per trip; greener-option adoption.', icon: 'workspace', tint: 'tint-green' },
];

export default function ReportsPage() {
  return (
    <>
      <div className="grid-modules">
        {REPORTS.map((r) => (
          <div className="module" key={r.name}>
            <div className={'module__icon ' + r.tint}><Icon name={r.icon} size={20} /></div>
            <div className="module__title">{r.name}</div>
            <div className="module__desc">{r.desc}</div>
            <div className="module__open" onClick={() => alert('Mock: generate "' + r.name + '" (Excel / PDF)')} style={{ cursor: 'pointer' }}>Generate <Icon name="chevronRight" size={14} /></div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 18, marginTop: 18 }}>
        <div className="panel__title" style={{ marginBottom: 8 }}><Icon name="bell" size={16} /> Scheduled delivery</div>
        <p className="sub-hint" style={{ marginTop: 0 }}>Like the Invoicing module: select reports + a "last N days" window, set a daily / weekly / monthly schedule with recipients, and OASIS emails them automatically. <b>(Configuration lands with the backend phase.)</b></p>
      </div>
    </>
  );
}
