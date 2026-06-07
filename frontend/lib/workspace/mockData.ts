// OASIS — Workplace Intelligence mock data (frontend prototype).
// Sample data sourced from Opus Technologies' real "Desk Allocation Details.xlsx" manual tracker:
//   • Main Data tab  -> per phase/area capacity vs occupied vs vacant (see `areas` / `capacitySummary`)
//   • Open Office tab -> the desk-by-desk register (see `seatRegister`): Emp ID, Type (WS/Cubicle/Cabin),
//     Seat #, Drawer Key, Name, Extension, Group (service line), Account (client/internal), Vacant
//   • Meeting Rooms tab -> music-genre named rooms + numbered rooms (see `meetingRooms`)
//   • Floor Plan tab  -> WS/Cubicle/Cabin numbering scheme
// Datasets stay shaped to map 1:1 onto the PostgreSQL schema (development_workspace.md §3).

import type {
  Company, Office, Phase, Building, Floor, ServiceLine, Account, Project, Zone, SpaceElement, Desk, MeetingRoom,
  Employee, Allocation, Booking, BookingHold, QrCode, Visitor, CheckIn, OccupancyEvent, DeskLiveStatus, NoShowAlert,
  AttendanceCorrelation, HeatCell, HeatLevel, ForecastPoint, CollaborationEdge, TeamSeatingSuggestion, SustainabilityMetric,
  MovePlan, MoveItem, CostMetric, Policy, GovernanceFinding, Notification, ChatMessage, ExecKpi,
  PeopleLocationViewLog, PrivacySetting, Integration, CurrentUser, AgentSuggestion, WorkspaceKpis,
  DeskState, DeskType, DeskKind, OccupancyState, MeetingRoomStatus, Area, CapacityRow, SeatRegisterRow,
} from './types';

