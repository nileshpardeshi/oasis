// OASIS — Invoicing module domain types (frontend).
// Mirrors invoice.md §11 data model (subset the UI needs). Backend/DB later.

export type PaymentStatus = 'Not Paid' | 'Sent to Finance' | 'In Process' | 'Paid' | 'Partially Paid' | 'On Hold';
export type NotificationStatus = 'Not Notified' | 'Sent' | 'Failed';
export type RiskLevel = 'Low' | 'Medium' | 'High';
export type ValidationStatus = 'Pass' | 'Warning' | 'Fail';
export type BatchStatus =
  | 'Draft'
  | 'Generated'
  | 'Validated'
  | 'Pending Approval'
  | 'Needs Correction'
  | 'Rejected'
  | 'Approved'
  | 'Sent to Finance'
  | 'Approved By Finance'
  | 'Reconciliation Open'
  | 'Closed';
export type ExtractionStatus = 'Queued' | 'Extracting' | 'Ready for Review' | 'Confirmed';
export type Confidence = 'high' | 'medium' | 'low';

export interface PayingEntity {
  id: string;
  code: string;        // OSPL, OSSPL, ...
  legalName: string;
  country: string;
  currency: string;    // INR, USD
}

export interface Category {
  id: string;
  name: string;
}

export interface Vendor {
  id: string;
  name: string;
  aliases?: string[];
  gstin?: string;
  pan?: string;
  msme?: boolean;
  bankAccount?: string;
  defaultCreditPeriodDays?: number;
  defaultCategoryId?: string;
  contactEmail?: string;
  status: 'Active' | 'Inactive';
}

export interface ExtractedField<T = string> {
  value: T;
  confidence: Confidence;
}

export interface Invoice {
  id: string;
  fileName: string;
  fileType: string;
  payingEntityCode: string;
  receivedDate: string;
  extractionStatus: ExtractionStatus;
  // extracted fields (with confidence)
  vendorName: ExtractedField;
  billNo: ExtractedField;
  billDate: ExtractedField;
  basicAmount: ExtractedField<number>;
  gstAmount: ExtractedField<number>;
  totalAmount: ExtractedField<number>;
  description: ExtractedField;
  categoryId?: string;
  currency: string;
}

export interface BillingLine {
  id: string;
  fileName?: string;   // original uploaded invoice file — kept for reference & download
  fileType?: string;
  payingEntityCode: string;
  vendorName: string;
  billNo: string;
  billDate: string;
  billReceivedDate?: string;
  creditPeriodDays?: number;
  sentToFinanceOn?: string;
  description: string;
  categoryName: string;
  costCenter?: string;
  department?: string;
  basicAmount: number;
  gstAmount: number;
  totalAmount: number;
  tdsAmount?: number;
  paidAmount?: number;
  dueDate: string;
  paymentCycle?: 'I' | 'II';
  paymentStatus: PaymentStatus;
  paymentDate?: string;
  utr?: string;
  paymentMode?: string;
  isRecurring: boolean;
  riskLevel: RiskLevel;
  validationStatus: ValidationStatus;
  validationNotes?: string[];
  notificationStatus: NotificationStatus;
}

export interface BillingBatch {
  id: string;
  code: string;
  periodMonth: string;
  status: BatchStatus;
  createdBy: string;
  lineIds: string[];
  totalValue: number;
  recurringCount: number;
  nonRecurringCount: number;
  createdAt: string;
}

export interface ReconLine {
  billNo: string;
  vendorName: string;
  gross: number;
  tds: number;
  net: number;
  utr: string;
  paymentDate: string;
  mode: string;
  match: 'matched' | 'unmatched' | 'exception';
  note?: string;
}

export interface NotificationLogItem {
  id: string;
  vendorName: string;
  billRefs: string[];
  channel: 'Email';
  trigger: 'manual' | 'scheduled';
  status: NotificationStatus;
  sentAt?: string;
}

export interface NotificationSchedule {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  timezone: string;
  dayOfWeek?: string;
  dayOfMonth?: number;
}
