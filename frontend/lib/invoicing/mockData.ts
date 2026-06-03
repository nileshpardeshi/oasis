// OASIS — Invoicing module MOCK data (frontend prototype).
// Fictional sample data only — no real vendor/UTR/financial data.

import type {
  PayingEntity, Category, Vendor, Invoice, BillingLine, BillingBatch,
  ReconLine, NotificationLogItem, NotificationSchedule,
} from './types';

export const payingEntities: PayingEntity[] = [
  { id: 'e1', code: 'OSPL', legalName: 'Opus Software Pvt. Ltd.', country: 'India', currency: 'INR' },
  { id: 'e2', code: 'OSSPL', legalName: 'Opus Services & Solutions Pvt. Ltd.', country: 'India', currency: 'INR' },
  { id: 'e3', code: 'OPUS-US', legalName: 'Opus Technologies Inc.', country: 'USA', currency: 'USD' },
];

export const categories: Category[] = [
  { id: 'c1', name: 'Telecom & Internet' },
  { id: 'c2', name: 'Hotel & Accommodation' },
  { id: 'c3', name: 'Travel – Cab/Car Rental' },
  { id: 'c4', name: 'Courier & Logistics' },
  { id: 'c5', name: 'Advertisement & Marketing' },
  { id: 'c6', name: 'Facilities – Rent/CAM' },
  { id: 'c7', name: 'Security Services' },
  { id: 'c8', name: 'AMC & Equipment Maintenance' },
  { id: 'c9', name: 'Printing & Stationery' },
  { id: 'c10', name: 'Utilities – Electricity' },
];

export const vendors: Vendor[] = [
  { id: 'v1', name: 'Skyline Telecom Ltd', aliases: ['Skyline Telecom'], gstin: '27ABCDE1234F1Z5', pan: 'ABCDE1234F', msme: false, bankAccount: 'XXXX4521', defaultCreditPeriodDays: 15, defaultCategoryId: 'c1', contactEmail: 'ar@skylinetel.example', status: 'Active' },
  { id: 'v2', name: 'BlueSky Hotels - Pune', aliases: ['BlueSky Hotel Pune'], gstin: '27FGHIJ5678K1Z2', pan: 'FGHIJ5678K', msme: false, bankAccount: 'XXXX8830', defaultCreditPeriodDays: 30, defaultCategoryId: 'c2', contactEmail: 'billing@blueskyhotels.example', status: 'Active' },
  { id: 'v3', name: 'Metro Car Rentals Pvt Ltd', gstin: '27KLMNO9012L1Z9', pan: 'KLMNO9012L', msme: true, bankAccount: 'XXXX1190', defaultCreditPeriodDays: 30, defaultCategoryId: 'c3', contactEmail: 'accounts@metrocars.example', status: 'Active' },
  { id: 'v4', name: 'RapidPost Couriers', gstin: '27PQRST3456M1Z7', pan: 'PQRST3456M', msme: true, bankAccount: 'XXXX7741', defaultCreditPeriodDays: 7, defaultCategoryId: 'c4', contactEmail: 'support@rapidpost.example', status: 'Active' },
  { id: 'v5', name: 'PrimeGuard Security Services', gstin: '27UVWXY7890N1Z3', pan: 'UVWXY7890N', msme: false, bankAccount: 'XXXX2218', defaultCreditPeriodDays: 30, defaultCategoryId: 'c7', contactEmail: 'finance@primeguard.example', status: 'Active' },
  { id: 'v6', name: 'CopyTech Office Automation', gstin: '27ZABCD2345P1Z1', pan: 'ZABCD2345P', msme: true, bankAccount: 'XXXX5567', defaultCreditPeriodDays: 30, defaultCategoryId: 'c8', contactEmail: 'ar@copytech.example', status: 'Active' },
];

const fld = (value: string, confidence: 'high' | 'medium' | 'low' = 'high') => ({ value, confidence });
const fldN = (value: number, confidence: 'high' | 'medium' | 'low' = 'high') => ({ value, confidence });

