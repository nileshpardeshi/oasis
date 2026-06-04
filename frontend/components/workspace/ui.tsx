// OASIS — Workplace shared presentational components (no hooks; usable in server & client trees).
import * as React from 'react';
import { Icon, type IconName } from '@/components/ui/Icon';
import { inr } from '@/lib/workspace/mockData';
import type {
  DeskState, DeskType, DeskKind, BookingStatus, SpaceStatus, HeatLevel, PriorityLevel, MeetingRoomStatus,
  VisitorStatus, GovernanceSeverity, AgentSuggestion, AgentRunStatus, Integration,
} from '@/lib/workspace/types';

const cap = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export function Pill({ tone, children }: { tone: string; children: React.ReactNode }) {
  return <span className={`ws-pill ${tone}`}>{children}</span>;
}

const DESK_STATE_TONE: Record<DeskState, string> = { available: 'ws-ok', allocated: 'ws-info', blocked: 'ws-muted', maintenance: 'ws-warn', decommissioned: 'ws-muted' };
export const DeskStateBadge = ({ state }: { state: DeskState }) => <Pill tone={DESK_STATE_TONE[state]}>{cap(state)}</Pill>;

const BOOKING_TONE: Record<BookingStatus, string> = { held: 'ws-warn', booked: 'ws-booked', checked_in: 'ws-info', completed: 'ws-ok', cancelled: 'ws-muted', no_show: 'ws-noshow', expired: 'ws-muted' };
export const BookingStatusBadge = ({ status }: { status: BookingStatus }) => <Pill tone={BOOKING_TONE[status]}>{cap(status)}</Pill>;

export const DeskTypeBadge = ({ type }: { type: DeskType }) => <Pill tone={type === 'fixed' ? 'ws-info' : 'ws-muted'}>{cap(type)}</Pill>;

const DESK_KIND_TONE: Record<DeskKind, string> = { workstation: 'ws-info', cubicle: 'ws-booked', cabin: 'ws-warn' };
const DESK_KIND_LABEL: Record<DeskKind, string> = { workstation: 'Workstation', cubicle: 'Cubicle', cabin: 'Cabin' };
export const DeskKindBadge = ({ kind }: { kind?: DeskKind }) => (kind ? <Pill tone={DESK_KIND_TONE[kind]}>{DESK_KIND_LABEL[kind]}</Pill> : <span className="muted">—</span>);
export const VacancyBadge = ({ vacant }: { vacant: boolean }) => <Pill tone={vacant ? 'ws-ok' : 'ws-muted'}>{vacant ? 'Vacant' : 'Occupied'}</Pill>;

const SPACE_TONE: Record<SpaceStatus, string> = { active: 'ws-ok', inactive: 'ws-muted', under_construction: 'ws-warn', decommissioned: 'ws-muted', reserved_build: 'ws-info' };
export const SpaceStatusBadge = ({ status }: { status: SpaceStatus }) => <Pill tone={SPACE_TONE[status]}>{cap(status)}</Pill>;

const HEAT_TONE: Record<HeatLevel, string> = { green: 'ws-ok', yellow: 'ws-warn', red: 'ws-danger' };
export const HeatBadge = ({ level }: { level: HeatLevel }) => <Pill tone={HEAT_TONE[level]}>{cap(level)}</Pill>;

const PRIORITY_TONE: Record<PriorityLevel, string> = { p1: 'ws-danger', p2: 'ws-warn', p3: 'ws-info', p4: 'ws-muted' };
export const PriorityBadge = ({ level }: { level: PriorityLevel }) => <Pill tone={PRIORITY_TONE[level]}>{level.toUpperCase()}</Pill>;

const ROOM_TONE: Record<MeetingRoomStatus, string> = { available: 'ws-ok', booked: 'ws-booked', in_use: 'ws-occupied', maintenance: 'ws-warn' };
export const RoomStatusBadge = ({ status }: { status: MeetingRoomStatus }) => <Pill tone={ROOM_TONE[status]}>{cap(status)}</Pill>;

const VISITOR_TONE: Record<VisitorStatus, string> = { pending_approval: 'ws-warn', expected: 'ws-info', checked_in: 'ws-ok', checked_out: 'ws-muted', no_show: 'ws-noshow', cancelled: 'ws-muted' };
export const VisitorStatusBadge = ({ status }: { status: VisitorStatus }) => <Pill tone={VISITOR_TONE[status]}>{cap(status)}</Pill>;

const SEV_TONE: Record<GovernanceSeverity, string> = { info: 'ws-info', warn: 'ws-warn', critical: 'ws-danger' };
export const GovernanceSeverityBadge = ({ severity }: { severity: GovernanceSeverity }) => <Pill tone={SEV_TONE[severity]}>{cap(severity)}</Pill>;

