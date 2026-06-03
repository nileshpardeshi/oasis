// OASIS — Invoicing reports: definitions, datasets, and scheduled-delivery mock data.
import { inr } from './mockData';

export type Viz = 'bar' | 'donut' | 'rankbars' | 'kpi';
export type ReportCategory = 'Batch' | 'Financial' | 'Spend Analysis' | 'Operational' | 'Compliance';

export interface ChartDatum { label: string; value: number; color?: string }
export interface KpiDatum { label: string; value: string; sub?: string }
export interface ReportTable { columns: string[]; numCols: number[]; rows: (string | number)[][] }

export interface ReportDef {
  id: string;
  name: string;
  desc: string;
  category: ReportCategory;
  viz: Viz;
  unit?: string;             // axis/legend hint
  chart?: ChartDatum[];
  kpis?: KpiDatum[];
  table: ReportTable;
}

export const REPORTS: ReportDef[] = [
  {
    id: 'monthwise', name: 'Monthwise invoices & value', category: 'Financial', viz: 'bar', unit: '₹ Lakh',
    desc: 'Invoice volume and processed value per month.',
    chart: [
      { label: 'Jan', value: 62 }, { label: 'Feb', value: 71 }, { label: 'Mar', value: 58 },
      { label: 'Apr', value: 83 }, { label: 'May', value: 76 }, { label: 'Jun', value: 44 },
    ],
    table: {
      columns: ['Month', 'Total Invoices', 'Total Value', 'Recurring (#)', 'Recurring Value', 'Non-recurring (#)', 'Non-recurring Value', 'Paid', 'Unpaid'],
      numCols: [1, 2, 3, 4, 5, 6, 7, 8],
      rows: [
        ['Jan 2026', 22, inr(6200000), 15, inr(3800000), 7, inr(2400000), inr(5900000), inr(300000)],
        ['Feb 2026', 25, inr(7100000), 16, inr(4400000), 9, inr(2700000), inr(6800000), inr(300000)],
        ['Mar 2026', 19, inr(5800000), 13, inr(3800000), 6, inr(2000000), inr(5800000), inr(0)],
        ['Apr 2026', 28, inr(8300000), 18, inr(5000000), 10, inr(3300000), inr(7600000), inr(700000)],
        ['May 2026', 26, inr(7600000), 17, inr(4700000), 9, inr(2900000), inr(6900000), inr(700000)],
        ['Jun 2026', 14, inr(4400000), 10, inr(3000000), 4, inr(1400000), inr(1200000), inr(3200000)],
      ],
    },
  },
  {
    id: 'status', name: 'Paid vs Unpaid vs Overdue', category: 'Financial', viz: 'donut',
    desc: 'Current payment-status breakdown across open invoices.',
    chart: [
      { label: 'Paid', value: 12, color: '#16a34a' },
      { label: 'In process', value: 6, color: '#f7991f' },
      { label: 'Unpaid', value: 8, color: '#2f6cb0' },
      { label: 'Overdue', value: 3, color: '#dc2626' },
    ],
    table: {
      columns: ['Status', 'Count', 'Value'], numCols: [1, 2],
      rows: [['Paid', 12, inr(720000)], ['In process', 6, inr(310000)], ['Unpaid', 8, inr(254000)], ['Overdue', 3, inr(98000)]],
    },
  },
  {
    id: 'category', name: 'Category-wise expense', category: 'Spend Analysis', viz: 'rankbars', unit: '₹',
    desc: 'Where the spend is going, by expense category.',
    chart: [
      { label: 'Security Services', value: 360000 }, { label: 'Hotel & Accommodation', value: 286000 },
      { label: 'Telecom & Internet', value: 208000 }, { label: 'Facilities – Rent/CAM', value: 182000 },
      { label: 'Travel – Cab', value: 142000 }, { label: 'Courier', value: 64000 }, { label: 'AMC', value: 52000 },
    ],
    table: {
      columns: ['Category', 'Invoices', 'Spend', 'Share'], numCols: [1, 2, 3],
      rows: [
        ['Security Services', 4, inr(360000), '27%'], ['Hotel & Accommodation', 6, inr(286000), '22%'],
        ['Telecom & Internet', 3, inr(208000), '16%'], ['Facilities – Rent/CAM', 2, inr(182000), '14%'],
        ['Travel – Cab', 5, inr(142000), '11%'], ['Courier', 4, inr(64000), '5%'], ['AMC', 2, inr(52000), '4%'],
      ],
    },
  },
  {
    id: 'vendor', name: 'Top vendors by spend', category: 'Spend Analysis', viz: 'rankbars', unit: '₹',
    desc: 'Highest-spend vendors for the selected period.',
    chart: [
      { label: 'PrimeGuard Security', value: 207680 }, { label: 'BlueSky Hotels', value: 151040 },
      { label: 'Skyline Telecom', value: 99120 }, { label: 'Metro Car Rentals', value: 38850 },
      { label: 'CopyTech Automation', value: 28320 }, { label: 'RapidPost Couriers', value: 12390 },
    ],
    table: {
      columns: ['Vendor', 'Invoices', 'Spend', 'Avg / invoice', 'On-time %'], numCols: [1, 2, 3, 4],
      rows: [
        ['PrimeGuard Security', 2, inr(207680), inr(103840), '100%'],
        ['BlueSky Hotels', 2, inr(151040), inr(75520), '50%'],
        ['Skyline Telecom', 2, inr(99120), inr(49560), '100%'],
        ['Metro Car Rentals', 2, inr(38850), inr(19425), '50%'],
        ['CopyTech Automation', 1, inr(28320), inr(28320), '100%'],
        ['RapidPost Couriers', 2, inr(12390), inr(6195), '100%'],
      ],
    },
  },
  {
    id: 'dept', name: 'Department / cost-center spend', category: 'Spend Analysis', viz: 'rankbars', unit: '₹',
    desc: 'Spend allocated by department and cost center.',
    chart: [
      { label: 'Admin (CC-ADMIN)', value: 412000 }, { label: 'IT Infra (CC-IT)', value: 208000 },
      { label: 'Delivery (CC-DELIVERY)', value: 142000 }, { label: 'Marketing (CC-MKT)', value: 96000 },
    ],
    table: {
      columns: ['Department', 'Cost center', 'Invoices', 'Spend'], numCols: [2, 3],
      rows: [
        ['Admin', 'CC-ADMIN', 9, inr(412000)], ['IT Infra', 'CC-IT', 3, inr(208000)],
        ['Delivery', 'CC-DELIVERY', 5, inr(142000)], ['Marketing', 'CC-MKT', 3, inr(96000)],
      ],
    },
  },
  {
    id: 'entity', name: 'Entity-wise spend', category: 'Financial', viz: 'donut',
    desc: 'Spend split across paying entities.',
    chart: [
      { label: 'OSPL', value: 720000, color: '#064281' },
      { label: 'OSSPL', value: 240000, color: '#2f6cb0' },
      { label: 'OPUS-US', value: 110000, color: '#f7991f' },
    ],
    table: {
      columns: ['Entity', 'Currency', 'Invoices', 'Spend'], numCols: [2, 3],
      rows: [['OSPL', 'INR', 18, inr(720000)], ['OSSPL', 'INR', 6, inr(240000)], ['OPUS-US', 'USD', 2, inr(110000)]],
    },
  },
  {
    id: 'ageing', name: 'Payment ageing', category: 'Financial', viz: 'bar', unit: '₹ Lakh',
    desc: 'Outstanding payables bucketed by age.',
    chart: [
      { label: '0–7d', value: 5.0 }, { label: '8–30d', value: 12.4 }, { label: '31–60d', value: 6.6 }, { label: '60d+', value: 2.0 },
    ],
    table: {
      columns: ['Bucket', 'Invoices', 'Amount'], numCols: [1, 2],
      rows: [['0–7 days', 6, inr(500000)], ['8–30 days', 9, inr(1240000)], ['31–60 days', 4, inr(660000)], ['60+ days', 2, inr(200000)]],
    },
  },
  {
    id: 'upcoming', name: 'Upcoming payment liabilities', category: 'Financial', viz: 'bar', unit: '₹ Lakh',
    desc: 'Forecast of payments coming due (forward-looking).',
    chart: [
      { label: 'Next 7d', value: 4.96 }, { label: 'Next 15d', value: 11.8 }, { label: 'Next 30d', value: 22.4 }, { label: 'Next 60d', value: 31.2 },
    ],
    table: {
      columns: ['Window', 'Invoices', 'Amount due'], numCols: [1, 2],
      rows: [['Next 7 days', 3, inr(496000)], ['Next 15 days', 7, inr(1180000)], ['Next 30 days', 12, inr(2240000)], ['Next 60 days', 18, inr(3120000)]],
    },
  },
  {
    id: 'recurring', name: 'Recurring vs non-recurring', category: 'Spend Analysis', viz: 'donut',
    desc: 'Share of recurring vs one-off invoices.',
    chart: [{ label: 'Recurring', value: 18, color: '#064281' }, { label: 'Non-recurring', value: 8, color: '#f7991f' }],
    table: {
      columns: ['Type', 'Invoices', 'Value'], numCols: [1, 2],
      rows: [['Recurring', 18, inr(842000)], ['Non-recurring', 8, inr(442000)]],
    },
  },
  {
    id: 'sla', name: 'SLA / on-time payment', category: 'Operational', viz: 'kpi',
    desc: 'On-time payment performance against due dates.',
    kpis: [{ label: 'On-time', value: '86%' }, { label: 'Delayed', value: '14%' }, { label: 'Avg delay', value: '2.4 days' }],
    table: {
      columns: ['Month', 'On-time', 'Delayed', 'On-time %'], numCols: [1, 2, 3],
      rows: [['Mar', 17, 2, '89%'], ['Apr', 24, 4, '86%'], ['May', 22, 4, '85%']],
    },
  },
  {
    id: 'ops', name: 'Operational KPIs (cycle times)', category: 'Operational', viz: 'kpi',
    desc: 'Average processing, approval and payment times.',
    kpis: [
      { label: 'Avg processing', value: '1.8d', sub: 'upload → batch' },
      { label: 'Avg approval', value: '0.9d', sub: 'batch → approved' },
      { label: 'Avg payment', value: '6.3d', sub: 'approved → paid' },
    ],
    table: {
      columns: ['Stage', 'Avg (days)', 'Delayed items'], numCols: [1, 2],
      rows: [['Extraction → batch', 1.8, 1], ['Batch → approval', 0.9, 0], ['Approval → payment', 6.3, 3]],
    },
  },
  {
    id: 'tds', name: 'TDS deducted summary', category: 'Compliance', viz: 'rankbars', unit: '₹',
    desc: 'Tax deducted at source, by vendor.',
    chart: [
      { label: 'PrimeGuard Security', value: 880 }, { label: 'Metro Car Rentals', value: 614 },
      { label: 'RapidPost Couriers', value: 204 },
    ],
    table: {
      columns: ['Vendor', 'Gross', 'TDS', 'Net paid'], numCols: [1, 2, 3],
      rows: [
        ['PrimeGuard Security', inr(103840), inr(880), inr(102960)],
        ['Metro Car Rentals', inr(12200), inr(614), inr(11586)],
        ['RapidPost Couriers', inr(6018), inr(204), inr(5814)],
      ],
    },
  },
  {
    id: 'recon-exceptions', name: 'Reconciliation exceptions', category: 'Compliance', viz: 'bar', unit: 'count',
    desc: 'Unmatched / mismatched references from finance reports.',
    chart: [{ label: 'Matched', value: 3, color: '#16a34a' }, { label: 'Exceptions', value: 1, color: '#dc2626' }],
    table: {
      columns: ['Reference', 'Vendor', 'Amount', 'Issue'], numCols: [2],
      rows: [['MCR-0426-1180', 'Metro Car Rentals', inr(11956), 'Reference not found in batch']],
    },
  },
  {
    id: 'batch-report', name: 'Batch Report (invoicing + reconciliation)', category: 'Batch', viz: 'bar',
    desc: 'Full detail of a selected billing batch — invoicing lines + reconciliation (UTR/payment) — viewable & downloadable; filter by processed date range. Schedulable.',
    chart: [],
    table: { columns: [], numCols: [], rows: [] },
  },
];

