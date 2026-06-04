// OASIS — Travel Desk mock data (frontend prototype)
// Flagship request TRV-64393 is grounded in the real HYD→SFO vendor sample in Data/Travel Desk/ (PII-free).

import type {
  Traveller, Vendor, TravelRequest, QuoteOption, FlightSegment, Trip, TravelAlert,
} from './types';

// ---------- helpers ----------
export const inr = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export const fmtDur = (min: number) => `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, '0')}m`;

/** median of a numeric list */
export const median = (xs: number[]) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};

/** verdict of a fare vs the market median */
export const verdict = (fare: number, med: number): 'Good' | 'Average' | 'High' => {
  if (med === 0) return 'Average';
  if (fare <= med * 0.98) return 'Good';
  if (fare >= med * 1.08) return 'High';
  return 'Average';
};

const seg = (
  carrier: string, flightNo: string, date: string, fromCity: string, fromCode: string,
  toCity: string, toCode: string, dep: string, arr: string, durationMin: number, baggage: string, arrNextDay = false,
): FlightSegment => ({ carrier, flightNo, cabin: 'Economy', date, fromCity, fromCode, toCity, toCode, dep, arr, durationMin, baggage, arrNextDay });

// ---------- travellers ----------
export const travellers: Traveller[] = [
  { id: 't1', name: 'Suraj S.', empNo: '5411', grade: 'M2', homeOffice: 'Hyderabad', serviceLine: 'SAM — Partnerships', project: 'Partnerships', email: 'suraj.s@opustechglobal.com', mobile: '+91 96xxx xxxxx', passportNo: 'X•••••37', visa: 'B1/B2', frequentFlyer: 'EK ••••635', seatPref: 'Extra-legroom (window/aisle)', mealPref: 'Non-veg' },
  { id: 't2', name: 'Ananya R.', empNo: '4820', grade: 'M3', homeOffice: 'Pune', serviceLine: 'Cloud', project: 'Hyperscale', email: 'ananya.r@opustechglobal.com', seatPref: 'Aisle', mealPref: 'Veg' },
  { id: 't3', name: 'Vikram N.', empNo: '6190', grade: 'M1', homeOffice: 'Bengaluru', serviceLine: 'Data & AI', project: 'InsightX', email: 'vikram.n@opustechglobal.com', mealPref: 'Veg' },
];

// ---------- vendors ----------
export const vendors: Vendor[] = [
  { id: 'v1', name: 'Sky Travel Fares', email: 'ops@skytravelfares.com', avgTurnaroundHrs: 3, priceIndex: 104, serviceRating: 4.6, winRate: 62, quotesYtd: 148, status: 'Active' },
  { id: 'v2', name: 'Globe Voyages', email: 'desk@globevoyages.in', avgTurnaroundHrs: 5, priceIndex: 99, serviceRating: 4.1, winRate: 27, quotesYtd: 96, status: 'Active' },
  { id: 'v3', name: 'TripBridge Travels', email: 'corp@tripbridge.in', avgTurnaroundHrs: 2, priceIndex: 101, serviceRating: 4.3, winRate: 11, quotesYtd: 64, status: 'Active' },
];

