'use client';

import './invoicing.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, type IconName } from '@/components/ui/Icon';
import { billingBatches, billingLines } from '@/lib/invoicing/mockData';

const SUBNAV: { href: string; label: string; icon: IconName }[] = [
  { href: '/invoicing', label: 'Overview', icon: 'dashboard' },
  { href: '/invoicing/upload', label: 'Upload', icon: 'plus' },
  { href: '/invoicing/batches', label: 'Billing Batches', icon: 'invoicing' },
  { href: '/invoicing/reconciliation', label: 'Reconciliation', icon: 'check' },
  { href: '/invoicing/notifications', label: 'Notifications', icon: 'bell' },
  { href: '/invoicing/search', label: 'Search', icon: 'search' },
  { href: '/invoicing/vendors', label: 'Vendors', icon: 'vendors' },
  { href: '/invoicing/config', label: 'Configuration', icon: 'settings' },
  { href: '/invoicing/reports', label: 'Reports', icon: 'analytics' },
];

export default function InvoicingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === '/invoicing' ? pathname === '/invoicing' : pathname.startsWith(href));

  // At-a-glance attention counts surfaced as badges on the relevant tabs.
  const badges: Record<string, number> = {
    '/invoicing/batches': billingBatches.filter((b) => b.status === 'Pending Approval').length,
    '/invoicing/reconciliation': billingBatches.filter((b) => b.status === 'Reconciliation Open').length,
    '/invoicing/notifications': billingLines.filter((l) => l.paymentStatus === 'Paid' && l.notificationStatus !== 'Sent').length,
  };

  return (
    <div className="container">
      <div className="crumbs">
        <Link href="/">Home</Link>
        <Icon name="chevronRight" size={14} strokeWidth={2} />
        <span style={{ color: 'var(--text)' }}>Invoicing</span>
      </div>

      <div className="page-head">
        <div>
          <h1 className="page-title">Invoice &amp; Payment Intelligence</h1>
          <p className="page-sub">Upload invoices, build billing batches, reconcile payments, and notify vendors.</p>
        </div>
      </div>

      <nav className="inv-subnav" aria-label="Invoicing sections">
        {SUBNAV.map((item) => {
          const active = isActive(item.href);
          const badge = badges[item.href];
          return (
            <Link key={item.href} href={item.href} className={active ? 'active' : ''} aria-current={active ? 'page' : undefined} title={item.label}>
              <Icon name={item.icon} size={17} />
              <span>{item.label}</span>
              {badge ? <span className="inv-tab__badge" aria-label={`${badge} need attention`}>{badge}</span> : null}
            </Link>
          );
        })}
      </nav>

      {children}
    </div>
  );
}