export const reportCategories: ReportCategory[] = ['Batch', 'Financial', 'Spend Analysis', 'Operational', 'Compliance'];

// ---- Scheduled delivery (subscriptions) ----
export interface ReportSchedule {
  id: string;
  reports: string[];
  subject: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: string;
  dayOfMonth?: number;
  time: string;
  timezone: string;
  recipients: string[];
  format: 'PDF' | 'Excel' | 'CSV';
  lookbackDays: number;   // report covers the last N days
  enabled: boolean;
  lastRun?: string;
  nextRun: string;
}

export const reportSchedules: ReportSchedule[] = [
  {
    id: 's1', reports: ['Monthwise invoices & value', 'Paid vs Unpaid vs Overdue'], subject: 'OASIS — Weekly invoice MIS', frequency: 'weekly', dayOfWeek: 'Monday',
    time: '08:00', timezone: 'Asia/Kolkata', recipients: ['cfo@opustech.example', 'admin.head@opustech.example'],
    format: 'PDF', lookbackDays: 7, enabled: true, lastRun: '2026-06-01 08:00', nextRun: '2026-06-08 08:00',
  },
  {
    id: 's2', reports: ['Upcoming payment liabilities'], subject: 'OASIS — Daily upcoming payments', frequency: 'daily',
    time: '07:30', timezone: 'Asia/Kolkata', recipients: ['finance.ops@opustech.example'],
    format: 'Excel', lookbackDays: 1, enabled: true, lastRun: '2026-06-03 07:30', nextRun: '2026-06-04 07:30',
  },
  {
    id: 's3', reports: ['Category-wise expense', 'Top vendors by spend'], subject: 'OASIS — Monthly spend analysis', frequency: 'monthly', dayOfMonth: 1,
    time: '09:00', timezone: 'Asia/Kolkata', recipients: ['cfo@opustech.example'],
    format: 'PDF', lookbackDays: 30, enabled: false, lastRun: '2026-06-01 09:00', nextRun: '2026-07-01 09:00',
  },
];

export interface DeliveryLogItem { id: string; report: string; runAt: string; recipients: number; status: 'Sent' | 'Failed' }
export const deliveryLog: DeliveryLogItem[] = [
  { id: 'd1', report: 'Monthwise invoices & value (+1)', runAt: '2026-06-01 08:00', recipients: 2, status: 'Sent' },
  { id: 'd2', report: 'Upcoming payment liabilities', runAt: '2026-06-03 07:30', recipients: 1, status: 'Sent' },
  { id: 'd3', report: 'Upcoming payment liabilities', runAt: '2026-06-02 07:30', recipients: 1, status: 'Sent' },
  { id: 'd4', report: 'Category-wise expense (+1)', runAt: '2026-06-01 09:00', recipients: 1, status: 'Failed' },
];