// ---------- flagship comparison: TRV-64393 (HYD → SFO round trip, Economy, international) ----------
// Sky Travel Fares — 4 options (grounded in the real sample)
const skyAI: QuoteOption = {
  id: 'q-sky-ai', source: 'vendor', sourceName: 'Sky Travel Fares', airline: 'Air India', cabin: 'Economy',
  segments: [
    seg('AI — Air India', 'AI 1806', '2026-06-13', 'Hyderabad', 'HYD', 'Delhi', 'DEL', '05:30', '07:55', 145, '1PC'),
    seg('AI — Air India', 'AI 183', '2026-06-13', 'Delhi', 'DEL', 'San Francisco', 'SFO', '10:50', '17:45', 985, '1PC'),
    seg('AI — Air India', 'AI 184', '2026-06-20', 'San Francisco', 'SFO', 'Delhi', 'DEL', '20:45', '05:45', 930, '1PC', true),
    seg('AI — Air India', 'AI 2542', '2026-06-22', 'Delhi', 'DEL', 'Hyderabad', 'HYD', '09:40', '12:00', 140, '1PC'),
  ],
  stops: 1, layovers: ['DEL · 2h 55m'], totalDurationMin: 1390, fare: 128912, refundable: false, refundableFare: 144662,
  baggage: '1PC', changeRule: 'INR 20,000 + fare/tax diff', cancelRule: 'Non-refundable (refundable variant ₹1,44,662)',
  score: 88, inPolicy: true,
};
const skyCX: QuoteOption = {
  id: 'q-sky-cx', source: 'vendor', sourceName: 'Sky Travel Fares', airline: 'Cathay Pacific', cabin: 'Economy',
  segments: [
    seg('CX — Cathay Pacific', 'CX 672', '2026-06-13', 'Hyderabad', 'HYD', 'Hong Kong', 'HKG', '02:40', '11:00', 350, '1PC'),
    seg('CX — Cathay Pacific', 'CX 870', '2026-06-13', 'Hong Kong', 'HKG', 'San Francisco', 'SFO', '13:25', '11:25', 720, '1PC'),
    seg('CX — Cathay Pacific', 'CX 879', '2026-06-20', 'San Francisco', 'SFO', 'Hong Kong', 'HKG', '14:00', '18:55', 905, '1PC', true),
    seg('CX — Cathay Pacific', 'CX 673', '2026-06-21', 'Hong Kong', 'HKG', 'Hyderabad', 'HYD', '22:30', '01:35', 305, '1PC', true),
  ],
  stops: 1, layovers: ['HKG · 2h 25m'], totalDurationMin: 1485, fare: 191473, refundable: false,
  baggage: '1PC', changeRule: 'INR 7,500 + fare/tax diff', cancelRule: 'INR 15,000 + GST',
  score: 68, inPolicy: false, policyNote: 'Over budget cap (₹1,60,000)',
};
const skyEK: QuoteOption = {
  id: 'q-sky-ek', source: 'vendor', sourceName: 'Sky Travel Fares', airline: 'Emirates', cabin: 'Economy',
  segments: [
    seg('EK — Emirates', 'EK 525', '2026-06-13', 'Hyderabad', 'HYD', 'Dubai', 'DXB', '04:40', '06:45', 155, '2PC'),
    seg('EK — Emirates', 'EK 225', '2026-06-13', 'Dubai', 'DXB', 'San Francisco', 'SFO', '09:10', '14:00', 990, '2PC'),
    seg('EK — Emirates', 'EK 226', '2026-06-20', 'San Francisco', 'SFO', 'Dubai', 'DXB', '17:05', '19:40', 920, '2PC', true),
    seg('EK — Emirates', 'EK 524', '2026-06-21', 'Dubai', 'DXB', 'Hyderabad', 'HYD', '21:50', '03:05', 195, '2PC', true),
  ],
  stops: 1, layovers: ['DXB · 2h 25m'], totalDurationMin: 1410, fare: 143432, refundable: false,
  baggage: '2PC', changeRule: 'USD 150 + fare/tax diff', cancelRule: 'USD 200 + GST',
  score: 84, inPolicy: true,
};
const skyLH: QuoteOption = {
  id: 'q-sky-lh', source: 'vendor', sourceName: 'Sky Travel Fares', airline: 'Lufthansa', cabin: 'Economy',
  segments: [
    seg('LH — Lufthansa', 'LH 753', '2026-06-13', 'Hyderabad', 'HYD', 'Frankfurt', 'FRA', '03:10', '09:05', 460, '1PC'),
    seg('LH — Lufthansa', 'LH 454', '2026-06-13', 'Frankfurt', 'FRA', 'San Francisco', 'SFO', '10:25', '12:40', 740, '1PC'),
    seg('LH — Lufthansa', 'LH 455', '2026-06-20', 'San Francisco', 'SFO', 'Frankfurt', 'FRA', '14:40', '10:25', 650, '1PC', true),
    seg('LH — Lufthansa', 'LH 752', '2026-06-21', 'Frankfurt', 'FRA', 'Hyderabad', 'HYD', '13:00', '01:15', 525, '1PC', true),
  ],
  stops: 1, layovers: ['FRA · 1h 20m'], totalDurationMin: 1325, fare: 290664, refundable: false, refundableFare: 299360,
  baggage: '1PC', changeRule: 'EUR 250 + fare/tax diff', cancelRule: 'Non-refundable (refundable ₹2,99,360)',
  score: 58, inPolicy: false, policyNote: 'Over budget cap (₹1,60,000)',
};