// Invoices in the current intake (some queued, some ready)
export const invoices: Invoice[] = [
  {
    id: 'inv1', fileName: 'Skyline_Telecom_May.pdf', fileType: 'PDF', payingEntityCode: 'OSPL', receivedDate: '2026-06-02',
    extractionStatus: 'Ready for Review',
    vendorName: fld('Skyline Telecom Ltd'), billNo: fld('STL-2026-04412'), billDate: fld('2026-05-31'),
    basicAmount: fldN(42000), gstAmount: fldN(7560), totalAmount: fldN(49560),
    description: fld('Leased line + PRI charges — May 2026'), categoryId: 'c1', currency: 'INR',
  },
  {
    id: 'inv2', fileName: 'BlueSky_Hotels_stay.pdf', fileType: 'PDF', payingEntityCode: 'OSPL', receivedDate: '2026-06-02',
    extractionStatus: 'Ready for Review',
    vendorName: fld('BlueSky Hotels - Pune'), billNo: fld('BSH-IPVN-90231', 'medium'), billDate: fld('2026-05-28'),
    basicAmount: fldN(64000), gstAmount: fldN(11520), totalAmount: fldN(75520),
    description: fld('Guest accommodation 12 room-nights', 'medium'), categoryId: 'c2', currency: 'INR',
  },
  {
    id: 'inv3', fileName: 'Metro_Cabs_scan.pdf', fileType: 'PDF (scan)', payingEntityCode: 'OSSPL', receivedDate: '2026-06-03',
    extractionStatus: 'Ready for Review',
    vendorName: fld('Metro Car Rentals Pvt Ltd', 'medium'), billNo: fld('MCR-0426-2931'), billDate: fld('2026-05-30'),
    basicAmount: fldN(18500), gstAmount: fldN(925, 'low'), totalAmount: fldN(19425),
    description: fld('Airport transfers — 7 trips', 'low'), categoryId: 'c3', currency: 'INR',
  },
  {
    id: 'inv4', fileName: 'RapidPost_courier.xlsx', fileType: 'Excel', payingEntityCode: 'OSPL', receivedDate: '2026-06-03',
    extractionStatus: 'Extracting',
    vendorName: fld('RapidPost Couriers'), billNo: fld('RP-55120'), billDate: fld('2026-05-29'),
    basicAmount: fldN(5400), gstAmount: fldN(972), totalAmount: fldN(6372),
    description: fld('Domestic courier — May 2026'), categoryId: 'c4', currency: 'INR',
  },
  {
    id: 'inv5', fileName: 'CopyTech_AMC.pdf', fileType: 'PDF', payingEntityCode: 'OSPL', receivedDate: '2026-06-03',
    extractionStatus: 'Queued',
    vendorName: fld('CopyTech Office Automation'), billNo: fld('CT-2026-118'), billDate: fld('2026-06-01'),
    basicAmount: fldN(24000), gstAmount: fldN(4320), totalAmount: fldN(28320),
    description: fld('Printer AMC Q1 FY26-27'), categoryId: 'c8', currency: 'INR',
  },
];

