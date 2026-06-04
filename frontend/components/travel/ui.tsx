// OASIS — Travel Desk shared presentational components (no hooks; usable anywhere).
import * as React from 'react';
import { Icon, type IconName } from '@/components/ui/Icon';
import { inr } from '@/lib/travel/mockData';
import type { RequestStatus, VendorQuoteStatus, FareVerdict } from '@/lib/travel/types';

const REQ_CLASS: Record<RequestStatus, string> = {
  'Draft': 'tv-unpaid',
  'Submitted': 'tv-unpaid',
  'Policy Checked': 'tv-info',
  'Sourcing': 'tv-process',
  'Compared': 'tv-info',
  'Pending Approval': 'tv-warn',
  'Approved': 'tv-paid',
  'Booked': 'tv-paid',
  'Closed': 'tv-unpaid',
  'Rejected': 'tv-hold',
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  return <span className={`tv-pill ${REQ_CLASS[status]}`}>{status}</span>;
}

const VQ_CLASS: Record<VendorQuoteStatus, string> = { 'Received': 'tv-paid', 'Awaiting': 'tv-warn', 'Late': 'tv-hold' };
export function QuoteStatusBadge({ status }: { status: VendorQuoteStatus }) {
  return <span className={`tv-pill ${VQ_CLASS[status]}`}>{status}</span>;
}

const VERDICT_CLASS: Record<FareVerdict, string> = { 'Good': 'tv-paid', 'Average': 'tv-warn', 'High': 'tv-hold' };
export function VerdictBadge({ verdict }: { verdict: FareVerdict }) {
  const icon: IconName = verdict === 'Good' ? 'arrowDown' : verdict === 'High' ? 'arrowUp' : 'info';
  return <span className={`tv-pill ${VERDICT_CLASS[verdict]}`}><Icon name={icon} size={12} strokeWidth={2.4} /> {verdict}</span>;
}

export function PolicyBadge({ inPolicy }: { inPolicy: boolean }) {
  return inPolicy
    ? <span className="tv-pill tv-paid">In policy</span>
    : <span className="tv-pill tv-hold">Out of policy</span>;
}

export function SourceTag({ source, name }: { source: 'vendor' | 'benchmark'; name: string }) {
  return source === 'benchmark'
    ? <span className="tv-pill tv-bench"><Icon name="assistant" size={12} /> {name}</span>
    : <span className="tv-pill tv-vendor">{name}</span>;
}

export function Money({ value }: { value?: number }) {
  return <span className="num">{value == null ? '—' : inr(value)}</span>;
}

// Polished summary strip (icon chip + value + label) — same look as the Invoicing module.
export interface Stat {
  icon: IconName;
  tint?: string;
  value: React.ReactNode;
  label: string;
  small?: boolean;
  accent?: boolean;
}

export function StatCards({ stats }: { stats: Stat[] }) {
  return (
    <div className="tv-stat-strip">
      {stats.map((s, i) => (
        <div className={'tv-stat-card' + (s.accent ? ' tv-stat-card--accent' : '')} key={i}>
          <div className={'tv-stat-card__icon ' + (s.tint ?? 'tint-blue')}><Icon name={s.icon} size={18} /></div>
          <div style={{ minWidth: 0 }}>
            <div className={'tv-stat-card__value' + (s.small ? ' is-sm' : '')} title={typeof s.value === 'string' ? s.value : undefined}>{s.value}</div>
            <div className="tv-stat-card__label">{s.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