// Globe Voyages — 2 options (for the same request)
const globeAI: QuoteOption = {
  ...skyAI, id: 'q-globe-ai', sourceName: 'Globe Voyages', fare: 131200, refundableFare: 146900, score: 85,
};
const globeEK: QuoteOption = {
  ...skyEK, id: 'q-globe-ek', sourceName: 'Globe Voyages', fare: 141900, score: 85,
};

// OASIS AI benchmark (market search — Amadeus / Duffel)
const benchAI: QuoteOption = {
  ...skyAI, id: 'q-bench-ai', source: 'benchmark', sourceName: 'OASIS · Amadeus', fare: 121500, refundableFare: 138000, score: 92,
  changeRule: '—', cancelRule: '—',
};
const benchEK: QuoteOption = {
  ...skyEK, id: 'q-bench-ek', source: 'benchmark', sourceName: 'OASIS · Duffel', fare: 139800, score: 88,
  changeRule: '—', cancelRule: '—',
};

const t64390Sky: QuoteOption = {
  id: 'q2-sky-6e', source: 'vendor', sourceName: 'Sky Travel Fares', airline: 'IndiGo', cabin: 'Economy',
  segments: [seg('6E — IndiGo', '6E 312', '2026-06-18', 'Hyderabad', 'HYD', 'Bengaluru', 'BLR', '08:10', '09:25', 75, '1PC')],
  stops: 0, layovers: [], totalDurationMin: 75, fare: 6480, refundable: false, baggage: '15kg',
  changeRule: 'INR 3,000 + diff', cancelRule: 'INR 3,500', score: 90, inPolicy: true,
};
const t64390Bench: QuoteOption = {
  ...t64390Sky, id: 'q2-bench-6e', source: 'benchmark', sourceName: 'OASIS · TBO', fare: 6120, score: 93, changeRule: '—', cancelRule: '—',
};