// ---------- formatting helpers ----------
export const inr = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
export const pct = (n: number) => `${Math.round(n)}%`;
export const fmtDate = (iso?: string) => (iso ? iso.slice(0, 10) : '—');
export const fmtTime = (iso?: string) => (iso ? new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—');
export const nowISO = () => '2026-06-05T09:30:00+05:30';
export const addDays = (iso: string, d: number) => { const x = new Date(iso); x.setDate(x.getDate() + d); return x.toISOString().slice(0, 10); };

// ---------- colour maps (single source for canvas + legend) ----------
const DESK_STATE_COLOR: Record<DeskState | OccupancyState, string> = {
  available: '#86efac', allocated: '#93c5fd', blocked: '#cbd5e1', maintenance: '#fcd34d', decommissioned: '#e5e7eb',
  vacant: '#86efac', booked: '#fdba74', checked_in: '#60a5fa', occupied: '#f87171', no_show: '#fca5a5',
};
export const deskStateColor = (s: DeskState | OccupancyState) => DESK_STATE_COLOR[s] ?? '#e5e7eb';
const DESK_KIND_COLOR: Record<DeskKind, string> = { workstation: '#93c5fd', cubicle: '#c4b5fd', cabin: '#fcd34d' };
export const deskKindColor = (k?: DeskKind) => (k ? DESK_KIND_COLOR[k] : '#cbd5e1');
export const deskKindLabel = (k?: DeskKind) => (k === 'workstation' ? 'Workstation' : k === 'cubicle' ? 'Cubicle' : k === 'cabin' ? 'Cabin' : '—');
const HEAT_COLOR: Record<HeatLevel, string> = { green: '#22c55e', yellow: '#facc15', red: '#ef4444' };
export const heatColor = (l: HeatLevel) => HEAT_COLOR[l];
export const heatBand = (utilizationPct: number): HeatLevel => (utilizationPct < 40 ? 'green' : utilizationPct < 75 ? 'yellow' : 'red');

// ---------- masters: org hierarchy ----------
export const company: Company = { id: 'co-opus', code: 'OPUS', name: 'Opus Technologies' };
export const offices: Office[] = [
  { id: 'off-pun', companyId: 'co-opus', code: 'PUN', name: 'Pune Office', city: 'Pune', country: 'India', timezone: 'Asia/Kolkata', geo: { lat: 18.56, lng: 73.91 } },
  { id: 'off-can', companyId: 'co-opus', code: 'CAN', name: 'Canada Office', city: 'Mississauga', country: 'Canada', timezone: 'America/Toronto' },
  { id: 'off-uk', companyId: 'co-opus', code: 'UK', name: 'UK Office', city: 'London', country: 'United Kingdom', timezone: 'Europe/London' },
];
export const phases: Phase[] = [{ id: 'ph-pun-main', officeId: 'off-pun', code: 'CAMPUS', name: 'Pune Campus' }];
export const buildings: Building[] = [{ id: 'bld-pun', phaseId: 'ph-pun-main', code: 'B1', name: 'Opus Pune Campus' }];

export const serviceLines: ServiceLine[] = [
  { id: 'sl-core', kind: 'core', code: 'CORE', name: 'Core', colorHex: '#064281', headcount: 154 },
  { id: 'sl-digital', kind: 'digital', code: 'DIG', name: 'Digital', colorHex: '#16a34a', headcount: 81 },
  { id: 'sl-data-ai', kind: 'data_ai', code: 'DATA', name: 'Data and AI', colorHex: '#f7991f', headcount: 26 },
  { id: 'sl-devops', kind: 'delivery', code: 'DEVOPS', name: 'DevOps', colorHex: '#7c3aed', headcount: 23 },
  { id: 'sl-core-product', kind: 'core', code: 'CPROD', name: 'Core Product', colorHex: '#0ea5e9', headcount: 13 },
  { id: 'sl-customer-centric', kind: 'delivery', code: 'CUSTC', name: 'Customer Centric', colorHex: '#9333ea', headcount: 8 },
  { id: 'sl-talent-acquisition', kind: 'hr', code: 'TALAQ', name: 'Talent Acquisition', colorHex: '#db2777', headcount: 7 },
  { id: 'sl-implementation', kind: 'delivery', code: 'IMPL', name: 'Implementation', colorHex: '#a855f7', headcount: 6 },
  { id: 'sl-business-finance', kind: 'admin', code: 'BFIN', name: 'Business Finance & PA', colorHex: '#0d9488', headcount: 5 },
  { id: 'sl-administration', kind: 'admin', code: 'ADMIN', name: 'Admin, Facilities & Procurement', colorHex: '#0891b2', headcount: 9 },
  { id: 'sl-cloud-infrastructure', kind: 'delivery', code: 'CLOUD', name: 'Cloud Infrastructure', colorHex: '#6366f1', headcount: 4 },
  { id: 'sl-domain', kind: 'core', code: 'DOMAIN', name: 'Domain', colorHex: '#2563eb', headcount: 4 },
  { id: 'sl-inside-sales', kind: 'others', code: 'ISALES', name: 'Inside Sales', colorHex: '#ca8a04', headcount: 4 },
  { id: 'sl-treasury-management', kind: 'admin', code: 'TREAS', name: 'Treasury Management', colorHex: '#14b8a6', headcount: 4 },
  { id: 'sl-product', kind: 'core', code: 'PROD', name: 'Product', colorHex: '#3b82f6', headcount: 3 },
  { id: 'sl-presales', kind: 'others', code: 'PRESL', name: 'Presales', colorHex: '#eab308', headcount: 3 },
  { id: 'sl-delivery-operations', kind: 'delivery', code: 'DELOPS', name: 'Delivery Operations', colorHex: '#8b5cf6', headcount: 3 },
  { id: 'sl-compliance-tax', kind: 'admin', code: 'COMPTX', name: 'Compliance & Tax Management', colorHex: '#06b6d4', headcount: 3 },
  { id: 'sl-delivery-excellence', kind: 'delivery', code: 'DELEXC', name: 'Delivery Excellence', colorHex: '#c084fc', headcount: 3 },
  { id: 'sl-it-services', kind: 'delivery', code: 'ITSVC', name: 'IT Services', colorHex: '#4f46e5', headcount: 7 },
  { id: 'sl-hr-operations', kind: 'hr', code: 'HROPS', name: 'HR Operations', colorHex: '#ec4899', headcount: 3 },
  { id: 'sl-marketing', kind: 'others', code: 'MKTG', name: 'Marketing', colorHex: '#f59e0b', headcount: 2 },
  { id: 'sl-gtm-sales-support', kind: 'others', code: 'GTM', name: 'GTM & New Sales Support', colorHex: '#d97706', headcount: 2 },
  { id: 'sl-technology', kind: 'core', code: 'TECH', name: 'Technology', colorHex: '#1d4ed8', headcount: 2 },
  { id: 'sl-ciso-dpo', kind: 'admin', code: 'CISO', name: 'CISO & DPO', colorHex: '#0284c7', headcount: 2 },
  { id: 'sl-corporate', kind: 'others', code: 'CORP', name: 'Corporate', colorHex: '#78716c', headcount: 2 },
  { id: 'sl-business-hr', kind: 'hr', code: 'BHR', name: 'Business HR', colorHex: '#f472b6', headcount: 2 },
  { id: 'sl-revenue-assurance', kind: 'admin', code: 'REVAS', name: 'Revenue Assurance & Accounts', colorHex: '#22d3ee', headcount: 2 },
  { id: 'sl-vendor-management', kind: 'admin', code: 'VENDOR', name: 'Vendor Management & Accounts Payable', colorHex: '#2dd4bf', headcount: 2 },
  { id: 'sl-sales', kind: 'others', code: 'SALES', name: 'Sales', colorHex: '#facc15', headcount: 2 },
  { id: 'sl-account-delivery', kind: 'delivery', code: 'ACCDEL', name: 'Account Delivery', colorHex: '#a78bfa', headcount: 1 },
  { id: 'sl-immigration', kind: 'hr', code: 'IMMIG', name: 'Immigration', colorHex: '#f9a8d4', headcount: 1 },
  { id: 'sl-fpa', kind: 'admin', code: 'FPA', name: 'Financial Planning & Analysis', colorHex: '#67e8f9', headcount: 1 },
  { id: 'sl-internal-comms', kind: 'others', code: 'INTCOM', name: 'Internal Communications', colorHex: '#fbbf24', headcount: 1 },
];

export const accounts: Account[] = [
  { id: 'ac-mastercard', code: 'MC', name: 'Mastercard', kind: 'client', headcount: 111 },
  { id: 'ac-aci', code: 'ACI', name: 'ACI Worldwide', kind: 'client', headcount: 65 },
  { id: 'ac-discover', code: 'DISC', name: 'Discover', kind: 'client', headcount: 62 },
  { id: 'ac-ncr', code: 'NCR', name: 'NCR Atleos', kind: 'client', headcount: 19 },
  { id: 'ac-fiserv', code: 'FISV', name: 'Fiserv', kind: 'client', headcount: 15 },
  { id: 'ac-shazam', code: 'SHZM', name: 'Shazam', kind: 'client', headcount: 13 },
  { id: 'ac-candescent', code: 'CAND', name: 'Candescent', kind: 'client', headcount: 10 },
  { id: 'ac-network-intl', code: 'NETI', name: 'Network International', kind: 'client', headcount: 1 },
  { id: 'ac-fis', code: 'FIS', name: 'FIS', kind: 'client', headcount: 1 },
  { id: 'ac-digital', code: 'DIG', name: 'Digital', kind: 'internal', headcount: 29 },
  { id: 'ac-core', code: 'CORE', name: 'Core', kind: 'internal', headcount: 27 },
  { id: 'ac-data-ai', code: 'DAI', name: 'Data and AI', kind: 'internal', headcount: 25 },
  { id: 'ac-core-product', code: 'CPRD', name: 'Core Product', kind: 'internal', headcount: 15 },
  { id: 'ac-devops', code: 'DEVO', name: 'DevOps', kind: 'internal', headcount: 12 },
  { id: 'ac-customer-centric', code: 'CCEN', name: 'Customer Centric', kind: 'internal', headcount: 8 },
  { id: 'ac-talent-acquisition', code: 'TALA', name: 'Talent Acquisition', kind: 'internal', headcount: 7 },
  { id: 'ac-implementation', code: 'IMPL', name: 'Implementation', kind: 'internal', headcount: 6 },
  { id: 'ac-cloud-infra', code: 'CINF', name: 'Cloud Infrastructure', kind: 'internal', headcount: 5 },
  { id: 'ac-business-finance', code: 'BFIN', name: 'Business Finance & PA', kind: 'internal', headcount: 5 },
  { id: 'ac-sales', code: 'SALE', name: 'Sales', kind: 'internal', headcount: 4 },
  { id: 'ac-treasury', code: 'TREA', name: 'Treasury Management', kind: 'internal', headcount: 4 },
  { id: 'ac-administration', code: 'ADMN', name: 'Administration & Facilities', kind: 'internal', headcount: 9 },
  { id: 'ac-marketing', code: 'MKTG', name: 'Marketing', kind: 'internal', headcount: 3 },
  { id: 'ac-business-ops', code: 'BOPS', name: 'Business Operations', kind: 'internal', headcount: 3 },
  { id: 'ac-quality-assurance', code: 'QA', name: 'Quality Assurance', kind: 'internal', headcount: 3 },
  { id: 'ac-desktop-admin', code: 'DTOP', name: 'Desktop Admin', kind: 'internal', headcount: 3 },
  { id: 'ac-business-hr', code: 'BHR', name: 'Business HR', kind: 'internal', headcount: 3 },
  { id: 'ac-server-admin', code: 'SRVA', name: 'Server Admin', kind: 'internal', headcount: 3 },
  { id: 'ac-hr-operations', code: 'HROP', name: 'HR Operations', kind: 'internal', headcount: 4 },
  { id: 'ac-presales', code: 'PRES', name: 'PreSales', kind: 'internal', headcount: 3 },
  { id: 'ac-inside-sales', code: 'ISAL', name: 'Inside Sales', kind: 'internal', headcount: 2 },
  { id: 'ac-legal', code: 'LEGL', name: 'Legal', kind: 'internal', headcount: 2 },
  { id: 'ac-ciso', code: 'CISO', name: 'CISO', kind: 'internal', headcount: 2 },
  { id: 'ac-corporate', code: 'CORP', name: 'Corporate', kind: 'internal', headcount: 2 },
  { id: 'ac-network-admin', code: 'NETA', name: 'Network Admin', kind: 'internal', headcount: 2 },
  { id: 'ac-revenue-assurance', code: 'RAAR', name: 'Revenue Assurance & Accounts Receivable', kind: 'internal', headcount: 2 },
  { id: 'ac-vendor-mgmt', code: 'VMAP', name: 'Vendor Management & Accounts Payable', kind: 'internal', headcount: 2 },
  { id: 'ac-email-admin', code: 'EMLA', name: 'E-Mail Admin', kind: 'internal', headcount: 1 },
  { id: 'ac-its', code: 'ITS', name: 'ITS', kind: 'internal', headcount: 1 },
  { id: 'ac-immigration', code: 'IMMI', name: 'Immigration', kind: 'internal', headcount: 1 },
  { id: 'ac-fpa', code: 'FPA', name: 'Financial Planning & Analysis (FP&A)', kind: 'internal', headcount: 1 },
  { id: 'ac-compliance-tax', code: 'CTAX', name: 'Compliance & Tax Management', kind: 'internal', headcount: 1 },
];

export const projects: Project[] = [
  { id: 'pr-mc-ai', accountId: 'ac-mastercard', code: 'MC-AI', name: 'AI Insights' },
  { id: 'pr-aci-pay', accountId: 'ac-aci', code: 'ACI-PAY', name: 'Payments Hub' },
  { id: 'pr-disc-risk', accountId: 'ac-discover', code: 'DISC-RISK', name: 'Risk & Fraud' },
  { id: 'pr-ncr-pos', accountId: 'ac-ncr', code: 'NCR-POS', name: 'ATM / POS Modernisation' },
  { id: 'pr-fisv-pay', accountId: 'ac-fiserv', code: 'FISV-PAY', name: 'Payments Platform' },
  { id: 'pr-internal', accountId: 'ac-core', code: 'INT', name: 'Internal' },
];

// ---------- normalisation + alias resolution (raw Excel string -> canonical id) ----------
const norm = (s?: string) => (s ?? '').toLowerCase().replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const SL_ALIAS: Record<string, string> = {
  'sales ops': 'sl-sales', 'pre sales': 'sl-presales', 'presales': 'sl-presales',
  'server admin': 'sl-it-services', 'network admin': 'sl-it-services', 'desktop admin': 'sl-it-services', 'its': 'sl-it-services',
  'administration': 'sl-administration', 'facilities': 'sl-administration', 'procurement': 'sl-administration',
};
const AC_ALIAS: Record<string, string> = {
  'aci': 'ac-aci', 'aci worldwide': 'ac-aci', 'fiserv': 'ac-fiserv', 'mastercard': 'ac-mastercard', 'ncr': 'ac-ncr', 'ncr atleos': 'ac-ncr',
  'strategic hiring': 'ac-talent-acquisition', 'procurement': 'ac-administration', 'administration & procurement': 'ac-administration',
  'pre sales': 'ac-presales', 'presales': 'ac-presales', 'financial planning & analysis (fp&a)': 'ac-fpa',
};
export const resolveServiceLine = (raw?: string): ServiceLine | undefined => {
  const n = norm(raw); if (!n) return undefined;
  return serviceLines.find((s) => norm(s.name) === n) ?? serviceLines.find((s) => s.id === SL_ALIAS[n]);
};
export const resolveAccount = (raw?: string): Account | undefined => {
  const n = norm(raw); if (!n) return undefined;
  return accounts.find((a) => norm(a.name) === n) ?? accounts.find((a) => a.id === AC_ALIAS[n]);
};

// ---------- real register samples (verbatim from the Excel "Open Office" tab) ----------
// NOTE: occupant names + Emp IDs below are RANDOM SAMPLE data (not the real people from the
// source sheet). Seat #, drawer key, extension, group and account are kept for realism.
const REAL_CABINS = [
  { seat: 'Cab 1', empId: '2000', name: 'Aarav Apte', drawerKey: '3885', ext: '101' },
  { seat: 'Cab 2', empId: '2137', name: 'Aditi Hegde', drawerKey: '3885', ext: '451' },
  { seat: 'Cab 3', empId: '2274', name: 'Akash Oak', drawerKey: '3885', ext: '123' },
  { seat: 'Cab 4', empId: '2411', name: 'Ananya Vaidya', drawerKey: '3885', ext: '666' },
  { seat: 'Cab 5', empId: '2548', name: 'Aniket Dixit', drawerKey: '1374', ext: '' },
  { seat: 'Cab 6', empId: '2685', name: 'Anjali Fernandes', drawerKey: '3885', ext: '' },
];
const REAL_CUBICLES = [
  { seat: 'CU 1', empId: '2822', name: 'Arjun Marathe', drawerKey: '3885', ext: '606' },
  { seat: 'CU 2', empId: '2959', name: 'Avni Tendulkar', drawerKey: '3885', ext: '561' },
  { seat: 'CU 3', empId: '3096', name: 'Dev Barve', drawerKey: '3885', ext: '562' },
  { seat: 'CU 4', empId: '3233', name: 'Diya Desai', drawerKey: '3885', ext: '' },
  { seat: 'CU 5', empId: '3370', name: 'Esha Kamath', drawerKey: '3885', ext: '' },
];
const REAL_WS = [
  { seat: 'WS 025', empId: '3507', name: 'Farhan Rege', group: '', account: 'FiServ', drawerKey: '4774', ext: '4659' },
  { seat: 'WS 049', empId: '3644', name: 'Gaurav Yadav', group: '', account: 'Discover', drawerKey: '1374', ext: '4761' },
  { seat: 'WS 050', empId: '3781', name: 'Harsh Bhatt', group: '', account: 'ACI', drawerKey: '1374', ext: '4659' },
  { seat: 'WS 052', empId: '3918', name: 'Ila Iyer', group: '', account: 'Digital', drawerKey: '1374', ext: '4761' },
  { seat: 'WS 054', empId: '4055', name: 'Ishaan Pai', group: '', account: 'MasterCard', drawerKey: '1374', ext: '4659' },
  { seat: 'WS 126', empId: '4192', name: 'Jaya Wagh', group: 'Cloud Infrastructure', account: 'Cloud Infrastructure', drawerKey: '1374', ext: '411' },
  { seat: 'WS 129', empId: '4329', name: 'Kabir Ghosh', group: 'Core Product', account: 'Core Product', drawerKey: '1374', ext: '400' },
  { seat: 'WS 131', empId: '4466', name: 'Kavya Gokhale', group: 'Customer Centric', account: 'Customer Centric', drawerKey: '1374', ext: '398' },
  { seat: 'WS 137', empId: '4603', name: 'Kiran Nadkarni', group: 'Product', account: 'Marketing', drawerKey: '1374', ext: '491' },
  { seat: 'WS 145', empId: '4740', name: 'Lakshya Upadhyay', group: 'Implementation', account: 'Implementation', drawerKey: '1374', ext: '417' },
  { seat: 'WS 176', empId: '4877', name: 'Maya Chandra', group: 'Domain', account: 'ACI', drawerKey: '1374', ext: '384' },
  { seat: 'WS 197', empId: '5014', name: 'Neil Engineer', group: 'Data and AI', account: 'MasterCard', drawerKey: '3885', ext: '377' },
  { seat: 'WS 204', empId: '5151', name: 'Nidhi Lele', group: 'Core', account: 'NCR Atleos', drawerKey: '3885', ext: '435' },
  { seat: 'WS 205', empId: '5288', name: 'Omkar Sane', group: 'DevOps', account: 'DevOps', drawerKey: '3885', ext: '470' },
  { seat: 'WS 213', empId: '5425', name: 'Pari Zutshi', group: 'Digital', account: 'Discover', drawerKey: '3885', ext: '445' },
  { seat: 'WS 277', empId: '5562', name: 'Pranav Chitnis', group: 'Core', account: 'Core', drawerKey: '3885', ext: '595' },
  { seat: 'WS 334', empId: '5699', name: 'Priya Jain', group: 'Presales', account: 'PreSales', drawerKey: '3885', ext: '715' },
  { seat: 'WS 369', empId: '5836', name: 'Rahul Quereshi', group: 'Sales', account: 'Sales', drawerKey: '3885', ext: '785' },
  { seat: 'WS 379', empId: '5973', name: 'Riya Xavier', group: 'Data and AI', account: 'Data and AI', drawerKey: '3885', ext: '842' },
  { seat: 'WS 389', empId: '6110', name: 'Rohan Apte', group: 'Core', account: 'Network International', drawerKey: '3885', ext: '779' },
  { seat: 'WS 397', empId: '6247', name: 'Saanvi Hegde', group: 'Core', account: 'Shazam', drawerKey: '3885', ext: '847' },
  { seat: 'WS 407', empId: '6384', name: 'Sahil Oak', group: 'Inside Sales', account: 'Inside Sales', drawerKey: '3885', ext: '544' },
  { seat: 'WS 408', empId: '6521', name: 'Sara Vaidya', group: 'Talent Acquisition', account: 'Strategic Hiring', drawerKey: '3885', ext: '543' },
  { seat: 'WS 410', empId: '6658', name: 'Shaan Dixit', group: 'Delivery Operations', account: 'Business Operations', drawerKey: '3885', ext: '541' },
  { seat: 'WS 412', empId: '6795', name: 'Simran Fernandes', group: 'Compliance & Tax Management', account: 'Legal', drawerKey: '3885', ext: '539' },
  { seat: 'WS 413', empId: '6932', name: 'Tanvi Marathe', group: 'Business Finance & PA', account: 'Business Finance & PA', drawerKey: '3885', ext: '856' },
  { seat: 'WS 414', empId: '7069', name: 'Tarun Tendulkar', group: 'Marketing', account: 'Marketing', drawerKey: '3885', ext: '855' },
  { seat: 'WS 436', empId: '7206', name: 'Uday Barve', group: 'GTM & New Sales Support', account: 'DevOps', drawerKey: '3885', ext: '859' },
  { seat: 'WS 442', empId: '7343', name: 'Veer Desai', group: 'Delivery Excellence', account: 'Quality Assurance', drawerKey: '3885', ext: '869' },
  { seat: 'WS 448', empId: '7480', name: 'Vani Kamath', group: 'CISO & DPO', account: 'CISO', drawerKey: '3885', ext: '760' },
  { seat: 'WS 467', empId: '7617', name: 'Yash Rege', group: 'Treasury Management', account: 'Treasury Management', drawerKey: '3885', ext: '756' },
  { seat: 'WS 474', empId: '7754', name: 'Zara Yadav', group: 'Sales Ops', account: 'Sales', drawerKey: '3885', ext: '801' },
  { seat: 'WS 484', empId: '7891', name: 'Naina Bhatt', group: 'DevOps', account: 'Candescent', drawerKey: '3885', ext: '259' },
  { seat: 'WS 545', empId: '8028', name: 'Karthik Iyer', group: '', account: 'Desktop Admin', drawerKey: '3885', ext: '4607' },
  { seat: 'WS 546', empId: '8165', name: 'Meera Pai', group: '', account: 'E-Mail Admin', drawerKey: '3885', ext: '4608' },
  { seat: 'WS 569', empId: '8302', name: 'Nikhil Wagh', group: 'Technology', account: 'Discover', drawerKey: '3885', ext: '165' },
  { seat: 'WS 591', empId: '8439', name: 'Pooja Ghosh', group: 'Administration', account: 'Procurement', drawerKey: '3885', ext: '140' },
  { seat: 'WS 612', empId: '8576', name: 'Raj Gokhale', group: 'Network Admin', account: 'Network Admin', drawerKey: '3885', ext: '720' },
  { seat: 'WS 614', empId: '8713', name: 'Sneha Nadkarni', group: 'ITS', account: 'ITS', drawerKey: '3885', ext: '185' },
  { seat: 'WS 618', empId: '8850', name: 'Aarav Upadhyay', group: 'HR Operations', account: 'HR Operations', drawerKey: '3885', ext: '189' },
];

// ---------- phase/area capacity (Main Data tab) ----------
const AREA_DEFS = [
  { id: 'area-f1-p1', floorId: 'floor-1', name: 'Phase I', phase: '1st floor - Phase I', capWs: 81, capCub: 4, capCab: 0, capTotal: 85, occTotal: 75, vacTotal: 10, occPct: 88 },
  { id: 'area-f1-p2-ic-u1', floorId: 'floor-1', name: 'Innovation Centre - Unit I', phase: '1st floor - Phase II - Innovation centre - UNIT I', capWs: 24, capCub: 1, capCab: 0, capTotal: 25, occTotal: 21, vacTotal: 4, occPct: 84 },
  { id: 'area-f1-p2-ic-u2', floorId: 'floor-1', name: 'Innovation Centre - Unit II', phase: '1st floor - Phase II - Innovation centre - UNIT II', capWs: 19, capCub: 0, capCab: 0, capTotal: 19, occTotal: 15, vacTotal: 4, occPct: 79 },
  { id: 'area-f1-p2-ic-u3', floorId: 'floor-1', name: 'Innovation Centre - Unit III', phase: '1st floor - Phase II - Innovation centre - UNIT III', capWs: 19, capCub: 1, capCab: 0, capTotal: 20, occTotal: 1, vacTotal: 19, occPct: 5 },
  { id: 'area-f1-p2-open', floorId: 'floor-1', name: 'Open Office', phase: '1st floor - Phase II - Open Office', capWs: 120, capCub: 0, capCab: 0, capTotal: 120, occTotal: 114, vacTotal: 6, occPct: 95 },
  { id: 'area-f1-p3-odc-dev', floorId: 'floor-1', name: 'Cardtronics ODC - Development Centre', phase: '1st floor - Phase III - Cardtronics ODC - Development centre', capWs: 105, capCub: 0, capCab: 0, capTotal: 105, occTotal: 61, vacTotal: 44, occPct: 58 },
  { id: 'area-f1-p3-odc-prod', floorId: 'floor-1', name: 'Cardtronics ODC - Production Support', phase: '1st floor - Phase III - Cardtronics ODC - Production support', capWs: 47, capCub: 0, capCab: 0, capTotal: 47, occTotal: 33, vacTotal: 14, occPct: 70 },
  { id: 'area-f2-p1', floorId: 'floor-2', name: 'Phase I', phase: '2nd floor - Phase I', capWs: 110, capCub: 4, capCab: 1, capTotal: 115, occTotal: 99, vacTotal: 16, occPct: 86 },
  { id: 'area-f2-p2', floorId: 'floor-2', name: 'Phase II', phase: '2nd floor - Phase II', capWs: 109, capCub: 4, capCab: 0, capTotal: 113, occTotal: 72, vacTotal: 41, occPct: 64 },
];
export const areas: Area[] = AREA_DEFS.map((a) => ({ ...a }));

// area -> a representative service line / account for canvas colouring + generated seats
const AREA_SL: Record<string, string> = {
  'area-f1-p1': 'sl-core', 'area-f1-p2-ic-u1': 'sl-data-ai', 'area-f1-p2-ic-u2': 'sl-core-product', 'area-f1-p2-ic-u3': 'sl-digital',
  'area-f1-p2-open': 'sl-digital', 'area-f1-p3-odc-dev': 'sl-devops', 'area-f1-p3-odc-prod': 'sl-it-services', 'area-f2-p1': 'sl-core', 'area-f2-p2': 'sl-customer-centric',
};
const AREA_AC: Record<string, string> = {
  'area-f1-p1': 'ac-mastercard', 'area-f1-p2-ic-u1': 'ac-data-ai', 'area-f1-p2-ic-u2': 'ac-core-product', 'area-f1-p2-ic-u3': 'ac-digital',
  'area-f1-p2-open': 'ac-aci', 'area-f1-p3-odc-dev': 'ac-ncr', 'area-f1-p3-odc-prod': 'ac-ncr', 'area-f2-p1': 'ac-discover', 'area-f2-p2': 'ac-candescent',
};

// ---------- generated occupant name pool (for the seats the register doesn't name individually) ----------
const G_FIRST = ['Aarav', 'Vihaan', 'Anaya', 'Ishaan', 'Kabir', 'Saanvi', 'Reyansh', 'Myra', 'Vivaan', 'Aadhya', 'Krishna', 'Ayaan', 'Riya', 'Arnav', 'Sara', 'Dhruv', 'Anika', 'Yash', 'Tara', 'Kiaan', 'Pooja', 'Rohan', 'Nisha', 'Aniket', 'Sneha', 'Omkar', 'Prachi', 'Tejas', 'Gauri', 'Harsh'];
const G_LAST = ['Deshpande', 'Kulkarni', 'Patil', 'Jadhav', 'Pawar', 'Shinde', 'More', 'Kale', 'Gaikwad', 'Bhosale', 'Naik', 'Salunkhe', 'Chavan', 'Joshi', 'Phadke', 'Kelkar', 'Ranade', 'Kamat', 'Mhatre', 'Sawant'];

// ---------- floor + zone + desk + register generation (area-aware layout) ----------
const FLOOR_META = [
  { id: 'floor-1', code: 'F1', name: '1st Floor', levelNo: 1 },
  { id: 'floor-2', code: 'F2', name: '2nd Floor', levelNo: 2 },
];
const FLOOR_W = 1860;
const DK_W = 22, DK_H = 16, DK_GX = 7, DK_GY = 11, BLK_PAD = 16, BLK_HEAD = 24, BLK_GX = 34, BLK_GY = 40, ORIGIN_X = 36, ORIGIN_Y = 90;

// weighted pools (proportional to real headcount) for generated occupied seats
const slPool: string[] = serviceLines.flatMap((s) => Array(Math.max(1, Math.round((s.headcount ?? 1) / 6))).fill(s.id));
const clientAcs = accounts.filter((a) => a.kind === 'client');
const acPool: string[] = accounts.flatMap((a) => Array(Math.max(1, Math.round((a.headcount ?? 1) / 6))).fill(a.id));

const colsFor = (n: number) => Math.min(15, Math.max(4, Math.round(Math.sqrt(n * 1.7))));

const usedSeatNos = new Set<string>([...REAL_WS.map((w) => w.seat), ...REAL_CABINS.map((c) => c.seat), ...REAL_CUBICLES.map((c) => c.seat)]);
let wsCounter = 0;
const nextWsNo = () => { let s = ''; do { wsCounter += 1; s = `WS ${String(wsCounter).padStart(3, '0')}`; } while (usedSeatNos.has(s)); usedSeatNos.add(s); return s; };

const seatRegister: SeatRegisterRow[] = [];
const desks: Desk[] = [];
const zones: Zone[] = [];
const floorHeights: Record<string, number> = {};

const wsSampleQueue = [...REAL_WS];
let cabIdx = 0, cubIdx = 0, genIdx = 0, poolIdx = 0;

function pushSeat(opts: {
  area: typeof AREA_DEFS[number]; kind: DeskKind; occupied: boolean; geo: { x: number; y: number };
  real?: { seat: string; empId: string; name: string; drawerKey: string; ext: string; group?: string; account?: string };
}) {
  const { area, kind, occupied, geo } = opts;
  const idx = seatRegister.length;
  let seatNo: string, empId: string | undefined, occupantName: string | undefined, drawerKey: string | undefined, extNumber: string | undefined;
  let rawGroup: string | undefined, rawAccount: string | undefined, slId: string | undefined, acId: string | undefined;

  if (opts.real) {
    const r = opts.real;
    seatNo = r.seat; empId = r.empId || undefined; occupantName = r.name; drawerKey = r.drawerKey || undefined; extNumber = r.ext || undefined;
    rawGroup = r.group || undefined; rawAccount = r.account || undefined;
    slId = resolveServiceLine(r.group)?.id ?? (r.account ? resolveAccount(r.account)?.id && resolveServiceLine(r.account)?.id : undefined) ?? AREA_SL[area.id];
    acId = resolveAccount(r.account)?.id ?? AREA_AC[area.id];
  } else if (occupied) {
    seatNo = kind === 'cabin' ? `Cab ${++cabIdx}` : kind === 'cubicle' ? `CU ${++cubIdx}` : nextWsNo();
    occupantName = `${G_FIRST[genIdx % G_FIRST.length]} ${G_LAST[(genIdx * 7) % G_LAST.length]}`; genIdx += 1;
    empId = String(4200 + idx);
    slId = slPool[poolIdx % slPool.length]; acId = acPool[(poolIdx * 3) % acPool.length]; poolIdx += 1;
    rawGroup = serviceLines.find((s) => s.id === slId)?.name; rawAccount = accounts.find((a) => a.id === acId)?.name;
    drawerKey = ['3885', '1374', '4774'][idx % 3]; extNumber = String(100 + (idx % 800));
  } else {
    seatNo = kind === 'cabin' ? `Cab ${++cabIdx}` : kind === 'cubicle' ? `CU ${++cubIdx}` : nextWsNo();
    slId = AREA_SL[area.id];
  }

  const deskId = `desk-${area.id}-${idx}`;
  const deskType: DeskType = kind === 'cabin' || kind === 'cubicle' ? 'fixed' : 'flexible';
  const deskState: DeskState = occupied ? 'allocated' : 'available';
  seatRegister.push({
    id: `reg-${idx}`, floorId: area.floorId, areaId: area.id, zoneId: area.id, deskId,
    empId, deskKind: kind, seatNo, drawerKey, occupantName: occupied ? occupantName : undefined, extNumber,
    serviceLineId: slId, accountId: acId, rawGroup, rawAccount, isVacant: !occupied,
  });
  desks.push({
    id: deskId, floorId: area.floorId, zoneId: area.id, areaId: area.id, serviceLineId: slId, accountId: acId, deskNo: seatNo,
    deskType, deskKind: kind, deskState,
    empId, occupantName: occupied ? occupantName : undefined, drawerKey, extNumber, isVacant: !occupied,
    hasMonitor: true, hasDock: idx % 3 === 0, isStanding: idx % 23 === 0, isAccessible: idx % 17 === 0,
    amenities: idx % 2 === 0 ? ['monitor', 'dock'] : ['monitor'],
    monthlyCost: kind === 'cabin' ? 9800 : kind === 'cubicle' ? 6400 : 4200 + (idx % 5) * 150,
    geometry: { x: geo.x, y: geo.y, w: DK_W, h: DK_H, rot: 0 },
    isBookable: !occupied,
  });
}

for (const fm of FLOOR_META) {
  const fAreas = AREA_DEFS.filter((a) => a.floorId === fm.id);
  let cx = ORIGIN_X, cy = ORIGIN_Y, rowMaxH = 0;
  for (const area of fAreas) {
    const cols = colsFor(area.capTotal);
    const rows = Math.ceil(area.capTotal / cols);
    const blockW = cols * (DK_W + DK_GX) - DK_GX + BLK_PAD * 2;
    const blockH = BLK_HEAD + rows * (DK_H + DK_GY) - DK_GY + BLK_PAD * 2;
    if (cx + blockW > FLOOR_W && cx > ORIGIN_X) { cx = ORIGIN_X; cy += rowMaxH + BLK_GY; rowMaxH = 0; }
    const bx = cx, by = cy;
    // kind plan: only Phase-I floor-1 hosts the real cabins+cubicles; others all-workstation
    const cabN = area.id === 'area-f1-p1' ? REAL_CABINS.length : 0;
    const cubN = area.id === 'area-f1-p1' ? REAL_CUBICLES.length : 0;
    for (let i = 0; i < area.capTotal; i++) {
      const gx = bx + BLK_PAD + (i % cols) * (DK_W + DK_GX);
      const gy = by + BLK_HEAD + Math.floor(i / cols) * (DK_H + DK_GY);
      const occupied = i < area.occTotal;
      let kind: DeskKind = 'workstation';
      let real: typeof REAL_WS[number] | typeof REAL_CABINS[number] | undefined;
      if (i < cabN) { kind = 'cabin'; real = REAL_CABINS[cabIdx]; }
      else if (i < cabN + cubN) { kind = 'cubicle'; real = REAL_CUBICLES[cubIdx]; }
      else if (occupied && wsSampleQueue.length) { kind = 'workstation'; real = wsSampleQueue.shift(); }
      pushSeat({ area, kind, occupied, geo: { x: gx, y: gy }, real: real as any });
    }
    zones.push({
      id: area.id, companyId: 'co-opus', floorId: area.floorId, areaId: area.id, serviceLineId: AREA_SL[area.id], accountId: AREA_AC[area.id],
      kind: 'zone', code: area.id.toUpperCase(), name: area.name, colorHex: serviceLines.find((s) => s.id === AREA_SL[area.id])?.colorHex ?? '#64748b',
      bbox: { x: bx, y: by, w: blockW, h: blockH, rot: 0 }, capacity: area.capTotal, status: 'active',
      phase: area.phase, capWs: area.capWs, capCub: area.capCub, capCab: area.capCab, occupied: area.occTotal, vacant: area.vacTotal,
    });
    cx += blockW + BLK_GX; rowMaxH = Math.max(rowMaxH, blockH);
  }
  floorHeights[fm.id] = cy + rowMaxH + 60;
}

export { desks, zones, seatRegister };

// ---------- floors (dimensions sized to the generated area layout) ----------
export const floors: Floor[] = FLOOR_META.map((fm) => ({
  id: fm.id, companyId: 'co-opus', buildingId: 'bld-pun', code: fm.code, name: fm.name, levelNo: fm.levelNo,
  widthPx: FLOOR_W + 40, heightPx: Math.max(720, floorHeights[fm.id] ?? 720), scaleCmPerPx: 3.2,
  totalDesks: desks.filter((d) => d.floorId === fm.id).length, totalRooms: 0, status: 'active',
}));

// ---------- meeting rooms (music-genre named + numbered, from the Meeting Rooms tab) ----------
const ROOM_DEFS = [
  { id: 'room-1', floorId: 'floor-1', roomNo: 'MR-001', name: 'Reggae', capacity: 2, kind: 'phone_booth', location: 'Development Area', status: 'available' as MeetingRoomStatus, equipment: ['TV'] },
  { id: 'room-2', floorId: 'floor-1', roomNo: 'MR-002', name: 'Jazz', capacity: 4, kind: 'meeting', location: 'Development Area', status: 'in_use' as MeetingRoomStatus, equipment: ['TV', 'Whiteboard'] },
  { id: 'room-3', floorId: 'floor-1', roomNo: '4084', name: 'Room 4084', capacity: 4, kind: 'meeting', location: 'Development Area', status: 'booked' as MeetingRoomStatus, equipment: ['TV', 'Whiteboard'] },
  { id: 'room-4', floorId: 'floor-1', roomNo: 'MR-003', name: 'Techno', capacity: 4, kind: 'meeting', location: 'Development Area', status: 'available' as MeetingRoomStatus, equipment: ['TV', 'Whiteboard'] },
  { id: 'room-5', floorId: 'floor-1', roomNo: '4083', name: 'Room 4083', capacity: 4, kind: 'meeting', location: 'Development Area', status: 'maintenance' as MeetingRoomStatus, equipment: ['TV', 'Whiteboard'] },
  { id: 'room-6', floorId: 'floor-1', roomNo: 'MR-004', name: 'Rock', capacity: 4, kind: 'meeting', location: 'Optimus Area', status: 'available' as MeetingRoomStatus, equipment: ['TV', 'Whiteboard'] },
  { id: 'room-7', floorId: 'floor-1', roomNo: '4142', name: 'Room 4142', capacity: 4, kind: 'meeting', location: 'Production Support', status: 'available' as MeetingRoomStatus, equipment: ['TV', 'Whiteboard'] },
  { id: 'room-8', floorId: 'floor-1', roomNo: 'MR-005', name: 'Blues', capacity: 4, kind: 'meeting', location: 'Innovation Centre', status: 'in_use' as MeetingRoomStatus, equipment: ['TV', 'Whiteboard'] },
  { id: 'room-9', floorId: 'floor-1', roomNo: '4144', name: 'Room 4144', capacity: 5, kind: 'meeting', location: 'Production Support', status: 'booked' as MeetingRoomStatus, equipment: ['TV', 'Whiteboard'] },
  { id: 'room-10', floorId: 'floor-1', roomNo: 'MR-006', name: 'Chant', capacity: 6, kind: 'meeting', location: 'Open office, Ph-2', status: 'available' as MeetingRoomStatus, equipment: ['TV', 'VC', 'Whiteboard'] },
  { id: 'room-11', floorId: 'floor-1', roomNo: 'MR-007', name: 'Acoustic', capacity: 2, kind: 'phone_booth', location: 'Innovation Centre', status: 'maintenance' as MeetingRoomStatus, equipment: ['TV'] },
  { id: 'room-12', floorId: 'floor-1', roomNo: 'MR-008', name: 'Classical', capacity: 10, kind: 'meeting', location: 'Open office, Ph-2', status: 'available' as MeetingRoomStatus, equipment: ['TV', 'VC', 'Whiteboard'] },
  { id: 'room-13', floorId: 'floor-1', roomNo: '4148', name: 'Room 4148', capacity: 5, kind: 'meeting', location: 'Innovation Centre', status: 'available' as MeetingRoomStatus, equipment: ['TV', 'Whiteboard'] },
  { id: 'room-14', floorId: 'floor-2', roomNo: 'MR-009', name: 'Country', capacity: 10, kind: 'meeting', location: 'Opp. Network room', status: 'in_use' as MeetingRoomStatus, equipment: ['TV', 'VC', 'Whiteboard'] },
  { id: 'room-15', floorId: 'floor-1', roomNo: '4149', name: 'Room 4149', capacity: 5, kind: 'meeting', location: 'Innovation Centre', status: 'booked' as MeetingRoomStatus, equipment: ['TV', 'Whiteboard'] },
  { id: 'room-16', floorId: 'floor-2', roomNo: 'MR-010', name: 'Hiphop', capacity: 4, kind: 'meeting', location: 'Open office, opp. 10 pax mtg room', status: 'available' as MeetingRoomStatus, equipment: ['TV', 'Whiteboard'] },
  { id: 'room-17', floorId: 'floor-1', roomNo: '3243', name: 'Room 3243', capacity: 10, kind: 'meeting', location: 'Innovation Centre', status: 'maintenance' as MeetingRoomStatus, equipment: ['TV', 'VC', 'Whiteboard'] },
  { id: 'room-18', floorId: 'floor-2', roomNo: 'MR-011', name: 'R&B', capacity: 4, kind: 'meeting', location: 'Open office, opp. 10 pax mtg room', status: 'available' as MeetingRoomStatus, equipment: ['TV', 'Whiteboard'] },
  { id: 'room-19', floorId: 'floor-1', roomNo: '4150', name: 'Room 4150', capacity: 8, kind: 'meeting', location: 'Opp. Innovation centre reception', status: 'available' as MeetingRoomStatus, equipment: ['TV', 'VC', 'Whiteboard'] },
  { id: 'room-20', floorId: 'floor-2', roomNo: 'MR-012', name: 'Metal', capacity: 4, kind: 'meeting', location: 'Opp. Phonebooth', status: 'in_use' as MeetingRoomStatus, equipment: ['TV', 'Whiteboard'] },
  { id: 'room-21', floorId: 'floor-2', roomNo: '4152', name: 'Room 4152', capacity: 10, kind: 'meeting', location: 'Opp. Network room', status: 'booked' as MeetingRoomStatus, equipment: ['TV', 'VC', 'Whiteboard'] },
  { id: 'room-22', floorId: 'floor-2', roomNo: 'MR-013', name: 'Progressive', capacity: 4, kind: 'meeting', location: 'Opp. Phonebooth', status: 'available' as MeetingRoomStatus, equipment: ['TV', 'Whiteboard'] },
  { id: 'room-23', floorId: 'floor-2', roomNo: '4154', name: 'Room 4154', capacity: 4, kind: 'meeting', location: 'Open office, opp. 10 pax mtg room', status: 'maintenance' as MeetingRoomStatus, equipment: ['TV', 'Whiteboard'] },
  { id: 'room-24', floorId: 'floor-2', roomNo: 'MR-014', name: 'Concerto', capacity: 10, kind: 'meeting', location: 'Next to HR Store (Emergency exit)', status: 'available' as MeetingRoomStatus, equipment: ['TV', 'VC', 'Whiteboard'] },
  { id: 'room-25', floorId: 'floor-2', roomNo: '4156', name: 'Room 4156', capacity: 4, kind: 'meeting', location: 'Open office, opp. 10 pax mtg room', status: 'available' as MeetingRoomStatus, equipment: ['TV', 'Whiteboard'] },
  { id: 'room-26', floorId: 'floor-2', roomNo: 'MR-015', name: 'EDM', capacity: 4, kind: 'meeting', location: 'Next to HR Store (Emergency exit)', status: 'in_use' as MeetingRoomStatus, equipment: ['TV', 'Whiteboard'] },
  { id: 'room-27', floorId: 'floor-2', roomNo: '4157', name: 'Room 4157', capacity: 4, kind: 'meeting', location: 'Opp. Phonebooth', status: 'booked' as MeetingRoomStatus, equipment: ['TV', 'Whiteboard'] },
  { id: 'room-28', floorId: 'floor-2', roomNo: 'MR-016', name: 'Opera', capacity: 16, kind: 'board', location: 'Next to Training room', status: 'available' as MeetingRoomStatus, equipment: ['TV', 'VC', 'Whiteboard', 'Mics'] },
  { id: 'room-29', floorId: 'floor-2', roomNo: '4159', name: 'Room 4159', capacity: 4, kind: 'meeting', location: 'Opp. Phonebooth', status: 'maintenance' as MeetingRoomStatus, equipment: ['TV', 'Whiteboard'] },
  { id: 'room-30', floorId: 'floor-2', roomNo: 'MR-017', name: 'Symphony', capacity: 40, kind: 'training', location: 'Training room', status: 'available' as MeetingRoomStatus, equipment: ['TV', 'VC', 'Whiteboard', 'Mics'] },
  { id: 'room-31', floorId: 'floor-2', roomNo: 'MR-018', name: 'Concerto II', capacity: 10, kind: 'meeting', location: 'Next to HR Store (Emergency exit)', status: 'available' as MeetingRoomStatus, equipment: ['TV', 'VC', 'Whiteboard'] },
  { id: 'room-32', floorId: 'floor-2', roomNo: 'MR-019', name: 'Magnum', capacity: 20, kind: 'board', location: 'Board room', status: 'in_use' as MeetingRoomStatus, equipment: ['TV', 'VC', 'Whiteboard', 'Mics'] },
  { id: 'room-33', floorId: 'floor-2', roomNo: '3555', name: 'Room 3555', capacity: 5, kind: 'meeting', location: 'Next to HR Store (Emergency exit)', status: 'booked' as MeetingRoomStatus, equipment: ['TV', 'Whiteboard'] },
  { id: 'room-34', floorId: 'floor-2', roomNo: 'MR-020', name: 'New Wave', capacity: 6, kind: 'meeting', location: 'Next to Mobile lab', status: 'available' as MeetingRoomStatus, equipment: ['TV', 'VC', 'Whiteboard'] },
  { id: 'room-35', floorId: 'floor-2', roomNo: '1511', name: 'Room 1511', capacity: 16, kind: 'board', location: 'Next to Training room', status: 'maintenance' as MeetingRoomStatus, equipment: ['TV', 'VC', 'Whiteboard', 'Mics'] },
  { id: 'room-36', floorId: 'floor-2', roomNo: 'MR-021', name: 'Trance', capacity: 4, kind: 'meeting', location: 'Next to Mobile lab', status: 'available' as MeetingRoomStatus, equipment: ['TV', 'Whiteboard'] },
  { id: 'room-37', floorId: 'floor-2', roomNo: '4164', name: 'Room 4164', capacity: 40, kind: 'training', location: 'Training room', status: 'available' as MeetingRoomStatus, equipment: ['TV', 'VC', 'Whiteboard', 'Mics'] },
  { id: 'room-38', floorId: 'floor-2', roomNo: 'MR-022', name: 'Fusion', capacity: 4, kind: 'meeting', location: 'Next to Server room', status: 'in_use' as MeetingRoomStatus, equipment: ['TV', 'Whiteboard'] },
  { id: 'room-39', floorId: 'floor-2', roomNo: '4166', name: 'Room 4166', capacity: 20, kind: 'board', location: 'Board room', status: 'booked' as MeetingRoomStatus, equipment: ['TV', 'VC', 'Whiteboard', 'Mics'] },
  { id: 'room-40', floorId: 'floor-2', roomNo: 'MR-023', name: 'Instrumental', capacity: 4, kind: 'meeting', location: 'Next to AHU', status: 'available' as MeetingRoomStatus, equipment: ['TV', 'Whiteboard'] },
  { id: 'room-41', floorId: 'floor-2', roomNo: '4168', name: 'Room 4168', capacity: 6, kind: 'meeting', location: 'Next to Mobile lab', status: 'maintenance' as MeetingRoomStatus, equipment: ['TV', 'VC', 'Whiteboard'] },
  { id: 'room-42', floorId: 'floor-2', roomNo: 'MR-024', name: 'Orchestra', capacity: 4, kind: 'meeting', location: 'Opp.Mobile lab', status: 'available' as MeetingRoomStatus, equipment: ['TV', 'Whiteboard'] },
  { id: 'room-43', floorId: 'floor-2', roomNo: '4170', name: 'Room 4170', capacity: 4, kind: 'meeting', location: 'Next to Mobile lab', status: 'available' as MeetingRoomStatus, equipment: ['TV', 'Whiteboard'] },
  { id: 'room-44', floorId: 'floor-2', roomNo: 'MR-025', name: 'Dubstep', capacity: 4, kind: 'meeting', location: 'Nr.Reception', status: 'in_use' as MeetingRoomStatus, equipment: ['TV', 'Whiteboard'] },
  { id: 'room-45', floorId: 'floor-2', roomNo: '4171', name: 'Room 4171', capacity: 4, kind: 'meeting', location: 'Next to Server room', status: 'booked' as MeetingRoomStatus, equipment: ['TV', 'Whiteboard'] },
  { id: 'room-46', floorId: 'floor-2', roomNo: '4173', name: 'Room 4173', capacity: 4, kind: 'meeting', location: 'Next to AHU', status: 'available' as MeetingRoomStatus, equipment: ['TV', 'Whiteboard'] },
  { id: 'room-47', floorId: 'floor-2', roomNo: '4175', name: 'Room 4175', capacity: 4, kind: 'meeting', location: 'Opp.Mobile lab', status: 'maintenance' as MeetingRoomStatus, equipment: ['TV', 'Whiteboard'] },
  { id: 'room-48', floorId: 'floor-2', roomNo: '4177', name: 'Room 4177', capacity: 4, kind: 'meeting', location: 'Nr.Reception', status: 'available' as MeetingRoomStatus, equipment: ['TV', 'Whiteboard'] },
  { id: 'room-49', floorId: 'floor-2', roomNo: '4179', name: 'Room 4179', capacity: 4, kind: 'meeting', location: 'Nr.Reception', status: 'available' as MeetingRoomStatus, equipment: ['TV', 'Whiteboard'] },
];
export const meetingRooms: MeetingRoom[] = ROOM_DEFS.map((r, i) => ({
  id: r.id, floorId: r.floorId, roomNo: r.roomNo, name: r.name, capacity: r.capacity, kind: r.kind as MeetingRoom['kind'],
  location: r.location, equipment: r.equipment, status: r.status,
  outlookResourceEmail: `${r.name.toLowerCase().replace(/[^a-z0-9]+/g, '.')}@opustechglobal.com`,
  geometry: { x: 30 + (i % 12) * 150, y: 24 + Math.floor(i / 12) * 60, w: 130, h: 44, rot: 0 },
}));
floors.forEach((f) => { f.totalRooms = meetingRooms.filter((r) => r.floorId === f.id).length; });

// ---------- structural space elements ----------
export const spaceElements: SpaceElement[] = floors.flatMap((f) => ([
  { id: `se-${f.id}-wall-n`, floorId: f.id, kind: 'wall' as const, geometry: { x: 20, y: 70, w: f.widthPx - 40, h: 8, rot: 0 }, zIndex: 0, isBookable: false, status: 'active' as const },
  { id: `se-${f.id}-wall-s`, floorId: f.id, kind: 'wall' as const, geometry: { x: 20, y: f.heightPx - 20, w: f.widthPx - 40, h: 8, rot: 0 }, zIndex: 0, isBookable: false, status: 'active' as const },
  { id: `se-${f.id}-reception`, floorId: f.id, kind: 'reception' as const, label: 'Reception', geometry: { x: 30, y: 24, w: 160, h: 36, rot: 0 }, zIndex: 1, isBookable: false, status: 'active' as const },
]));

// ---------- register-derived exports ----------
export const registerStats = {
  total: seatRegister.length,
  vacant: seatRegister.filter((r) => r.isVacant).length,
  occupied: seatRegister.filter((r) => !r.isVacant).length,
  byKind: {
    workstation: seatRegister.filter((r) => r.deskKind === 'workstation').length,
    cubicle: seatRegister.filter((r) => r.deskKind === 'cubicle').length,
    cabin: seatRegister.filter((r) => r.deskKind === 'cabin').length,
  } as Record<DeskKind, number>,
};

// ---------- capacity summary (Main Data: per-area + floor subtotal + grand total) ----------
const grandFromAreas = (rows: typeof AREA_DEFS) => rows.reduce((a, r) => ({ capWs: a.capWs + r.capWs, capCub: a.capCub + r.capCub, capCab: a.capCab + r.capCab, capTotal: a.capTotal + r.capTotal, occTotal: a.occTotal + r.occTotal, vacTotal: a.vacTotal + r.vacTotal }), { capWs: 0, capCub: 0, capCab: 0, capTotal: 0, occTotal: 0, vacTotal: 0 });
export const capacitySummary: CapacityRow[] = (() => {
  const out: CapacityRow[] = [];
  for (const fm of FLOOR_META) {
    const fAreas = AREA_DEFS.filter((a) => a.floorId === fm.id);
    fAreas.forEach((a) => out.push({ id: `cap-${a.id}`, floorId: a.floorId, area: a.name, phase: a.phase, capWs: a.capWs, capCub: a.capCub, capCab: a.capCab, capTotal: a.capTotal, occTotal: a.occTotal, vacTotal: a.vacTotal, occPct: a.occPct }));
    const t = grandFromAreas(fAreas);
    out.push({ id: `cap-total-${fm.id}`, floorId: fm.id, area: `Total — ${fm.name}`, phase: `Total — ${fm.name}`, ...t, occPct: Math.round((t.occTotal / t.capTotal) * 100), isTotalRow: true });
  }
  const g = grandFromAreas(AREA_DEFS);
  out.push({ id: 'cap-grand', floorId: 'all', area: 'Grand Total', phase: 'Grand Total', ...g, occPct: Math.round((g.occTotal / g.capTotal) * 100), isTotalRow: true });
  return out;
})();
export const capacityGrandTotal = capacitySummary.find((c) => c.id === 'cap-grand')!;

// ---------- employees (real register names; ids preserved as emp-### for downstream refs) ----------
const REAL_PEOPLE = [
  ...REAL_CABINS.map((c) => ({ name: c.name, empId: c.empId, slId: 'sl-corporate', acId: 'ac-corporate', ext: c.ext })),
  ...REAL_CUBICLES.map((c) => ({ name: c.name, empId: c.empId, slId: 'sl-administration', acId: 'ac-administration', ext: c.ext })),
  ...REAL_WS.map((w) => ({ name: w.name, empId: w.empId, slId: resolveServiceLine(w.group)?.id ?? resolveServiceLine(w.account)?.id ?? 'sl-core', acId: resolveAccount(w.account)?.id ?? 'ac-core', ext: w.ext })),
];
const GRADES = ['E1', 'E2', 'M1', 'M2', 'M3'];
const TITLES = ['Engineer', 'Sr Engineer', 'Lead', 'Manager', 'Sr Manager'];
const fixedDesks = desks.filter((d) => d.deskType === 'fixed');
const EMP_COUNT = 60;
export const employees: Employee[] = Array.from({ length: EMP_COUNT }, (_, i) => {
  const rp = REAL_PEOPLE[i];
  const name = rp ? rp.name : `${G_FIRST[(i * 5) % G_FIRST.length]} ${G_LAST[(i * 3) % G_LAST.length]}`;
  const gradeIdx = i % 5 === 0 ? 4 : i % 3 === 0 ? 3 : i % 5;
  const priority = (gradeIdx >= 4 ? 'p1' : gradeIdx === 3 ? 'p2' : gradeIdx === 2 ? 'p3' : 'p4') as Employee['priority'];
  const slId = rp?.slId ?? serviceLines[i % serviceLines.length].id;
  const acId = rp?.acId ?? accounts[i % accounts.length].id;
  return {
    id: `emp-${String(i + 1).padStart(3, '0')}`, empNo: rp?.empId || `${5000 + i}`, name,
    email: `${name.toLowerCase().replace(/[^a-z]+/g, '.').replace(/^\.|\.$/g, '')}@opustechglobal.com`,
    grade: GRADES[gradeIdx], title: TITLES[gradeIdx],
    serviceLineId: slId, accountId: acId, projectId: projects[i % projects.length].id,
    managerId: i > 4 ? `emp-${String((i % 5) + 1).padStart(3, '0')}` : undefined,
    homeOfficeId: 'off-pun', homeDeskId: i < fixedDesks.length ? fixedDesks[i].id : undefined,
    priority, status: 'active',
  };
});

// ---------- allocations (fixed cabins/cubicles -> owners) ----------
export const allocations: Allocation[] = fixedDesks.map((d, i) => ({
  id: `alloc-${i + 1}`, deskId: d.id, employeeId: employees.find((e) => e.homeDeskId === d.id)?.id,
  allocType: 'permanent', priority: 'p2', validFrom: '2026-01-01', status: 'active',
}));

// ---------- bookings (bookable/vacant desks; various statuses; today + window) ----------
const flexDesks = desks.filter((d) => d.isBookable);
const TODAY = '2026-06-05';
const bkStatuses: Booking['status'][] = ['booked', 'checked_in', 'held', 'completed', 'cancelled', 'no_show', 'booked'];
const bkKinds: Booking['kind'][] = ['full_day', 'half_day', 'hourly', 'multi_day'];
export const bookings: Booking[] = flexDesks.slice(0, 28).map((d, i) => {
  const status = bkStatuses[i % bkStatuses.length];
  const kind = bkKinds[i % bkKinds.length];
  const emp = employees[i % employees.length];
  const day = i % 3 === 0 ? TODAY : addDays(TODAY, (i % 14) + 1);
  return {
    id: `bk-${String(i + 1).padStart(3, '0')}`, code: `BK-${1000 + i}`, deskId: d.id, employeeId: emp.id,
    kind, startsAt: `${day}T09:30:00+05:30`, endsAt: `${day}T18:00:00+05:30`,
    status, priority: emp.priority, source: i % 2 === 0 ? 'web' : 'qr',
    holdExpiresAt: status === 'held' ? `${TODAY}T09:45:00+05:30` : undefined,
    qrToken: `QR-${d.deskNo}`, checkedInAt: status === 'checked_in' ? `${day}T09:35:00+05:30` : undefined,
  };
});
bookings.push({ id: 'bk-room-1', code: 'BK-2001', meetingRoomId: 'room-32', employeeId: 'emp-004', organiserId: 'emp-004', title: 'Delivery sync', partySize: 14, kind: 'hourly', startsAt: `${TODAY}T11:00:00+05:30`, endsAt: `${TODAY}T12:00:00+05:30`, status: 'booked', priority: 'p2', source: 'teams' });

export const bookingHolds: BookingHold[] = bookings.filter((b) => b.status === 'held' && b.deskId).map((b) => ({ id: `hold-${b.id}`, deskId: b.deskId!, slot: `${b.startsAt}/${b.endsAt}`, heldByEmployeeId: b.employeeId, expiresAt: b.holdExpiresAt! }));

export const qrCodes: QrCode[] = desks.slice(0, 30).map((d) => ({ id: `qr-${d.id}`, kind: 'desk', targetId: d.id, token: `QR-${d.deskNo}`, url: `/workspace/qr?t=QR-${d.deskNo}`, isActive: true }));

export const visitors: Visitor[] = [
  { id: 'vis-1', kind: 'visitor', fullName: 'James Carter', org: 'Mastercard Inc.', hostEmployeeId: 'emp-002', officeId: 'off-pun', deskId: flexDesks[40]?.id, expectedFrom: `${TODAY}T10:00:00+05:30`, expectedTo: `${TODAY}T17:00:00+05:30`, status: 'expected', badgeNo: 'V-1024', purpose: 'Client review' },
  { id: 'vis-2', kind: 'contractor', fullName: 'Ravi Teja', org: 'InfraWorks', hostEmployeeId: 'emp-006', officeId: 'off-pun', expectedFrom: `${TODAY}T09:00:00+05:30`, expectedTo: addDays(TODAY, 30) + 'T18:00:00+05:30', status: 'pending_approval', purpose: 'AV maintenance' },
  { id: 'vis-3', kind: 'interview', fullName: 'Sneha Pillai', hostEmployeeId: 'emp-009', officeId: 'off-pun', expectedFrom: `${TODAY}T14:00:00+05:30`, expectedTo: `${TODAY}T16:00:00+05:30`, status: 'checked_in', badgeNo: 'V-1031', checkedInAt: `${TODAY}T13:50:00+05:30`, purpose: 'Panel interview' },
];

// ---------- occupancy & presence ----------
export const checkIns: CheckIn[] = bookings.filter((b) => b.status === 'checked_in').map((b, i) => ({ id: `ci-${i + 1}`, bookingId: b.id, employeeId: b.employeeId, checkedInAt: b.checkedInAt!, isOverride: false, source: 'qr' }));

// live desk state: allocated/fixed seats are occupied; vacant seats are mostly vacant with a little live activity
const VACANT_CYCLE: OccupancyState[] = ['vacant', 'vacant', 'vacant', 'vacant', 'booked', 'vacant', 'vacant', 'checked_in', 'vacant', 'vacant', 'no_show'];
let vci = 0;
export const deskLiveStatus: DeskLiveStatus[] = desks.map((d) => {
  if (!d.isVacant) return { deskId: d.id, state: 'occupied', employeeId: d.empId ? undefined : undefined };
  return { deskId: d.id, state: VACANT_CYCLE[vci++ % VACANT_CYCLE.length] };
});

export const noShowAlerts: NoShowAlert[] = deskLiveStatus.filter((s) => s.state === 'no_show').slice(0, 6).map((s, i) => ({
  id: `ns-${i + 1}`, bookingId: `bk-${String(i + 1).padStart(3, '0')}`, deskId: s.deskId, employeeId: employees[i].id,
  graceMinutes: 15, detectedAt: `${TODAY}T10:00:00+05:30`, escalationLevel: i % 3, resolved: false,
}));

export const attendance: AttendanceCorrelation[] = employees.slice(0, 20).map((e, i) => ({
  employeeId: e.id, date: TODAY, presentOffice: i % 4 !== 0, hrmsPresent: i % 4 !== 0, accessPresent: i % 5 !== 0,
  biometricPresent: i % 6 !== 0, qrPresent: i % 3 !== 0, sources: ['access_control', 'qr'], hoursInOffice: i % 4 === 0 ? 0 : 6 + (i % 4), deskUsed: i % 3 === 0 ? flexDesks[i]?.id : undefined,
}));

// ---------- intelligence & analytics ----------
export const occupancyEvents: OccupancyEvent[] = bookings.slice(0, 20).map((b, i) => ({ id: `oe-${i + 1}`, deskId: b.deskId, type: b.status === 'checked_in' ? 'check_in' : 'booked', state: b.status === 'checked_in' ? 'checked_in' : 'booked', source: b.source, at: b.startsAt, employeeId: b.employeeId }));

export const heatCells: HeatCell[] = desks.map((d, i) => { const u = (i * 37) % 100; return { deskId: d.id, period: 'weekly', level: heatBand(u), utilizationPct: u }; });

export const forecast: ForecastPoint[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, i) => ({
  date: addDays(TODAY, i + 1), scopeType: 'office', scopeLabel: `${day} · Pune`, predictedOccupancy: [83, 78, 71, 64, 31][i], capacity: 100, confidence: [0.9, 0.86, 0.82, 0.8, 0.74][i],
}));

