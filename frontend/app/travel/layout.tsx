'use client';

import './travel.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, type IconName } from '@/components/ui/Icon';
import { travelRequests, alerts } from '@/lib/travel/mockData';

const SUBNAV: { href: string; label: string; icon: IconName }[] = [
  { href: '/travel', label: 'Overview', icon: 'dashboard' },
  { href: '/travel/requests', label: 'Requests', icon: 'helpdesk' },
  { href: '/travel/trips', label: 'Trips', icon: 'travel' },
  { href: '/travel/monitoring', label: 'Monitoring', icon: 'bell' },
  { href: '/travel/vendors', label: 'Vendors', icon: 'vendors' },
  { href: '/travel/reports', label: 'Reports', icon: 'analytics' },
  { href: '/travel/config', label: 'Configuration', icon: 'settings' },
];

export default function TravelLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === '/travel' ? pathname === '/travel' : pathname.startsWith(href));

  // at-a-glance attention counts
  const actionable = travelRequests.filter((r) => ['Sourcing', 'Compared', 'Pending Approval'].includes(r.status)).length;
  const liveAlerts = alerts.filter((a) => a.severity !== 'info').length;
  const badges: Record<string, number> = {
    '/travel/requests': actionable,
    '/travel/monitoring': liveAlerts,
  };

  return (
    <div className="container">
      <div className="crumbs">
        <Link href="/">Home</Link>
        <Icon name="chevronRight" size={14} strokeWidth={2} />
        <span style={{ color: 'var(--text)' }}>Travel Desk</span>
      </div>

      <div className="page-head">
        <div>
          <h1 className="page-title">AI Travel Desk</h1>
          <p className="page-sub">Benchmark vendor quotes against the live market, compare apples-to-apples, and track every trip.</p>
        </div>
      </div>

      <nav className="tv-subnav" aria-label="Travel Desk sections">
        {SUBNAV.map((item) => {
          const active = isActive(item.href);
          const badge = badges[item.href];
          return (
            <Link key={item.href} href={item.href} className={active ? 'active' : ''} aria-current={active ? 'page' : undefined} title={item.label}>
              <Icon name={item.icon} size={17} />
              <span>{item.label}</span>
              {badge ? <span className="tv-tab__badge">{badge}</span> : null}
            </Link>
          );
        })}
      </nav>

      {children}
    </div>
  );
}