export const travelRequests: TravelRequest[] = [
  {
    id: 'r1', code: 'TRV-64393', traveller: travellers[0], tripType: 'Round-trip',
    originCity: 'Hyderabad', originCode: 'HYD', destCity: 'San Francisco', destCode: 'SFO', international: true,
    departDate: '2026-06-13', returnDate: '2026-06-20', cabin: 'Economy', purpose: 'Client meeting — Partnerships',
    entity: 'OSPL', billToClient: false, budget: 160000, status: 'Compared', raisedOn: '2026-05-07', dueBy: '2026-05-26',
    needHotel: true, needTransit: true,
    benchmark: [benchAI, benchEK],
    recommendedOptionId: 'q-sky-ai',
    vendorQuotes: [
      { id: 'vq1', vendorId: 'v1', vendorName: 'Sky Travel Fares', receivedAt: '2026-05-07 10:43', turnaroundHrs: 3, status: 'Received', options: [skyAI, skyEK, skyCX, skyLH] },
      { id: 'vq2', vendorId: 'v2', vendorName: 'Globe Voyages', receivedAt: '2026-05-07 13:10', turnaroundHrs: 6, status: 'Received', options: [globeAI, globeEK] },
      { id: 'vq3', vendorId: 'v3', vendorName: 'TripBridge Travels', status: 'Awaiting', options: [] },
    ],
  },
  {
    id: 'r2', code: 'TRV-64390', traveller: travellers[2], tripType: 'Round-trip',
    originCity: 'Hyderabad', originCode: 'HYD', destCity: 'Bengaluru', destCode: 'BLR', international: false,
    departDate: '2026-06-18', returnDate: '2026-06-19', cabin: 'Economy', purpose: 'Internal review',
    entity: 'OSPL', billToClient: false, budget: 12000, status: 'Compared', raisedOn: '2026-06-02', dueBy: '2026-06-06',
    needHotel: false, needTransit: false,
    benchmark: [t64390Bench],
    recommendedOptionId: 'q2-sky-6e',
    vendorQuotes: [
      { id: 'vq4', vendorId: 'v1', vendorName: 'Sky Travel Fares', receivedAt: '2026-06-02 11:20', turnaroundHrs: 2, status: 'Received', options: [t64390Sky] },
    ],
  },
  {
    id: 'r3', code: 'TRV-64418', traveller: travellers[1], tripType: 'Round-trip',
    originCity: 'Pune', originCode: 'PNQ', destCity: 'Bengaluru', destCode: 'BLR', international: false,
    departDate: '2026-06-24', returnDate: '2026-06-26', cabin: 'Economy', purpose: 'Hyperscale workshop',
    entity: 'OSSPL', billToClient: false, budget: 14000, status: 'Sourcing', raisedOn: '2026-06-03', dueBy: '2026-06-09',
    needHotel: true, needTransit: false, benchmark: [], vendorQuotes: [
      { id: 'vq5', vendorId: 'v1', vendorName: 'Sky Travel Fares', status: 'Awaiting', options: [] },
      { id: 'vq6', vendorId: 'v2', vendorName: 'Globe Voyages', status: 'Awaiting', options: [] },
    ],
  },
  {
    id: 'r4', code: 'TRV-64402', traveller: travellers[1], tripType: 'Round-trip',
    originCity: 'Mumbai', originCode: 'BOM', destCity: 'London', destCode: 'LHR', international: true,
    departDate: '2026-07-02', returnDate: '2026-07-09', cabin: 'Business', purpose: 'Client steering committee',
    entity: 'OCSI', billToClient: true, budget: 420000, status: 'Pending Approval', raisedOn: '2026-06-01', dueBy: '2026-06-05',
    needHotel: true, needTransit: true, benchmark: [], vendorQuotes: [
      { id: 'vq7', vendorId: 'v1', vendorName: 'Sky Travel Fares', receivedAt: '2026-06-01 16:02', turnaroundHrs: 4, status: 'Received', options: [] },
    ],
  },
  {
    id: 'r5', code: 'TRV-64377', traveller: travellers[2], tripType: 'Round-trip',
    originCity: 'Delhi', originCode: 'DEL', destCity: 'Singapore', destCode: 'SIN', international: true,
    departDate: '2026-06-15', returnDate: '2026-06-19', cabin: 'Economy', purpose: 'Vendor audit',
    entity: 'OSPL', billToClient: false, budget: 75000, status: 'Booked', raisedOn: '2026-05-28', dueBy: '2026-06-02',
    needHotel: true, needTransit: false, benchmark: [], vendorQuotes: [],
  },
];

export const getRequest = (id: string) => travelRequests.find((r) => r.id === id || r.code === id);

/** all flight options (vendor + benchmark) for a request — flattened */
export const allOptions = (r: TravelRequest): QuoteOption[] => [
  ...r.vendorQuotes.flatMap((vq) => vq.options),
  ...r.benchmark,
];

