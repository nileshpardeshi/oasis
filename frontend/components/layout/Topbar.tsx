'use client';

import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';

interface TopbarProps {
  onToggle: () => void;
}

export default function Topbar({ onToggle }: TopbarProps) {
  return (
    <header className="topbar">
      <button className="icon-btn" onClick={onToggle} aria-label="Toggle menu" type="button">
        <Icon name="menu" strokeWidth={2} />
      </button>

      <Link className="topbar__logo" href="/" aria-label="OASIS home">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="OASIS — Opus Administration & Service Intelligence Suite" />
      </Link>

      <div className="search">
        <Icon name="search" size={18} strokeWidth={2} />
        <input type="text" placeholder="Search OASIS — requests, invoices, vendors, desks…" />
        <span className="kbd">Ctrl K</span>
      </div>

      <div className="topbar__spacer" />

      <div className="topbar__actions">
        <button className="btn btn--accent" type="button">
          <Icon name="plus" size={17} strokeWidth={2} />
          New Request
        </button>
        <button className="icon-btn dot-badge" aria-label="Notifications" type="button">
          <Icon name="bell" />
        </button>
        <button className="icon-btn" aria-label="Help" type="button">
          <Icon name="help" />
        </button>
        <div className="user">
          <div className="avatar">AS</div>
          <div className="user__meta">
            <span className="user__name">Admin User</span>
            <span className="user__role">Admin Officer · Pune</span>
          </div>
          <Icon name="chevronDown" size={16} strokeWidth={2} />
        </div>
      </div>
    </header>
  );
}