// Billing lines (current + historical, drive batches, records, dashboards)
export const billingLines: BillingLine[] = [
  {
    id: 'bl1', fileName: 'Skyline_Telecom_May.pdf', fileType: 'PDF', payingEntityCode: 'OSPL', vendorName: 'Skyline Telecom Ltd', billNo: 'STL-2026-04412', billDate: '2026-05-31',
    description: 'Leased line + PRI charges — May 2026', categoryName: 'Telecom & Internet', costCenter: 'CC-IT', department: 'IT Infra',
    basicAmount: 42000, gstAmount: 7560, totalAmount: 49560, billReceivedDate: '2026-06-01', creditPeriodDays: 15, dueDate: '2026-06-15', paymentCycle: 'I',
    paymentStatus: 'Not Paid', isRecurring: true, riskLevel: 'Low', validationStatus: 'Pass', notificationStatus: 'Not Notified',
  },
  {
    id: 'bl2', fileName: 'BlueSky_Hotels_stay.pdf', fileType: 'PDF', payingEntityCode: 'OSPL', vendorName: 'BlueSky Hotels - Pune', billNo: 'BSH-IPVN-90231', billDate: '2026-05-28',
    description: 'Guest accommodation 12 room-nights', categoryName: 'Hotel & Accommodation', costCenter: 'CC-ADMIN', department: 'Admin',
    basicAmount: 64000, gstAmount: 11520, totalAmount: 75520, billReceivedDate: '2026-05-30', creditPeriodDays: 30, dueDate: '2026-06-27', paymentCycle: 'II',
    paymentStatus: 'Not Paid', isRecurring: false, riskLevel: 'Medium', validationStatus: 'Warning',
    validationNotes: ['Bill no format differs from vendor history', 'Amount 38% above 6-month average'], notificationStatus: 'Not Notified',
  },
  {
    id: 'bl3', fileName: 'Metro_Cabs_scan.pdf', fileType: 'PDF (scan)', payingEntityCode: 'OSSPL', vendorName: 'Metro Car Rentals Pvt Ltd', billNo: 'MCR-0426-2931', billDate: '2026-05-30',
    description: 'Airport transfers — 7 trips', categoryName: 'Travel – Cab/Car Rental', costCenter: 'CC-DELIVERY', department: 'Delivery',
    basicAmount: 18500, gstAmount: 925, totalAmount: 19425, tdsAmount: 370, billReceivedDate: '2026-06-02', creditPeriodDays: 30, dueDate: '2026-06-29', paymentCycle: 'II',
    paymentStatus: 'Not Paid', isRecurring: false, riskLevel: 'High', validationStatus: 'Fail',
    validationNotes: ['Vendor bank account changed since last invoice — needs confirmation', 'GST amount looks low for taxable value'], notificationStatus: 'Not Notified',
  },
  // historical (paid) — for records/dashboards/notifications
  {
    id: 'bl4', fileName: 'Skyline_Telecom_Apr.pdf', fileType: 'PDF', payingEntityCode: 'OSPL', vendorName: 'Skyline Telecom Ltd', billNo: 'STL-2026-04111', billDate: '2026-04-30',
    description: 'Leased line + PRI charges — Apr 2026', categoryName: 'Telecom & Internet', costCenter: 'CC-IT', department: 'IT Infra',
    basicAmount: 42000, gstAmount: 7560, totalAmount: 49560, tdsAmount: 0, paidAmount: 49560, billReceivedDate: '2026-05-01', creditPeriodDays: 15, sentToFinanceOn: '2026-05-03', dueDate: '2026-05-15',
    paymentCycle: 'I', paymentStatus: 'Paid', paymentDate: '2026-05-14', utr: 'UTRSAMPLE0510111', paymentMode: 'NEFT',
    isRecurring: true, riskLevel: 'Low', validationStatus: 'Pass', notificationStatus: 'Sent',
  },
  {
    id: 'bl5', fileName: 'PrimeGuard_Security_Apr.pdf', fileType: 'PDF', payingEntityCode: 'OSPL', vendorName: 'PrimeGuard Security Services', billNo: 'PG-APR-7781', billDate: '2026-04-30',
    description: 'Security manpower — Apr 2026', categoryName: 'Security Services', costCenter: 'CC-ADMIN', department: 'Admin',
    basicAmount: 88000, gstAmount: 15840, totalAmount: 103840, tdsAmount: 880, paidAmount: 102960, billReceivedDate: '2026-05-02', creditPeriodDays: 30, sentToFinanceOn: '2026-05-03', dueDate: '2026-05-30',
    paymentCycle: 'II', paymentStatus: 'Paid', paymentDate: '2026-05-29', utr: 'UTRSAMPLE0529778', paymentMode: 'NEFT',
    isRecurring: true, riskLevel: 'Low', validationStatus: 'Pass', notificationStatus: 'Not Notified',
  },
  {
    id: 'bl6', fileName: 'RapidPost_Courier_Apr.xlsx', fileType: 'Excel', payingEntityCode: 'OSSPL', vendorName: 'RapidPost Couriers', billNo: 'RP-54990', billDate: '2026-04-28',
    description: 'Domestic courier — Apr 2026', categoryName: 'Courier & Logistics', costCenter: 'CC-ADMIN', department: 'Admin',
    basicAmount: 5100, gstAmount: 918, totalAmount: 6018, tdsAmount: 102, paidAmount: 5916, billReceivedDate: '2026-04-29', creditPeriodDays: 7, sentToFinanceOn: '2026-05-03', dueDate: '2026-05-05',
    paymentCycle: 'I', paymentStatus: 'Paid', paymentDate: '2026-05-06', utr: 'UTRSAMPLE0506549', paymentMode: 'NEFT',
    isRecurring: true, riskLevel: 'Low', validationStatus: 'Pass', notificationStatus: 'Not Notified',
  },
];