export const collaborationEdges: CollaborationEdge[] = [
  { aEmployeeId: 'emp-001', bEmployeeId: 'emp-006', sharedProjectId: 'pr-mc-ai', proximityScore: 0.82, meetingsCount: 14, period: '30d', optInConfirmed: true },
  { aEmployeeId: 'emp-002', bEmployeeId: 'emp-007', sharedProjectId: 'pr-aci-pay', proximityScore: 0.74, meetingsCount: 9, period: '30d', optInConfirmed: true },
  { aEmployeeId: 'emp-003', bEmployeeId: 'emp-008', sharedProjectId: 'pr-disc-risk', proximityScore: 0.68, meetingsCount: 7, period: '30d', optInConfirmed: true },
];

export const teamSeatingSuggestions: TeamSeatingSuggestion[] = [
  { id: 'ts-1', target: 'team', forEmployeeId: 'emp-010', suggestedDeskIds: [flexDesks[2]?.id, flexDesks[3]?.id, flexDesks[4]?.id].filter(Boolean) as string[], rationale: '6 project members booked nearby in Open Office', nearbyCount: 6 },
  { id: 'ts-2', target: 'manager', forEmployeeId: 'emp-012', suggestedDeskIds: [flexDesks[10]?.id, flexDesks[11]?.id].filter(Boolean) as string[], rationale: 'Your manager is sitting in Phase I', nearbyCount: 1 },
];

