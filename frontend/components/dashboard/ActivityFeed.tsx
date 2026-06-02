import * as React from 'react';
import { Icon, type IconName } from '@/components/ui/Icon';

interface Activity {
  icon: IconName;
  tint: string;
  text: React.ReactNode;
  time: string;
}

// NOTE: sample data — replaced by a live activity stream later.
const ACTIVITIES: Activity[] = [
  { icon: 'workspace', tint: 'tint-blue', text: <>Desk <b>D-104</b> booked by Priya S. — Pune / Floor 3</>, time: '5 minutes ago' },
  { icon: 'procurement', tint: 'tint-orange', text: <>Procurement <b>#PR-2041</b> raised — 10 × Laptops</>, time: '22 minutes ago' },
  { icon: 'check', tint: 'tint-green', text: <>Invoice <b>INV-7782</b> marked <b>Paid</b> — UTR matched</>, time: '1 hour ago' },
  { icon: 'info', tint: 'tint-red', text: <>AMC <b>Printer-AMC-2026</b> renewal due in 12 days</>, time: '2 hours ago' },
  { icon: 'travel', tint: 'tint-info', text: <>Travel request <b>TR-318</b> — Pune → Newark (US)</>, time: '3 hours ago' },
];

export default function ActivityFeed() {
  return (
    <div className="card">
      <div className="panel__head">
        <div className="panel__title">Recent activity</div>
        <span className="panel__link">View all</span>
      </div>
      <div className="panel__body">
        {ACTIVITIES.map((a, i) => (
          <div className="act" key={i}>
            <div className={'act__icon ' + a.tint}>
              <Icon name={a.icon} size={17} />
            </div>
            <div>
              <div className="act__text">{a.text}</div>
              <div className="act__time">{a.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
