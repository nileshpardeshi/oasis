'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navSections } from '@/lib/navigation';
import { Icon } from '@/components/ui/Icon';

interface SidebarProps {
  onNavigate?: () => void;
  collapsed?: boolean;
  onCollapse?: () => void;
}

export default function Sidebar({ onNavigate, collapsed = false, onCollapse }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/');

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <Link href="/" className="sidebar__logo-wrap" onClick={onNavigate} aria-label="OASIS home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="sidebar__logo" src="/oasis-logo.png" alt="OASIS — Opus Administration & Service Intelligence Suite" />
          <span className="sidebar__mark" aria-hidden>O</span>
        </Link>
      </div>

      <nav className="nav">
        {navSections.map((section) => (
          <div className="nav__group" key={section.heading}>
            <div className="nav__section">{section.heading}</div>
            {section.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={'nav__item' + (isActive(item.href) ? ' active' : '')}
                onClick={onNavigate}
                title={collapsed ? item.label : undefined}
              >
                <Icon name={item.icon} size={19} />
                <span className="nav__label">{item.label}</span>
                {item.badge ? <span className="badge">{item.badge}</span> : null}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <button
        type="button"
        className="sidebar__collapse"
        onClick={onCollapse}
        title={collapsed ? 'Expand menu' : 'Collapse menu'}
        aria-label={collapsed ? 'Expand menu' : 'Collapse menu'}
        aria-expanded={!collapsed}
      >
        <Icon name={collapsed ? 'chevronRight' : 'arrowLeft'} size={18} strokeWidth={2.2} />
        <span className="nav__label">Collapse</span>
      </button>

      <div className="sidebar__footer">
        <span>OASIS v0.1</span>
        <span className="pill-env">PROTOTYPE</span>
      </div>
    </aside>
  );
}
