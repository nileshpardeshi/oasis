'use client';

import './workspace.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, type IconName } from '@/components/ui/Icon';
import { noShowAlerts, governanceFindings, currentUser } from '@/lib/workspace/mockData';

const ADMIN_ROLES = ['admin', 'super_admin', 'facility_manager'];
const SUBNAV: { href: string; label: string; icon: IconName; adminOnly?: boolean }[] = [
  { href: '/workspace', label: 'Overview', icon: 'dashboard' },
  { href: '/workspace/floor', label: 'Floor Plan', icon: 'map' },
  { href: '/workspace/booking', label: 'Booking', icon: 'seat' },
  { href: '/workspace/allocation', label: 'Allocation', icon: 'desk', adminOnly: true },
  { href: '/workspace/occupancy', label: 'Occupancy', icon: 'crosshair' },
  { href: '/workspace/search', label: 'Search', icon: 'search' },
  { href: '/workspace/rooms', label: 'Rooms', icon: 'meetingRoom' },
  { href: '/workspace/heatmap', label: 'Intelligence', icon: 'heatmap' },
  { href: '/workspace/masters', label: 'Masters', icon: 'building' },
  { href: '/workspace/governance', label: 'Admin', icon: 'shield' },
  { href: '/workspace/copilot', label: 'Copilot', icon: 'robot' },
];

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === '/workspace' ? pathname === '/workspace' : pathname.startsWith(href));

  const openNoShows = noShowAlerts.filter((a) => !a.resolved).length;
  const openFindings = governanceFindings.filter((f) => !f.resolved).length;
  const isAdmin = ADMIN_ROLES.includes(currentUser.role);
  const tabs = SUBNAV.filter((t) => !t.adminOnly || isAdmin);
  const badges: Record<string, number> = {
    '/workspace/occupancy': openNoShows,
    '/workspace/governance': openFindings,
  };

  return (
    <div className="container">
      <div className="crumbs">
        <Link href="/">Home</Link>
        <Icon name="chevronRight" size={14} strokeWidth={2} />
        <span style={{ color: 'var(--text)' }}>Workplace</span>
      </div>

      <div className="page-head">
        <div>
          <h1 className="page-title">Workplace Intelligence</h1>
          <p className="page-sub">Interactive floor plans, smart desk allocation & booking, occupancy intelligence and workspace analytics.</p>
        </div>
      </div>

      <nav className="ws-subnav" aria-label="Workplace sections">
        {tabs.map((item) => {
          const active = isActive(item.href);
          const badge = badges[item.href];
          return (
            <Link key={item.href} href={item.href} className={active ? 'active' : ''} aria-current={active ? 'page' : undefined} title={item.label}>
              <Icon name={item.icon} size={17} />
              <span>{item.label}</span>
              {badge ? <span className="ws-tab__badge">{badge}</span> : null}
            </Link>
          );
        })}
      </nav>

      {children}
    </div>
  );
}