export const sustainability: SustainabilityMetric[] = floors.map((f, i) => ({ date: TODAY, floorId: f.id, energyKwh: 360 - i * 60, carbonKg: 200 - i * 30, occupancyPct: [76, 75][i] ?? 75 }));

// ---------- optimization & governance ----------
export const movePlans: MovePlan[] = [
  { id: 'mv-1', code: 'MOVE-001', name: 'Innovation Centre Unit III consolidation', reason: 'Unit III only 5% occupied — fold into Unit I/II', fromFloorId: 'floor-1', toFloorId: 'floor-1', scheduledFor: addDays(TODAY, 20), status: 'planned', estCost: 180000, approverId: 'emp-001', employeeCount: 1 },
  { id: 'mv-2', code: 'MOVE-002', name: 'Cardtronics ODC re-seat', reason: 'ODC Dev at 58% — tighten seating', fromFloorId: 'floor-1', toFloorId: 'floor-1', status: 'draft', employeeCount: 61 },
];
export const moveItems: MoveItem[] = movePlans[0] ? [
  { id: 'mi-1', movePlanId: 'mv-1', employeeId: 'emp-013', fromDeskId: desks.find((d) => d.areaId === 'area-f1-p2-ic-u3')?.id, toDeskId: desks.find((d) => d.areaId === 'area-f1-p2-ic-u1' && d.isVacant)?.id, sequenceNo: 1, done: false },
  { id: 'mi-2', movePlanId: 'mv-1', employeeId: 'emp-014', fromDeskId: desks.filter((d) => d.areaId === 'area-f1-p2-ic-u3')[1]?.id, toDeskId: desks.filter((d) => d.areaId === 'area-f1-p2-ic-u1' && d.isVacant)[1]?.id, sequenceNo: 2, done: false },
] : [];