export const billingBatches: BillingBatch[] = [
  {
    id: 'b1', code: 'BILL-2026-06-I', periodMonth: 'Jun 2026', status: 'Pending Approval',
    createdBy: 'Admin User', lineIds: ['bl1', 'bl2'], totalValue: 125080, recurringCount: 1, nonRecurringCount: 1, createdAt: '2026-06-03',
  },
  {
    id: 'b2', code: 'BILL-2026-06-OSSPL', periodMonth: 'Jun 2026', status: 'Draft',
    createdBy: 'Admin User', lineIds: ['bl3'], totalValue: 19425, recurringCount: 0, nonRecurringCount: 1, createdAt: '2026-06-03',
  },
  {
    id: 'b3', code: 'BILL-2026-05-I', periodMonth: 'May 2026', status: 'Reconciliation Open',
    createdBy: 'Admin User', lineIds: ['bl4', 'bl5', 'bl6'], totalValue: 159418, recurringCount: 3, nonRecurringCount: 0, createdAt: '2026-05-03',
  },
];

// Reconciliation preview for a finance report uploaded against batch b3
export const reconLines: ReconLine[] = [
  { billNo: 'STL-2026-04111', vendorName: 'Skyline Telecom Ltd', gross: 49560, tds: 0, net: 49560, utr: 'UTRSAMPLE0510111', paymentDate: '2026-05-14', mode: 'NEFT', match: 'matched' },
  { billNo: 'PG-APR-7781', vendorName: 'PrimeGuard Security Services', gross: 103840, tds: 880, net: 102960, utr: 'UTRSAMPLE0529778', paymentDate: '2026-05-29', mode: 'NEFT', match: 'matched' },
  { billNo: 'RP-54990', vendorName: 'RapidPost Couriers', gross: 6018, tds: 102, net: 5916, utr: 'UTRSAMPLE0506549', paymentDate: '2026-05-06', mode: 'NEFT', match: 'matched' },
  { billNo: 'MCR-0426-1180', vendorName: 'Metro Car Rentals Pvt Ltd', gross: 12200, tds: 244, net: 11956, utr: 'UTRSAMPLE0512118', paymentDate: '2026-05-12', mode: 'NEFT', match: 'exception', note: 'Reference not found in this batch' },
];

export const notificationLog: NotificationLogItem[] = [
  { id: 'n1', vendorName: 'Skyline Telecom Ltd', billRefs: ['STL-2026-04111'], channel: 'Email', trigger: 'scheduled', status: 'Sent', sentAt: '2026-05-15 09:00' },
  { id: 'n2', vendorName: 'CopyTech Office Automation', billRefs: ['CT-2026-097'], channel: 'Email', trigger: 'manual', status: 'Failed', sentAt: '2026-05-16 14:20' },
];

export const notificationSchedule: NotificationSchedule = {
  enabled: true, frequency: 'weekly', time: '09:00', timezone: 'Asia/Kolkata', dayOfWeek: 'Monday',
};

// ---- helpers ----
export const inr = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

// Payment priority/cycle from the due date: due by 7th → I, by 22nd → II, else next cycle (I).
export const paymentPriority = (due?: string): 'I' | 'II' => {
  if (!due) return 'I';
  const day = new Date(due).getDate();
  return day <= 7 ? 'I' : day <= 22 ? 'II' : 'I';
};
export const addDays = (from: string, days: number) => {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};
export const daysBetween = (from?: string, to?: string): number | undefined =>
  from && to ? Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86400000) : undefined;

export const getBatch = (id: string) => billingBatches.find((b) => b.id === id);
export const linesForBatch = (id: string): BillingLine[] => {
  const b = getBatch(id);
  if (!b) return [];
  return b.lineIds.map((lid) => billingLines.find((l) => l.id === lid)).filter(Boolean) as BillingLine[];
};

// Dashboard KPIs (sample)
export const dashboardKpis = {
  invoicesThisMonth: 26,
  valueProcessed: 1284500,
  paid: 12,
  unpaid: 11,
  overdue: 3,
  recurring: 18,
  nonRecurring: 8,
  avgCycleDays: 9,
  onTimePct: 86,
  tdsDeducted: 14250,
  upcoming7: 49560,
  upcoming30: 224000,
};

export const monthwiseSpend = [
  { month: 'Jan', value: 62 }, { month: 'Feb', value: 71 }, { month: 'Mar', value: 58 },
  { month: 'Apr', value: 83 }, { month: 'May', value: 76 }, { month: 'Jun', value: 44 },
];

export const categorySpend = [
  { name: 'Security', value: 28 }, { name: 'Hotel', value: 22 }, { name: 'Telecom', value: 16 },
  { name: 'Facilities', value: 14 }, { name: 'Travel', value: 11 }, { name: 'Courier', value: 5 }, { name: 'Other', value: 4 },
];
