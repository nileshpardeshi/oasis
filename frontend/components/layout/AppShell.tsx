'use client';

import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import IntroSplash from './IntroSplash';

export default function AppShell({ children }: { children: React.ReactNode }) {
  // navOpen  -> mobile drawer open
  // collapsed -> desktop sidebar collapsed to an icon-only rail (persisted)
  const [navOpen, setNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try { if (localStorage.getItem('oasis-nav-collapsed') === '1') setCollapsed(true); } catch { /* ignore */ }
  }, []);

  const setCollapsedPersist = (next: boolean) => {
    setCollapsed(next);
    try { localStorage.setItem('oasis-nav-collapsed', next ? '1' : '0'); } catch { /* ignore */ }
  };

  // topbar button: mobile → open drawer; desktop → collapse to rail
  const toggle = () => {
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1024px)').matches) setNavOpen((o) => !o);
    else setCollapsedPersist(!collapsed);
  };

  const className = ['layout', navOpen ? 'nav-open' : '', collapsed ? 'nav-collapsed' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={className}>
      <IntroSplash />
      <Sidebar collapsed={collapsed} onCollapse={() => setCollapsedPersist(!collapsed)} onNavigate={() => setNavOpen(false)} />
      <div className="overlay" onClick={() => setNavOpen(false)} />
      <div className="main">
        <Topbar onToggle={toggle} />
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