export const costMetrics: CostMetric[] = [
  { id: 'cm-1', period: 'Jun 2026', scopeType: 'area', scopeId: 'area-f1-p2-ic-u3', scopeLabel: 'Innovation Centre Unit III', totalCost: 420000, utilizationPct: 5, costPerUsedSeat: 420000, consolidationSaving: 4200000, recommendation: 'Only 1 of 20 seats used — consolidate; annual saving ≈ ₹42L' },
  { id: 'cm-2', period: 'Jun 2026', scopeType: 'area', scopeId: 'area-f1-p3-odc-dev', scopeLabel: 'Cardtronics ODC — Development', totalCost: 980000, utilizationPct: 58, costPerUsedSeat: 16100, consolidationSaving: 1800000, recommendation: 'Merge Dev + Prod support wings' },
  { id: 'cm-3', period: 'Jun 2026', scopeType: 'service_line', scopeId: 'sl-data-ai', scopeLabel: 'Data & AI', totalCost: 540000, utilizationPct: 79, costPerUsedSeat: 9800 },
];

export const policies: Policy[] = [
  { id: 'pol-prio', kind: 'priority', code: 'PRIO-DEFAULT', name: 'Booking priority', description: 'Contention resolution order', isActive: true, rules: [
    { id: 'pr-1', when: 'grade in (CEO, VP)', then: 'priority = p1', priority: 10 },
    { id: 'pr-2', when: 'role = Delivery Manager', then: 'priority = p3', priority: 30 },
    { id: 'pr-3', when: 'otherwise', then: 'priority = p4', priority: 100 },
  ] },
  { id: 'pol-window', kind: 'booking_window', code: 'WINDOW-30', name: 'Booking window', description: 'How far ahead employees may book', isActive: true, rules: [{ id: 'pw-1', when: 'role = employee', then: 'window = 30 days', priority: 50 }] },
  { id: 'pol-noshow', kind: 'no_show', code: 'NOSHOW-15', name: 'No-show release', isActive: true, rules: [{ id: 'pn-1', when: 'no check-in within 15 min', then: 'auto-release + alert', priority: 20 }] },
];

