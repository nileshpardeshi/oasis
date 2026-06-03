// OASIS — Invoicing shared presentational components (no hooks; usable anywhere).
import * as React from 'react';
import type { PaymentStatus, RiskLevel, ValidationStatus, NotificationStatus, Confidence, BatchStatus } from '@/lib/invoicing/types';
import { inr } from '@/lib/invoicing/mockData';

const BATCH_CLASS: Record<BatchStatus, string> = {
  'Draft': 'st-unpaid',
  'Generated': 'st-process',
  'Validated': 'st-process',
  'Pending Approval': 'st-process',
  'Needs Correction': 'st-partial',
  'Rejected': 'st-hold',
  'Approved': 'st-paid',
  'Sent to Finance': 'st-sentfin',
  'Reconciliation Open': 'st-sentfin',
  'Closed': 'st-unpaid',
};

export function BatchStatusBadge({ status }: { status: BatchStatus }) {
  return <span className={`pill ${BATCH_CLASS[status]}`}>{status}</span>;
}

const STATUS_CLASS: Record<PaymentStatus, string> = {
  'Paid': 'st-paid',
  'Not Paid': 'st-unpaid',
  'Sent to Finance': 'st-sentfin',
  'In Process': 'st-process',
  'Partially Paid': 'st-partial',
  'On Hold': 'st-hold',
};

export function StatusBadge({ status }: { status: PaymentStatus }) {
  return <span className={`pill ${STATUS_CLASS[status]}`}>{status}</span>;
}

export function RiskBadge({ level }: { level: RiskLevel }) {
  return <span className={`pill risk-${level}`}>{level} risk</span>;
}

export function ValidationBadge({ status }: { status: ValidationStatus }) {
  return <span className={`pill val-${status}`}>{status}</span>;
}

const NOTIF_CLASS: Record<NotificationStatus, string> = {
  'Sent': 'notif-Sent',
  'Not Notified': 'notif-none',
  'Failed': 'notif-Failed',
};

export function NotifBadge({ status }: { status: NotificationStatus }) {
  return <span className={`pill ${NOTIF_CLASS[status]}`}>{status}</span>;
}

export function ConfidenceDot({ level }: { level: Confidence }) {
  const label = level === 'high' ? 'High confidence' : level === 'medium' ? 'Review suggested' : 'Low — please verify';
  return (
    <span title={label}>
      <span className={`conf ${level}`} />
      <span className="conf-label">{label}</span>
    </span>
  );
}

export function Money({ value }: { value?: number }) {
  return <span className="num">{value == null ? '—' : inr(value)}</span>;
}