export const Money = ({ value }: { value?: number }) => <span className="num">{value == null ? '—' : inr(value)}</span>;
export const Pct = ({ value }: { value?: number }) => <span className="num">{value == null ? '—' : `${Math.round(value)}%`}</span>;

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="ws-legend">
      {items.map((i) => (
        <span key={i.label} className="ws-legend__item"><span className="ws-legend__swatch" style={{ background: i.color }} /> {i.label}</span>
      ))}
    </div>
  );
}

export function EmptyState({ icon = 'workspace', title, message }: { icon?: IconName; title: string; message?: string }) {
  return (
    <div className="empty"><div className="empty__icon"><Icon name={icon} size={34} /></div><h2>{title}</h2>{message && <p>{message}</p>}</div>
  );
}

// ---------- summary stat cards (icon chip + value + label) ----------
export interface Stat { icon: IconName; tint?: string; value: React.ReactNode; label: string; small?: boolean; accent?: boolean }
export function StatCards({ stats }: { stats: Stat[] }) {
  return (
    <div className="ws-stat-strip">
      {stats.map((s, i) => (
        <div className={'ws-stat-card' + (s.accent ? ' ws-stat-card--accent' : '')} key={i}>
          <div className={'ws-stat-card__icon ' + (s.tint ?? 'tint-blue')}><Icon name={s.icon} size={18} /></div>
          <div style={{ minWidth: 0 }}>
            <div className={'ws-stat-card__value' + (s.small ? ' is-sm' : '')} title={typeof s.value === 'string' ? s.value : undefined}>{s.value}</div>
            <div className="ws-stat-card__label">{s.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------- AI & privacy components ----------
const CONF_TONE = (c: number) => (c >= 0.85 ? 'ws-ok' : c >= 0.7 ? 'ws-warn' : 'ws-danger');
export const ConfidenceChip = ({ confidence }: { confidence: number }) => <Pill tone={CONF_TONE(confidence)}>{Math.round(confidence * 100)}% confident</Pill>;

const AGENT_STATUS_TONE: Record<AgentRunStatus, string> = { queued: 'ws-muted', running: 'ws-info', needs_review: 'ws-warn', applied: 'ws-ok', rejected: 'ws-muted', failed: 'ws-danger' };
export function AgentSuggestionCard<T>({ s, children }: { s: AgentSuggestion<T>; children?: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
        <Icon name="robot" size={16} />
        <b style={{ fontSize: 13.5 }}>{cap(s.agent)}</b>
        <ConfidenceChip confidence={s.confidence} />
        <Pill tone={AGENT_STATUS_TONE[s.status]}>{cap(s.status)}</Pill>
        {s.requiresReview && <span className="ws-pill ws-warn"><Icon name="eye" size={11} /> review</span>}
      </div>
      <p className="muted" style={{ fontSize: 12.5, margin: 0 }}>{s.rationale}</p>
      {children}
    </div>
  );
}

export function ReviewGateControls({ onApprove, onReject, onEdit }: { onApprove?: () => void; onReject?: () => void; onEdit?: () => void }) {
  return (
    <div className="row-actions" style={{ marginTop: 10 }}>
      <button className="btn btn--primary btn--sm" onClick={onApprove}><Icon name="check" size={14} strokeWidth={2.2} /> Approve &amp; apply</button>
      {onEdit && <button className="btn btn--ghost btn--sm" onClick={onEdit}><Icon name="edit" size={14} /> Review</button>}
      <button className="btn btn--ghost btn--sm is-danger" onClick={onReject}><Icon name="close" size={14} /> Reject</button>
    </div>
  );
}

const INT_TONE: Record<Integration['status'], string> = { connected: 'ws-ok', disconnected: 'ws-muted', error: 'ws-danger' };
export function ConnectorCard({ integration, onToggle }: { integration: Integration; onToggle?: () => void }) {
  const i = integration;
  return (
    <div className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
      <div className="ws-stat-card__icon tint-blue"><Icon name="settings" size={16} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13.5 }}>{i.provider}</div>
        <div className="muted" style={{ fontSize: 11.5 }}>{cap(i.category)}{i.lastSyncAt ? ` · synced ${i.lastSyncAt.slice(11, 16)}` : ''}</div>
      </div>
      <Pill tone={INT_TONE[i.status]}>{cap(i.status)}</Pill>
      <button className={'btn btn--sm ' + (i.status === 'connected' ? 'btn--ghost' : 'btn--primary')} onClick={onToggle}>{i.status === 'connected' ? 'Manage' : 'Connect'}</button>
    </div>
  );
}

export function ScopeNotice({ children }: { children: React.ReactNode }) {
  return <div className="ws-notice ws-notice--info"><Icon name="lock" size={15} /> <span>{children}</span></div>;
}
export function AuditBanner({ children }: { children: React.ReactNode }) {
  return <div className="ws-notice ws-notice--audit"><Icon name="shield" size={15} /> <span>{children}</span></div>;
}