export const governanceFindings: GovernanceFinding[] = [
  { id: 'gf-1', severity: 'critical', message: 'Innovation Centre Unit III at 5% occupancy (1/20) for 30 days — consolidation candidate', entityType: 'zone', entityId: 'area-f1-p2-ic-u3', raisedAt: addDays(TODAY, -2) + 'T08:00:00+05:30', resolved: false, policyId: 'pol-prio' },
  { id: 'gf-2', severity: 'warn', message: 'Cardtronics ODC Development Centre at 58% — review seating', entityType: 'zone', entityId: 'area-f1-p3-odc-dev', raisedAt: TODAY + 'T08:00:00+05:30', resolved: false },
  { id: 'gf-3', severity: 'info', message: 'Open Office at 95% — capacity breach risk next Monday (forecast 98%)', entityType: 'zone', entityId: 'area-f1-p2-open', raisedAt: TODAY + 'T08:00:00+05:30', resolved: false },
];

// ---------- AI suggestions (HITL queue) ----------
export const agentSuggestions: AgentSuggestion<Record<string, unknown>>[] = [
  { id: 'as-1', agent: 'cost_optimization', status: 'needs_review', confidence: 0.91, rationale: 'Innovation Centre Unit III at 5% utilisation; folding into Units I/II frees 19 seats.', payload: { scopeLabel: 'Innovation Centre Unit III', annualSaving: 4200000 }, requiresReview: true, createdAt: TODAY + 'T08:00:00+05:30', createdBy: 'agent' },
  { id: 'as-2', agent: 'team_seating', status: 'needs_review', confidence: 0.79, rationale: '6 Mastercard members booked in Open Office; cluster recommended.', payload: { target: 'team', suggestedDeskIds: [flexDesks[2]?.id, flexDesks[3]?.id].filter(Boolean) }, requiresReview: true, createdAt: TODAY + 'T08:10:00+05:30', createdBy: 'agent' },
  { id: 'as-3', agent: 'floorplan_vision', status: 'needs_review', confidence: 0.64, rationale: 'Detected 38 desks + 2 rooms from uploaded PDF (low confidence — review).', payload: { floorId: 'floor-1', detected: 40 }, requiresReview: true, createdAt: TODAY + 'T07:50:00+05:30', createdBy: 'agent' },
];