// ---------- trips (booked) ----------
export const trips: Trip[] = [
  { id: 'tr1', code: 'TRP-64377', requestCode: 'TRV-64377', traveller: 'Vikram N.', routeLabel: 'DEL → SIN → DEL', airline: 'Singapore Airlines', pnr: 'QF7ZK2', departDate: '2026-06-15', returnDate: '2026-06-19', fare: 68900, vendorName: 'Sky Travel Fares', entity: 'OSPL', status: 'Ticketed', paymentStatus: 'Paid', fareWatch: true },
  { id: 'tr2', code: 'TRP-64355', requestCode: 'TRV-64355', traveller: 'Ananya R.', routeLabel: 'PNQ → DEL → PNQ', airline: 'Vistara', pnr: 'VS1QP8', departDate: '2026-06-09', returnDate: '2026-06-11', fare: 14250, vendorName: 'Globe Voyages', entity: 'OSSPL', status: 'Travelling', paymentStatus: 'Paid', fareWatch: false },
  { id: 'tr3', code: 'TRP-64361', requestCode: 'TRV-64361', traveller: 'Suraj S.', routeLabel: 'HYD → DXB → HYD', airline: 'Emirates', pnr: 'EK9MText', departDate: '2026-06-26', returnDate: '2026-07-01', fare: 96400, vendorName: 'Sky Travel Fares', entity: 'OSPL', status: 'Booked', paymentStatus: 'Advance Due', fareWatch: true },
  { id: 'tr4', code: 'TRP-64310', requestCode: 'TRV-64310', traveller: 'Vikram N.', routeLabel: 'BLR → HYD → BLR', airline: 'IndiGo', pnr: '6ERT44', departDate: '2026-05-22', returnDate: '2026-05-23', fare: 7180, vendorName: 'TripBridge Travels', entity: 'OSPL', status: 'Completed', paymentStatus: 'Paid', fareWatch: false },
];

// ---------- alerts (monitoring) ----------
export const alerts: TravelAlert[] = [
  { id: 'al1', kind: 'fare-drop', tripCode: 'TRP-64361', traveller: 'Suraj S.', routeLabel: 'HYD → DXB → HYD', message: 'Fare dropped ₹11,400 on the booked itinerary', detail: 'Booked ₹96,400 → now ₹85,000. After change penalty ₹5,200, net saving ₹6,200 — worth rebooking.', netSaving: 6200, raisedAt: '2026-06-04 08:10', severity: 'success' },
  { id: 'al2', kind: 'schedule', tripCode: 'TRP-64377', traveller: 'Vikram N.', routeLabel: 'DEL → SIN', message: 'Departure retimed 30 min earlier (SQ403)', detail: 'New departure 23:25 (was 23:55) on 15-Jun. Connection unaffected.', raisedAt: '2026-06-04 06:40', severity: 'warning' },
  { id: 'al3', kind: 'fare-drop', tripCode: 'TRP-64355', traveller: 'Ananya R.', routeLabel: 'PNQ → DEL', message: 'Fare dropped ₹900 — below rebooking threshold', detail: 'Net of penalties this is negative — no action recommended.', netSaving: 0, raisedAt: '2026-06-03 19:05', severity: 'info' },
];

// ---------- dashboard ----------
export const kpis = {
  openRequests: 6,
  awaitingQuotes: 2,
  pendingApproval: 1,
  tripsThisMonth: 11,
  savingsMTD: 184300,
  avgTurnaroundHrs: 3.6,
};

export const monthlySpend = [
  { label: 'Jan', spend: 9.2, savings: 0.7 },
  { label: 'Feb', spend: 11.6, savings: 1.1 },
  { label: 'Mar', spend: 14.1, savings: 1.4 },
  { label: 'Apr', spend: 12.3, savings: 1.0 },
  { label: 'May', spend: 16.8, savings: 1.9 },
  { label: 'Jun', spend: 7.4, savings: 1.84 },
]; // ₹ lakhs

export const topRoutes = [
  { route: 'HYD–SFO', trips: 14, avg: 132000 },
  { route: 'BOM–LHR', trips: 9, avg: 388000 },
  { route: 'DEL–SIN', trips: 12, avg: 64000 },
  { route: 'PNQ–BLR', trips: 22, avg: 9800 },
];
