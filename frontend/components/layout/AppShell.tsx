'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import IntroSplash from './IntroSplash';

export default function AppShell({ children }: { children: React.ReactNode }) {
  // navOpen  -> mobile drawer open
  // collapsed -> desktop sidebar collapsed
  const [navOpen, setNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const toggle = () => {
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1024px)').matches) {
      setNavOpen((o) => !o);
    } else {
      setCollapsed((c) => !c);
    }
  };

  const className = ['layout', navOpen ? 'nav-open' : '', collapsed ? 'nav-collapsed' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={className}>
      <IntroSplash />
      <Sidebar onNavigate={() => setNavOpen(false)} />
      <div className="overlay" onClick={() => setNavOpen(false)} />
      <div className="main">
        <Topbar onToggle={toggle} />
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