// ---------- conversational, notifications, executive ----------
export const chatSeed: ChatMessage[] = [
  { id: 'cm-0', role: 'assistant', text: 'Hi! I can book desks, find people, and answer workspace questions. Try "Book a desk tomorrow near my team".', at: TODAY + 'T09:00:00+05:30', actions: [{ label: 'Book a desk', href: '/workspace/booking' }, { label: 'Find a colleague', href: '/workspace/booking?tab=find' }] },
];
export const notifications: Notification[] = [
  { id: 'nt-1', recipientEmployeeId: 'emp-010', kind: 'booking', channel: 'teams', subject: 'Booking confirmed — today', status: 'delivered', read: false, at: TODAY + 'T09:05:00+05:30' },
  { id: 'nt-2', recipientEmployeeId: 'emp-008', kind: 'no_show', channel: 'email', subject: 'No-show: your desk was auto-released', status: 'sent', read: false, at: TODAY + 'T10:01:00+05:30' },
  { id: 'nt-3', recipientEmployeeId: 'emp-012', kind: 'system', channel: 'in_app', subject: 'Your manager booked a desk nearby', status: 'delivered', read: true, at: TODAY + 'T08:40:00+05:30' },
];
export const execKpis: ExecKpi[] = [
  { label: 'Avg utilisation', value: '76', unit: '%', delta: '+4%', dir: 'up' },
  { label: 'Consolidation savings', value: '₹42L', delta: 'identified', dir: 'flat' },
  { label: 'No-show rate', value: '7', unit: '%', delta: '-2%', dir: 'down' },
];

