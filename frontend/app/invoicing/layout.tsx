'use client';

import './invoicing.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, type IconName } from '@/components/ui/Icon';

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

      <nav className="inv-subnav">
        {SUBNAV.map((item) => (
          <Link key={item.href} href={item.href} className={isActive(item.href) ? 'active' : ''}>
            <Icon name={item.icon} size={16} />
            {item.label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  );
}