// ---------- platform, privacy, audit, integrations ----------
export const integrations: Integration[] = [
  { id: 'int-hrms', category: 'hrms', provider: 'Workday', status: 'connected', lastSyncAt: TODAY + 'T06:00:00+05:30' },
  { id: 'int-idp', category: 'identity', provider: 'Microsoft Entra ID', status: 'connected', lastSyncAt: TODAY + 'T06:00:00+05:30' },
  { id: 'int-teams', category: 'comms', provider: 'MS Teams', status: 'connected' },
  { id: 'int-wa', category: 'comms', provider: 'WhatsApp Cloud', status: 'disconnected' },
  { id: 'int-cal', category: 'calendar', provider: 'Outlook / Graph', status: 'connected' },
  { id: 'int-access', category: 'access', provider: 'RFID / Biometric', status: 'disconnected' },
  { id: 'int-iot', category: 'facilities', provider: 'IoT Sensors', status: 'disconnected' },
];
export const privacySettings: PrivacySetting[] = employees.slice(0, 12).map((e, i) => ({ employeeId: e.id, locationVisibility: i % 5 === 0 ? 'private' : 'team', showOnSearch: i % 5 !== 0, sharePresence: i % 3 !== 0, collabAnalyticsOptIn: i % 2 === 0, attendanceAnalyticsOptIn: i % 4 === 0 }));
export const viewLogs: PeopleLocationViewLog[] = [
  { id: 'vl-1', actorEmployeeId: 'emp-002', targetEmployeeId: 'emp-010', at: TODAY + 'T09:12:00+05:30', action: 'view_person_location' },
  { id: 'vl-2', actorEmployeeId: 'emp-001', targetEmployeeId: 'emp-008', at: TODAY + 'T09:20:00+05:30', action: 'view_person_location' },
];

export const currentUser: CurrentUser = { employeeId: 'emp-001', name: 'Facility Admin', role: 'facility_manager', scopeType: 'office', scopeId: 'off-pun' };

// ---------- dashboard aggregates ----------
const occupiedCount = deskLiveStatus.filter((s) => s.state === 'occupied').length;
const checkedInCount = deskLiveStatus.filter((s) => s.state === 'checked_in').length;
const bookedCount = deskLiveStatus.filter((s) => s.state === 'booked').length;
const noShowCount = deskLiveStatus.filter((s) => s.state === 'no_show').length;
const vacantCount = deskLiveStatus.filter((s) => s.state === 'vacant').length;
export const kpis: WorkspaceKpis = {
  totalCapacity: desks.length, occupied: occupiedCount, vacant: vacantCount, booked: bookedCount, checkedIn: checkedInCount,
  noShows: noShowCount, utilizationPct: Math.round(((occupiedCount + checkedInCount + bookedCount) / desks.length) * 100),
};
export const monthlyUtilization = [
  { label: 'Jan', util: 71 }, { label: 'Feb', util: 73 }, { label: 'Mar', util: 78 }, { label: 'Apr', util: 74 }, { label: 'May', util: 79 }, { label: 'Jun', util: 76 },
];
export const floorUtilization = floors.map((f) => {
  const t = capacitySummary.find((c) => c.id === `cap-total-${f.id}`);
  return { floor: f.name, util: t?.occPct ?? 0, capacity: t?.capTotal ?? desks.filter((d) => d.floorId === f.id).length };
});
export const serviceLineMix = serviceLines.map((s) => ({ name: s.name, colorHex: s.colorHex, desks: desks.filter((d) => d.serviceLineId === s.id).length }));

// ---------- getters (become GET-by-id API calls) ----------
export const getFloor = (id: string) => floors.find((f) => f.id === id);
export const getDesk = (id: string) => desks.find((d) => d.id === id);
export const getDesksByFloor = (floorId: string) => desks.filter((d) => d.floorId === floorId);
export const getZonesByFloor = (floorId: string) => zones.filter((z) => z.floorId === floorId);
export const getRoomsByFloor = (floorId: string) => meetingRooms.filter((r) => r.floorId === floorId);
export const getElementsByFloor = (floorId: string) => spaceElements.filter((e) => e.floorId === floorId);
export const getEmployee = (id: string) => employees.find((e) => e.id === id);
export const getRoom = (id: string) => meetingRooms.find((r) => r.id === id);
export const getBooking = (id: string) => bookings.find((b) => b.id === id);
export const getLiveStatus = (floorId: string): Record<string, OccupancyState> => Object.fromEntries(deskLiveStatus.filter((s) => getDesk(s.deskId)?.floorId === floorId).map((s) => [s.deskId, s.state]));
export const getMyBookings = (employeeId: string) => bookings.filter((b) => b.employeeId === employeeId);
export const serviceLineName = (id?: string) => serviceLines.find((s) => s.id === id)?.name ?? '—';
export const accountName = (id?: string) => accounts.find((a) => a.id === id)?.name ?? '—';
// new register / capacity getters
export const getAreasByFloor = (floorId: string) => areas.filter((a) => a.floorId === floorId);
export const getArea = (id: string) => areas.find((a) => a.id === id);
export const getSeatRegister = () => seatRegister;
export const getSeatRegisterByFloor = (floorId: string) => seatRegister.filter((r) => r.floorId === floorId);
export const getSeatsByArea = (areaId: string) => seatRegister.filter((r) => r.areaId === areaId);
export const getCapacityByFloor = (floorId: string) => capacitySummary.filter((c) => c.floorId === floorId);
export const getCapacityByArea = (areaId: string) => capacitySummary.find((c) => c.id === `cap-${areaId}`);

// ---------- domain helpers ----------
export const utilisation = (used: number, total: number) => (total ? Math.round((used / total) * 100) : 0);
export const hasOverlap = (deskId: string, startsAt: string, endsAt: string) =>
  bookings.some((b) => b.deskId === deskId && ['held', 'booked', 'checked_in'].includes(b.status) && b.startsAt < endsAt && b.endsAt > startsAt);
/** privacy: never reveal a group smaller than threshold (anti de-anonymisation) */
export const heatmapBins = (rows: { count: number }[], threshold = 5) => rows.map((r) => (r.count < threshold ? { ...r, count: 0, suppressed: true } : { ...r, suppressed: false }));
/** privacy-scoped people search */
export const scopedSearch = (query: string, viewer: CurrentUser) => {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const elevated = viewer.role === 'admin' || viewer.role === 'facility_manager' || viewer.role === 'super_admin';
  return employees.filter((e) => `${e.name} ${e.empNo} ${e.email}`.toLowerCase().includes(q)).filter((e) => {
    const ps = privacySettings.find((p) => p.employeeId === e.id);
    if (!ps) return true;
    if (!ps.showOnSearch && !elevated) return false;
    if (ps.locationVisibility === 'private' && !elevated) return false;
    return true;
  });
};
